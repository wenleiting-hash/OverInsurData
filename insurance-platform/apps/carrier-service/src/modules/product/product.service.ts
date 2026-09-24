import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { pool } from '../../database/drizzle.client';
import { CreateProductDto, UpdateProductDto, ToggleProductStatusDto } from './dtos/product.dto';
import { US_STATE_NAMES } from './product.constants';

/** 一次上下架变更的完整负载（立即执行或存入 pending_change 定时执行）。 */
interface StatusChange {
  action: 'list' | 'delist';
  scope: 'all' | 'selected';
  /** 指定州下架/恢复时的州代码；全部下架时由服务端写入当时全部 active 州，用于重新上架时恢复。 */
  states: string[];
  reason: string;
  remark: string | null;
}

interface StatusOperator {
  userId: string;
  username: string;
}

@Injectable()
export class ProductService implements OnModuleInit {
  private readonly logger = new Logger(ProductService.name);

  /** 服务启动 10s 后扫描一次到点变更，之后每 60s 扫描一次（读取路径另有懒执行兜底）。 */
  onModuleInit() {
    setTimeout(() => {
      this.applyDueStatusChanges()
        .catch(e => this.logger.error(`Initial pending status sweep failed: ${e?.message}`));
      setInterval(() => {
        this.applyDueStatusChanges()
          .catch(e => this.logger.error(`Pending status sweep failed: ${e?.message}`));
      }, 60_000);
    }, 10_000);
  }

  /** 与 user.service 相同的审计写法：auth_operation_log 是全库共享的操作审计表。 */
  private async logAudit(config: {
    operator: StatusOperator; action: string; targetId: string;
    success: boolean; params?: Record<string, unknown>;
  }) {
    try {
      await pool.query(
        `INSERT INTO auth_operation_log
           (log_id, user_id, username, action, module, target_type, target_id, success, request_params, extra_data, created_at)
         VALUES (replace(gen_random_uuid()::text, '-', ''), $1, $2, $3, 'product', 'product', $4, $5, $6, $7::jsonb, NOW())`,
        [
          // log_id/user_id 都是 varchar(32)：UUID 去横杠后恰好 32 位（原始 userId 保留在 extra_data.operator 中）
          config.operator.userId ? config.operator.userId.replace(/-/g, '').slice(0, 32) : null,
          config.operator.username ? config.operator.username.slice(0, 64) : null,
          config.action,
          config.targetId,
          config.success.toString(),
          config.params ? JSON.stringify(config.params) : null,
          JSON.stringify({ operator: config.operator }),
        ],
      );
    } catch (err: unknown) {
      this.logger.warn(`Failed to log audit: ${(err as Error).message}`);
    }
  }

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
    await this.applyDueStatusChanges();
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
    await this.applyDueStatusChanges();
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
      ['available_states', dto.available_states ? JSON.stringify(ProductService.normalizeStateCodes(dto.available_states)) : undefined],
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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const row = (await client.query(sql, vals)).rows[0];
      // 可售州主数据同步到 product_state，供详情州 tab / 单州暂停 / 按州下架使用
      await this.syncProductStates(client, id, dto.available_states ?? [], dto.effective_date ?? null);
      await client.query('COMMIT');
      return this.withId(row);
    } catch (err: any) {
      await client.query('ROLLBACK').catch(() => undefined);
      this.handlePgError(err, 'creating product');
    } finally {
      client.release();
    }
  }

  /** 可售州代码统一规范化：trim/大写/去重，且必须是合法美国州代码（与 syncProductStates 共用）。 */
  private static normalizeStateCodes(codes: string[]): string[] {
    return Array.from(new Set(
      (codes ?? []).map(s => String(s).trim().toUpperCase()).filter(c => US_STATE_NAMES[c]),
    ));
  }

  /**
   * 将表单主数据 available_states 同步到 product_state（同一事务内调用）：
   * - 清单内且无行：补录 active/enabled 行（effective_date 取产品生效日）；
   * - 清单内但历史行为 not-available/pending：提升为 active；已是 suspended 的运营暂停态保留；
   * - 清单外：置 not-available + enabled=false（详情州 tab 显示"未开通"），保留 channel_count 等演示列。
   */
  private async syncProductStates(
    client: PoolClient,
    productId: string,
    stateCodes: string[],
    effectiveDate: string | Date | null,
  ) {
    const codes = ProductService.normalizeStateCodes(stateCodes);
    const names = codes.map(c => US_STATE_NAMES[c]);
    await client.query(
      `INSERT INTO product_state (product_id, state_code, state_name, enabled, status, effective_date)
       SELECT $1, t.code, t.name, TRUE, 'active', $3::date
       FROM unnest($2::text[], $4::text[]) AS t(code, name)
       ON CONFLICT (product_id, state_code) DO NOTHING`,
      [productId, codes, effectiveDate ?? null, names],
    );
    await client.query(
      `UPDATE product_state SET status = 'active', enabled = TRUE, updated_at = NOW()
       WHERE product_id = $1 AND state_code = ANY($2) AND status IN ('not-available', 'pending')`,
      [productId, codes],
    );
    await client.query(
      `UPDATE product_state SET status = 'not-available', enabled = FALSE, updated_at = NOW()
       WHERE product_id = $1 AND NOT (state_code = ANY($2))`,
      [productId, codes],
    );
  }

  async update(id: string, dto: UpdateProductDto) {
    if (dto.product_code) await this.assertCodeAvailable(dto.product_code, id);
    const sets: string[] = []; const vals: any[] = []; let idx = 1;
    for (const [k, v] of Object.entries(dto).filter(([, v]) => v !== undefined)) {
      sets.push(`${k} = $${idx++}`);
      if (k === 'available_states') vals.push(JSON.stringify(ProductService.normalizeStateCodes(v as string[])));
      else vals.push(ProductService.JSONB_COLS.includes(k) ? JSON.stringify(v) : v);
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let row: any;
      if (sets.length) {
        sets.push('updated_at = NOW()'); vals.push(id);
        const sql = `UPDATE insurance_product SET ${sets.join(', ')} WHERE product_id = $${idx} AND deleted = FALSE RETURNING *`;
        const res = await client.query(sql, vals);
        if (!res.rows.length) throw new NotFoundException(`Product ${id} not found`);
        row = res.rows[0];
      } else {
        const res = await client.query(
          'SELECT * FROM insurance_product WHERE product_id = $1 AND deleted = FALSE', [id]);
        if (!res.rows.length) throw new NotFoundException(`Product ${id} not found`);
        row = res.rows[0];
      }
      // 可售州在表单中被编辑时，同步 product_state（暂停等运营态在 syncProductStates 内保留）
      if (dto.available_states !== undefined) {
        await this.syncProductStates(client, id, dto.available_states, row.effective_date ?? null);
      }
      await client.query('COMMIT');
      return this.withId(row);
    } catch (err: any) {
      await client.query('ROLLBACK').catch(() => undefined);
      if (err instanceof NotFoundException) throw err;
      this.handlePgError(err, 'updating product');
    } finally {
      client.release();
    }
  }

  /**
   * 上下架（V1.0.10 起为完整语义）：
   * - 原因/备注/范围/州清单全部落库，并写 auth_operation_log 审计；
   * - scope=all + 下架：产品置 Paused 并暂停当时全部 active 州（州清单记录在 status_change_states，上架时原样恢复）；
   * - scope=selected：仅暂停/恢复 product_state 中指定州，产品级状态保持 Active；
   * - effectiveAt 为未来时间：不改当前状态，负载写入 pending_change，由定时扫描/读取懒执行到点落地。
   */
  async toggleStatus(id: string, dto: ToggleProductStatusDto, operator: StatusOperator) {
    await this.applyDueStatusChanges();
    const cur = await pool.query(
      'SELECT * FROM insurance_product WHERE product_id = $1 AND deleted = FALSE', [id],
    );
    if (!cur.rows.length) throw new NotFoundException(`Product ${id} not found`);
    const current = cur.rows[0];

    const action: StatusChange['action'] =
      (dto.action as StatusChange['action'] | undefined) ?? (current.status === 'Active' ? 'delist' : 'list');
    const scope: StatusChange['scope'] = dto.scope === 'selected' ? 'selected' : 'all';
    const states = Array.from(new Set((dto.states ?? []).filter(Boolean)));

    if (scope === 'selected') {
      if (action === 'list') throw new BadRequestException('State-scoped listing is not supported; relist applies to the whole product.');
      if (states.length === 0) throw new BadRequestException('states must contain at least one state code when scope is "selected".');
      const active = await pool.query(
        `SELECT state_code FROM product_state WHERE product_id = $1 AND status = 'active' AND state_code = ANY($2)`,
        [id, states],
      );
      const activeCodes = new Set(active.rows.map(r => r.state_code));
      const invalid = states.filter(s => !activeCodes.has(s));
      if (invalid.length) throw new BadRequestException(`States not currently active for this product: ${invalid.join(', ')}`);
    }
    if (action === 'delist' && scope === 'all' && current.status !== 'Active') {
      throw new BadRequestException(`Product is already ${current.status}; delist requires an Active product.`);
    }
    if (action === 'list' && current.status === 'Active' && !current.pending_change) {
      throw new BadRequestException('Product is already Active.');
    }

    let when: Date | null = null;
    if (dto.effectiveAt) {
      const parsed = new Date(dto.effectiveAt);
      if (Number.isNaN(parsed.getTime())) throw new BadRequestException('effectiveAt must be a valid ISO date string.');
      when = parsed;
    }
    const change: StatusChange = { action, scope, states, reason: dto.reason, remark: dto.remark?.trim() || null };

    // 定时生效：当前状态不动，等待扫描/懒执行
    if (when && when.getTime() > Date.now()) {
      const res = await pool.query(
        `UPDATE insurance_product
         SET pending_change = $2::jsonb, status_effective_at = $3, updated_at = NOW()
         WHERE product_id = $1 AND deleted = FALSE RETURNING *`,
        [id, JSON.stringify(change), when.toISOString()],
      );
      await this.logAudit({
        operator,
        action: action === 'delist' ? 'PRODUCT_DELIST_SCHEDULED' : 'PRODUCT_LIST_SCHEDULED',
        targetId: id, success: true,
        params: { ...change, effectiveAt: when.toISOString() },
      });
      return { ...this.withId(res.rows[0]), scheduled: true };
    }

    const updated = await this.applyStatusChange(current, change, operator, 'immediate');
    return { ...this.withId(updated), scheduled: false };
  }

  /**
   * 落地一次状态变更（立即或到点执行共用）。州暂停/恢复与产品主状态在同一事务内提交，
   * 避免「产品已 Paused 但州仍 active」的中间态。
   */
  private async applyStatusChange(current: any, change: StatusChange, operator: StatusOperator, source: 'immediate' | 'scheduler') {
    const id = current.product_id;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let nextStatus = current.status;
      let nextIsActive = current.is_active;
      let storedStates: string[] = change.scope === 'selected' ? change.states : [];

      if (change.action === 'delist') {
        if (change.scope === 'all') {
          const sr = await client.query(
            `SELECT state_code FROM product_state WHERE product_id = $1 AND status = 'active'`, [id],
          );
          storedStates = sr.rows.map(r => r.state_code);
          await client.query(
            `UPDATE product_state SET status = 'suspended', updated_at = NOW()
             WHERE product_id = $1 AND status = 'active'`, [id],
          );
          nextStatus = 'Paused';
          nextIsActive = false;
        } else {
          await client.query(
            `UPDATE product_state SET status = 'suspended', updated_at = NOW()
             WHERE product_id = $1 AND status = 'active' AND state_code = ANY($2)`,
            [id, storedStates],
          );
          // 指定州下架：产品级状态保持 Active
          nextStatus = 'Active';
          nextIsActive = true;
        }
      } else {
        // 上架：恢复下架时记录在 status_change_states 中的州；没有记录则恢复全部 suspended 州
        const prev: string[] = Array.isArray(current.status_change_states) ? current.status_change_states : [];
        if (prev.length) {
          await client.query(
            `UPDATE product_state SET status = 'active', updated_at = NOW()
             WHERE product_id = $1 AND status = 'suspended' AND state_code = ANY($2)`,
            [id, prev],
          );
        } else {
          await client.query(
            `UPDATE product_state SET status = 'active', updated_at = NOW()
             WHERE product_id = $1 AND status = 'suspended'`, [id],
          );
        }
        nextStatus = 'Active';
        nextIsActive = true;
        storedStates = prev;
      }

      const res = await client.query(
        `UPDATE insurance_product SET
           status = $2, is_active = $3,
           status_reason = $4, status_remark = $5,
           status_change_scope = $6, status_change_states = $7::jsonb,
           status_changed_at = NOW(), status_changed_by = $8,
           pending_change = NULL, status_effective_at = NULL, updated_at = NOW()
         WHERE product_id = $1 RETURNING *`,
        [id, nextStatus, nextIsActive, change.reason, change.remark, change.scope,
          JSON.stringify(storedStates), operator.username || operator.userId],
      );
      await client.query('COMMIT');

      await this.logAudit({
        operator,
        action: change.action === 'delist'
          ? (change.scope === 'selected' ? 'PRODUCT_DELIST_STATES' : 'PRODUCT_DELIST')
          : 'PRODUCT_LIST',
        targetId: id, success: true,
        params: { ...change, states: storedStates, source },
      });
      return res.rows[0];
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      await this.logAudit({
        operator,
        action: change.action === 'delist' ? 'PRODUCT_DELIST_FAILED' : 'PRODUCT_LIST_FAILED',
        targetId: id, success: false,
        params: { ...change, source, error: (err as Error)?.message },
      });
      throw err;
    } finally {
      client.release();
    }
  }

  /** 找到点的定时变更并落地（容错：单条失败不影响其他产品，失败的保留 pending 等下一轮）。 */
  private async applyDueStatusChanges() {
    const due = await pool.query(
      `SELECT * FROM insurance_product
       WHERE pending_change IS NOT NULL AND status_effective_at IS NOT NULL
         AND status_effective_at <= NOW() AND deleted = FALSE`,
    );
    for (const row of due.rows) {
      try {
        await this.applyStatusChange(
          row,
          row.pending_change as StatusChange,
          { userId: 'system', username: 'system:scheduler' },
          'scheduler',
        );
      } catch (e: any) {
        this.logger.error(`Scheduled status change failed for ${row.product_id}: ${e?.message}`);
      }
    }
  }

  async remove(id: string) {
    const res = await pool.query('UPDATE insurance_product SET deleted = TRUE, updated_at = NOW() WHERE product_id = $1 RETURNING product_id', [id]);
    if (!res.rows.length) throw new NotFoundException(`Product ${id} not found`);
    return { deleted: true };
  }

  /** Batch set status for multiple products (Active / Paused only) */
  async batchToggleStatus(ids: string[], targetStatus: string) {
    if (!ids || ids.length === 0) return { updated: 0 };
    // 产品生命周期只有 Active（在售）/ Paused（暂停，可恢复），拒绝写入任意状态值
    if (targetStatus !== 'Active' && targetStatus !== 'Paused') {
      throw new BadRequestException(`Unsupported product status: ${targetStatus}`);
    }
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
