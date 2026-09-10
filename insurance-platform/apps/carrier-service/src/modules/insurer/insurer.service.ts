import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';
import { CreateInsurerDto, UpdateInsurerDto } from './dtos/insurer.dto';

@Injectable()
export class InsurerService {
  private readonly logger = new Logger(InsurerService.name);

  async getList(query: { search?: string; type?: string; status?: string; region?: string; rating?: string; sortKey?: string; sortDir?: string; page?: number; size?: number }) {
    const { search, type, status, region, rating, sortKey = 'revenue', sortDir = 'desc', page = 1, size = 20 } = query;
    const conditions: string[] = ['deleted = FALSE'];
    const values: any[] = [];
    let paramIdx = 1;

    if (search) { conditions.push(`(carrier_name ILIKE $${paramIdx} OR carrier_name_short ILIKE $${paramIdx} OR naic_code ILIKE $${paramIdx})`); values.push(`%${search}%`); paramIdx++; }
    if (type && type !== 'all') { conditions.push(`carrier_type = $${paramIdx}`); values.push(type); paramIdx++; }
    if (status && status !== 'all') { conditions.push(`status = $${paramIdx}`); values.push(status); paramIdx++; }
    if (region && region !== 'all') { conditions.push(`region = $${paramIdx}`); values.push(region); paramIdx++; }
    if (rating && rating !== 'all') { conditions.push(`am_best_rating = $${paramIdx}`); values.push(rating); paramIdx++; }

    const allowedSorts = ['carrier_name', 'revenue', 'loss_ratio', 'renewal_rate', 'policy_count', 'commission_income', 'created_at'];
    const sortCol = allowedSorts.includes(sortKey) ? sortKey : 'revenue';
    const dir = sortDir === 'asc' ? 'ASC' : 'DESC';

    const offset = (page - 1) * size;
    const countSql = `SELECT COUNT(*) FROM insurance_carrier WHERE ${conditions.join(' AND ')}`;
    const dataSql = `SELECT * FROM insurance_carrier WHERE ${conditions.join(' AND ')} ORDER BY ${sortCol} ${dir} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(size, offset);

    const [countRes, dataRes] = await Promise.all([pool.query(countSql, values.slice(0, paramIdx - 1)), pool.query(dataSql, values)]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  async getById(id: string) {
    const res = await pool.query('SELECT * FROM insurance_carrier WHERE carrier_id = $1 AND deleted = FALSE', [id]);
    if (res.rows.length === 0) throw new NotFoundException(`Insurer ${id} not found`);
    return res.rows[0];
  }

  /** Convert raw PostgreSQL errors into user-friendly HTTP exceptions */
  private handlePgError(err: any, context: string): never {
    this.logger.error(`[${context}] DB error: ${err?.code} — ${err?.message}`);
    switch (err?.code) {
      case '23505': { // unique_violation
        const constraint = err?.constraint || '';
        if (constraint.includes('naic_code')) {
          throw new ConflictException({
            error: 'NAIC_DUPLICATE',
            message: `NAIC Code already exists. Each insurer must have a unique NAIC Code.`,
            field: 'naic_code',
          });
        }
        throw new ConflictException({
          error: 'DUPLICATE',
          message: `A record with the same unique identifier already exists (${constraint}).`,
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
      case '22001': { // string_data_right_truncation (value too long)
        const col = err?.column || 'unknown';
        throw new BadRequestException({
          error: 'VALUE_TOO_LONG',
          message: `The value for "${col}" exceeds the maximum allowed length. Please shorten your input.`,
          field: col,
        });
      }
      case '22P02': { // invalid_text_representation
        throw new BadRequestException({
          error: 'INVALID_FORMAT',
          message: 'One or more fields have an invalid format. Please check your input.',
        });
      }
      case '23503': { // foreign_key_violation
        throw new BadRequestException({
          error: 'REFERENCE_ERROR',
          message: 'The record references data that does not exist or is still in use.',
        });
      }
      default:
        throw new BadRequestException({
          error: 'DATABASE_ERROR',
          message: `An unexpected database error occurred while ${context}. Please try again or contact support.`,
        });
    }
  }

  /** Check if a NAIC code is available among non-deleted (list-visible) records */
  async checkNaicAvailable(naicCode: string, excludeId?: string): Promise<{ available: boolean; existingId?: string }> {
    // NOTE: naic_code uniqueness is enforced by a PARTIAL unique index (WHERE deleted = FALSE),
    // so soft-deleted records do NOT block reusing the same NAIC code. Only check non-deleted rows.
    let sql = 'SELECT carrier_id FROM insurance_carrier WHERE naic_code = $1 AND deleted = FALSE';
    const params: any[] = [naicCode];
    if (excludeId) {
      sql += ' AND carrier_id != $2';
      params.push(excludeId);
    }
    const res = await pool.query(sql, params);
    if (res.rows.length > 0) {
      return { available: false, existingId: res.rows[0].carrier_id };
    }
    return { available: true };
  }

  async create(dto: CreateInsurerDto, userId: string) {
    const id = 'c' + Date.now().toString(36);
    const cols = ['carrier_id', 'naic_code', 'carrier_name'];
    const vals: any[] = [id, dto.naic_code, dto.carrier_name];
    const placeholders = ['$1', '$2', '$3'];
    let idx = 4;
    const optional: [string, any][] = [
      ['carrier_name_short', dto.carrier_name_short], ['carrier_type', dto.carrier_type], ['status', dto.status], ['region', dto.region],
      ['state', dto.state], ['coop_type', dto.coop_type], ['founded_year', dto.founded_year],
      ['website', dto.website], ['am_best_rating', dto.am_best_rating], ['sp_rating', dto.sp_rating],
      ['moodys_rating', dto.moodys_rating], ['fitch_rating', dto.fitch_rating], ['settlement_cycle', dto.settlement_cycle],
      ['contract_expiry', dto.contract_expiry], ['lines', dto.lines ? JSON.stringify(dto.lines) : undefined],
    ];
    for (const [col, val] of optional) {
      if (val !== undefined) { cols.push(col); vals.push(val); placeholders.push(`$${idx++}`); }
    }
    // Pre-flight: check NAIC uniqueness before INSERT
    const naicCheck = await this.checkNaicAvailable(dto.naic_code);
    if (!naicCheck.available) {
      throw new ConflictException({
        error: 'NAIC_DUPLICATE',
        message: `NAIC Code "${dto.naic_code}" is already in use by insurer ${naicCheck.existingId}. Please use a different NAIC Code.`,
        field: 'naic_code',
        existingId: naicCheck.existingId,
      });
    }
    const sql = `INSERT INTO insurance_carrier (${cols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`;
    try {
      const res = await pool.query(sql, vals);
      this.logger.log(`Created insurer ${id} (NAIC: ${dto.naic_code}) by user ${userId}`);
      return res.rows[0];
    } catch (err: any) {
      this.handlePgError(err, 'creating insurer');
    }
  }

  async update(id: string, dto: UpdateInsurerDto) {
    // If NAIC code is being changed, check uniqueness
    if (dto.naic_code) {
      const naicCheck = await this.checkNaicAvailable(dto.naic_code, id);
      if (!naicCheck.available) {
        throw new ConflictException({
          error: 'NAIC_DUPLICATE',
          message: `NAIC Code "${dto.naic_code}" is already in use by insurer ${naicCheck.existingId}. Please use a different NAIC Code.`,
          field: 'naic_code',
          existingId: naicCheck.existingId,
        });
      }
    }
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    const fields = Object.entries(dto).filter(([, v]) => v !== undefined);
    for (const [key, val] of fields) {
      sets.push(`${key} = $${idx++}`);
      vals.push(key === 'lines' ? JSON.stringify(val) : val);
    }
    if (sets.length === 0) return this.getById(id);
    sets.push(`updated_at = NOW()`);
    vals.push(id);
    const sql = `UPDATE insurance_carrier SET ${sets.join(', ')} WHERE carrier_id = $${idx} AND deleted = FALSE RETURNING *`;
    try {
      const res = await pool.query(sql, vals);
      if (res.rows.length === 0) throw new NotFoundException(`Insurer ${id} not found`);
      this.logger.log(`Updated insurer ${id} (${fields.length} fields)`);
      return res.rows[0];
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      this.handlePgError(err, 'updating insurer');
    }
  }

  async toggleStatus(id: string) {
    const res = await pool.query(
      `UPDATE insurance_carrier SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END, updated_at = NOW() WHERE carrier_id = $1 AND deleted = FALSE RETURNING *`,
      [id],
    );
    if (res.rows.length === 0) throw new NotFoundException(`Insurer ${id} not found`);
    return res.rows[0];
  }

  async batchToggleStatus(ids: string[], targetStatus: 'active' | 'inactive') {
    if (!ids || ids.length === 0) return { updated: 0 };
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const res = await pool.query(
      `UPDATE insurance_carrier SET status = $${ids.length + 1}, updated_at = NOW() WHERE carrier_id IN (${placeholders}) AND deleted = FALSE`,
      [...ids, targetStatus],
    );
    return { updated: res.rowCount ?? 0 };
  }

  async remove(id: string) {
    const res = await pool.query('UPDATE insurance_carrier SET deleted = TRUE, updated_at = NOW() WHERE carrier_id = $1 RETURNING carrier_id', [id]);
    if (res.rows.length === 0) throw new NotFoundException(`Insurer ${id} not found`);
    return { deleted: true };
  }

  async batchRemove(ids: string[]) {
    if (!ids || ids.length === 0) return { deleted: 0 };
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const res = await pool.query(
      `UPDATE insurance_carrier SET deleted = TRUE, updated_at = NOW() WHERE carrier_id IN (${placeholders}) AND deleted = FALSE`,
      ids,
    );
    return { deleted: res.rowCount ?? 0 };
  }

  async duplicateCheck() {
    const res = await pool.query(`
      SELECT a.carrier_id AS id1, b.carrier_id AS id2, a.carrier_name AS name1, b.carrier_name AS name2,
             a.naic_code, similarity(a.carrier_name, b.carrier_name) AS sim
      FROM insurance_carrier a JOIN insurance_carrier b ON a.carrier_id < b.carrier_id AND a.deleted = FALSE AND b.deleted = FALSE
      WHERE a.naic_code = b.naic_code OR similarity(a.carrier_name, b.carrier_name) > 0.8
      ORDER BY sim DESC LIMIT 20
    `);
    return res.rows;
  }
}
