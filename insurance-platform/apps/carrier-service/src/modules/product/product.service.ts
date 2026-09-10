import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';
import { CreateProductDto, UpdateProductDto } from './dtos/product.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  /** Expose DB primary key product_id as `id` so frontend ProductRecord.id is populated at runtime */
  private withId(row: any) {
    return row ? { ...row, id: row.product_id } : row;
  }

  /** jsonb columns of insurance_product — values must be JSON.stringified before binding,
   *  otherwise pg throws "invalid input syntax for type json" (e.g. blacklist_conditions sent as a JS array). */
  private static readonly JSONB_COLS = ['coverages', 'available_states', 'rate_factors', 'blacklist_conditions', 'documents'];

  /** Translate raw pg errors into HTTP responses the form can render.
   *  Without this a 23505 on product_code surfaced as a bare 500 "Internal server error",
   *  which the UI could only show as a generic "保存失败". */
  private handlePgError(err: any, context: string): never {
    this.logger.error(`[${context}] DB error: ${err?.code} — ${err?.message}`);
    switch (err?.code) {
      case '23505': { // unique_violation
        if ((err?.constraint || '').includes('product_code')) {
          throw new ConflictException({
            error: 'PRODUCT_CODE_DUPLICATE',
            message: `Product code "${err?.detail ?? ''}" is already in use. Please use a different product code.`,
            field: 'product_code',
          });
        }
        throw new ConflictException({
          error: 'DUPLICATE',
          message: `A record with the same unique identifier already exists (${err?.constraint || 'unknown'}).`,
        });
      }
      case '23502': { // not_null_violation
        const col = err?.column || 'unknown';
        throw new BadRequestException({
          error: 'REQUIRED_FIELD',
          message: `Required field "${col}" is missing. Please fill in all required fields.`,
          field: col,
        });
      }
      case '22001': // string_data_right_truncation
        throw new BadRequestException({
          error: 'VALUE_TOO_LONG',
          message: `Value for "${err?.column || 'unknown'}" exceeds the maximum allowed length.`,
          field: err?.column,
        });
      default:
        throw err;
    }
  }

  /** Check whether a product code is free among non-deleted (list-visible) products.
   *  product_code uniqueness is enforced by the PARTIAL unique index uq_insurance_product_code_live
   *  (WHERE deleted = FALSE), so a soft-deleted product does NOT block reusing its code. */
  async checkCodeAvailable(productCode: string, excludeId?: string): Promise<{ available: boolean; existingId?: string }> {
    let sql = 'SELECT product_id FROM insurance_product WHERE product_code = $1 AND deleted = FALSE';
    const params: any[] = [productCode];
    if (excludeId) { sql += ' AND product_id != $2'; params.push(excludeId); }
    const res = await pool.query(sql, params);
    if (res.rows.length > 0) return { available: false, existingId: res.rows[0].product_id };
    return { available: true };
  }

  /** Throw 409 when the code is taken by another live product — called before INSERT/UPDATE so the
   *  response can name the conflicting product id instead of relying on the index error text. */
  private async assertCodeAvailable(productCode: string, excludeId?: string) {
    const check = await this.checkCodeAvailable(productCode, excludeId);
    if (!check.available) {
      throw new ConflictException({
        error: 'PRODUCT_CODE_DUPLICATE',
        message: `Product code "${productCode}" is already in use by product ${check.existingId}. Please use a different product code.`,
        field: 'product_code',
        existingId: check.existingId,
      });
    }
  }

  async getList(query: { search?: string; insurer?: string; line?: string; status?: string; sortKey?: string; sortDir?: string; page?: number; size?: number }) {
    const { search, insurer, line, status, sortKey = 'premium_ytd', sortDir = 'desc', page = 1, size = 20 } = query;
    const conditions: string[] = ['p.deleted = FALSE'];
    const values: any[] = [];
    let pi = 1;
    if (search) { conditions.push(`(p.product_name ILIKE $${pi} OR p.product_code ILIKE $${pi})`); values.push(`%${search}%`); pi++; }
    if (insurer && insurer !== 'all') { conditions.push(`p.carrier_id = $${pi}`); values.push(insurer); pi++; }
    if (line && line !== 'all') { conditions.push(`p.line_of_business = $${pi}`); values.push(line.toUpperCase()); pi++; }
    if (status && status !== 'all') { conditions.push(`p.status = $${pi}`); values.push(status); pi++; }

    const allowed = ['product_name', 'premium_ytd', 'loss_ratio', 'renewal_rate', 'policy_count', 'created_at'];
    const col = allowed.includes(sortKey) ? sortKey : 'premium_ytd';
    const dir = sortDir === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * size;

    const countSql = `SELECT COUNT(*) FROM insurance_product p WHERE ${conditions.join(' AND ')}`;
    const dataSql = `SELECT p.*, c.carrier_name as carrier_name_join FROM insurance_product p LEFT JOIN insurance_carrier c ON p.carrier_id = c.carrier_id WHERE ${conditions.join(' AND ')} ORDER BY p.${col} ${dir} LIMIT $${pi} OFFSET $${pi + 1}`;
    values.push(size, offset);
    const [c, d] = await Promise.all([pool.query(countSql, values.slice(0, pi - 1)), pool.query(dataSql, values)]);
    // Merge carrier_name from join if not already set
    const rows = d.rows.map(r => ({ ...r, id: r.product_id, carrier_name: r.carrier_name || r.carrier_name_join }));
    return { data: rows, total: parseInt(c.rows[0].count, 10), page, size };
  }

  async getById(id: string) {
    const res = await pool.query(
      `SELECT p.*, c.carrier_name
       FROM insurance_product p
       LEFT JOIN insurance_carrier c ON p.carrier_id = c.carrier_id
       WHERE p.product_id = $1 AND p.deleted = FALSE`, [id]);
    if (!res.rows.length) throw new NotFoundException(`Product ${id} not found`);
    return this.withId(res.rows[0]);
  }

  async create(dto: CreateProductDto, userId: string) {
    await this.assertCodeAvailable(dto.product_code);
    const id = 'p' + Date.now().toString(36);
    const cols = ['product_id', 'carrier_id', 'product_name', 'product_code', 'line_of_business'];
    const vals: any[] = [id, dto.carrier_id, dto.product_name, dto.product_code, dto.line_of_business];
    const ph = ['$1', '$2', '$3', '$4', '$5'];
    let idx = 6;
    const opt: [string, any][] = [
      ['short_name', dto.short_name], ['naic_code', dto.naic_code], ['naic_form_number', dto.naic_form_number],
      ['description', dto.description], ['description_en', dto.description_en],
      ['coverages', dto.coverages ? JSON.stringify(dto.coverages) : undefined],
      ['sub_line', dto.sub_line], ['product_type', dto.product_type], ['insurer_name', dto.insurer_name],
      ['underwriting_mode', dto.underwriting_mode], ['max_policy_limit', dto.max_policy_limit],
      ['mga_negotiation', dto.mga_negotiation], ['renewal_type', dto.renewal_type],
      ['policy_term_years', dto.policy_term_years],
      ['available_states', dto.available_states ? JSON.stringify(dto.available_states) : undefined],
      ['effective_date', dto.effective_date], ['expiration_date', dto.expiration_date],
      ['rate_type', dto.rate_type], ['base_rate', dto.base_rate], ['min_premium', dto.min_premium],
      ['max_premium', dto.max_premium],
      ['rate_factors', dto.rate_factors ? JSON.stringify(dto.rate_factors) : undefined],
      ['age_min', dto.age_min], ['age_max', dto.age_max],
      ['exclude_dui', dto.exclude_dui], ['refer_high_value', dto.refer_high_value],
      ['refer_threshold', dto.refer_threshold],
      ['blacklist_conditions', dto.blacklist_conditions ? JSON.stringify(dto.blacklist_conditions) : undefined],
      ['documents', dto.documents ? JSON.stringify(dto.documents) : undefined],
      ['status', dto.status], ['is_active', dto.is_active],
    ];
    for (const [c, v] of opt) { if (v !== undefined) { cols.push(c); vals.push(v); ph.push(`$${idx++}`); } }
    const sql = `INSERT INTO insurance_product (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`;
    try {
      return this.withId((await pool.query(sql, vals)).rows[0]);
    } catch (err: any) {
      this.handlePgError(err, 'creating product');
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    if (dto.product_code) await this.assertCodeAvailable(dto.product_code, id);
    const sets: string[] = []; const vals: any[] = []; let idx = 1;
    for (const [k, v] of Object.entries(dto).filter(([, v]) => v !== undefined)) {
      sets.push(`${k} = $${idx++}`);
      vals.push(ProductService.JSONB_COLS.includes(k) ? JSON.stringify(v) : v);
    }
    if (!sets.length) return this.getById(id);
    sets.push('updated_at = NOW()'); vals.push(id);
    const sql = `UPDATE insurance_product SET ${sets.join(', ')} WHERE product_id = $${idx} AND deleted = FALSE RETURNING *`;
    try {
      const res = await pool.query(sql, vals);
      if (!res.rows.length) throw new NotFoundException(`Product ${id} not found`);
      return this.withId(res.rows[0]);
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      this.handlePgError(err, 'updating product');
    }
  }

  async toggleStatus(id: string) {
    const res = await pool.query(
      `UPDATE insurance_product SET status = CASE WHEN status = 'Active' THEN 'Paused' ELSE 'Active' END,
       is_active = CASE WHEN is_active THEN FALSE ELSE TRUE END, updated_at = NOW()
       WHERE product_id = $1 AND deleted = FALSE RETURNING *`, [id]);
    if (!res.rows.length) throw new NotFoundException(`Product ${id} not found`);
    return this.withId(res.rows[0]);
  }

  async remove(id: string) {
    const res = await pool.query('UPDATE insurance_product SET deleted = TRUE, updated_at = NOW() WHERE product_id = $1 RETURNING product_id', [id]);
    if (!res.rows.length) throw new NotFoundException(`Product ${id} not found`);
    return { deleted: true };
  }

  /** Batch set status for multiple products (Active / Paused / Inactive) */
  async batchToggleStatus(ids: string[], targetStatus: string) {
    if (!ids || ids.length === 0) return { updated: 0 };
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const isActive = targetStatus === 'Active';
    const res = await pool.query(
      `UPDATE insurance_product SET status = $${ids.length + 1}, is_active = $${ids.length + 2}, updated_at = NOW()
       WHERE product_id IN (${placeholders}) AND deleted = FALSE`,
      [...ids, targetStatus, isActive],
    );
    return { updated: res.rowCount ?? 0 };
  }

  /** Batch soft-delete multiple products */
  async batchRemove(ids: string[]) {
    if (!ids || ids.length === 0) return { deleted: 0 };
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const res = await pool.query(
      `UPDATE insurance_product SET deleted = TRUE, updated_at = NOW() WHERE product_id IN (${placeholders}) AND deleted = FALSE`,
      ids,
    );
    return { deleted: res.rowCount ?? 0 };
  }
}
