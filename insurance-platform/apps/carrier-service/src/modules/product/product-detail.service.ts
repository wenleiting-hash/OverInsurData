import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { basename, resolve, sep } from 'path';
import { pool } from '../../database/drizzle.client';
import { UPLOAD_DIR } from '../upload/upload.config';
import { US_STATE_ENTRIES, US_STATE_NAMES } from './product.constants';
import {
  CreateUnderwritingRuleDto, CreateTrainingMaterialDto, UpdateUnderwritingRuleDto,
  CreateRatePlanDto, UpdateRatePlanDto,
} from './dtos/product-detail.dto';

/**
 * ProductDetailService — queries backing the 5 sub-tabs of ProductDetail
 * (rate plans / salable states / underwriting rules / training materials / performance).
 *
 * Rows are mapped here from snake_case DB columns to the camelCase shape expected by
 * the frontend interfaces in web-carrier-admin/src/views/data/productDetails.ts, so the
 * view layer needs no per-resource mapper. NUMERIC columns come back from pg as strings
 * (parseFloat) and DATE columns as JS Date objects (formatted to YYYY-MM-DD to match the
 * previous mock output). Empty result => empty array => view shows its empty state (no mock fallback).
 */
@Injectable()
export class ProductDetailService {
  private readonly logger = new Logger(ProductDetailService.name);
  /** pg returns DATE columns as local-midnight Date objects; format to YYYY-MM-DD (null-safe). */
  private fmtDate(v: any): string | null {
    if (v === null || v === undefined) return null;
    if (v instanceof Date) {
      const y = v.getFullYear();
      const m = String(v.getMonth() + 1).padStart(2, '0');
      const d = String(v.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return String(v).slice(0, 10);
  }

  /** pg returns NUMERIC columns as strings; coerce to number (0 when null). */
  private num(v: any): number {
    if (v === null || v === undefined) return 0;
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }

  /** Column list shared by the underwriting-rule SELECT and INSERT..RETURNING so both stay in sync.
   *  `condition` is a SQL reserved word and must stay double-quoted. */
  private static readonly RULE_COLS = `rule_id, product_id, name, name_en, category, priority, "condition", condition_en,
              condition_detail, condition_detail_en, action, action_value, action_value_en,
              status, last_modified, modified_by`;

  /** Column list shared by the training-material SELECT and INSERT..RETURNING. */
  private static readonly MATERIAL_COLS = `material_id, product_id, title, title_en, type, file_name, file_size, file_url,
              upload_date, uploaded_by, version, downloads, required_for, expiry_date, status`;

  /** Column list shared by the rate-plan SELECT and INSERT..RETURNING.
   *  filing_status 是监管备案列 —— 本系统无审批/备案流程，列保留但不再读写。 */
  private static readonly RATE_PLAN_COLS = `rate_plan_id, product_id, name, tier, base_rate, min_premium, max_premium,
              effective_date, expiry_date, status, rating_factors`;

  /** DTO key → DB column for the rule edit dialog. `condition` is reserved and stays double-quoted. */
  private static readonly RULE_FIELD_MAP: Record<string, string> = {
    name: 'name', nameEn: 'name_en', category: 'category', priority: 'priority',
    condition: '"condition"', conditionEn: 'condition_en',
    conditionDetail: 'condition_detail', conditionDetailEn: 'condition_detail_en',
    action: 'action', actionValue: 'action_value', actionValueEn: 'action_value_en', status: 'status',
  };

  /** DTO key → DB column for the rate-plan edit dialog. rating_factors is jsonb, so it needs an
   *  explicit `::jsonb` cast in the SET clause (same trap as the INSERT in createRatePlan). */
  private static readonly RATE_PLAN_FIELD_MAP: Record<string, { col: string; cast?: string }> = {
    name: { col: 'name' }, tier: { col: 'tier' }, baseRate: { col: 'base_rate' },
    minPremium: { col: 'min_premium' }, maxPremium: { col: 'max_premium' },
    effectiveDate: { col: 'effective_date' }, expiryDate: { col: 'expiry_date' },
    status: { col: 'status' },
    ratingFactors: { col: 'rating_factors', cast: '::jsonb' },
  };

  /** Row → camelCase for an underwriting rule (used by both list and create responses). */
  private mapRule(r: any) {
    return {
      id: r.rule_id,
      productId: r.product_id,
      name: r.name,
      nameEn: r.name_en,
      category: r.category,
      priority: r.priority,
      condition: r.condition,
      conditionEn: r.condition_en,
      conditionDetail: r.condition_detail,
      conditionDetailEn: r.condition_detail_en,
      action: r.action,
      actionValue: r.action_value,
      actionValueEn: r.action_value_en,
      status: r.status,
      lastModified: this.fmtDate(r.last_modified),
      modifiedBy: r.modified_by,
    };
  }

  /** Row → camelCase for a training material (used by both list and create responses). */
  private mapMaterial(r: any) {
    return {
      id: r.material_id,
      productId: r.product_id,
      title: r.title,
      titleEn: r.title_en,
      type: r.type,
      fileName: r.file_name,
      fileSize: r.file_size,
      fileUrl: r.file_url ?? null,
      uploadDate: this.fmtDate(r.upload_date),
      uploadedBy: r.uploaded_by,
      version: r.version,
      downloads: r.downloads,
      requiredFor: r.required_for ?? [],
      expiryDate: this.fmtDate(r.expiry_date),
      status: r.status ?? 'active',
    };
  }

  /** Row → camelCase for a rate plan (used by both list and create responses).
   *  历史数据里的 'pending'（待审批）归一为 'draft' —— 本系统无审批流程。 */
  private mapRatePlan(r: any) {
    return {
      id: r.rate_plan_id,
      productId: r.product_id,
      name: r.name,
      tier: r.tier,
      baseRate: this.num(r.base_rate),
      minPremium: this.num(r.min_premium),
      maxPremium: this.num(r.max_premium),
      effectiveDate: this.fmtDate(r.effective_date),
      expiryDate: this.fmtDate(r.expiry_date),
      status: r.status === 'pending' ? 'draft' : r.status,
      ratingFactors: r.rating_factors ?? [],
    };
  }

  /** Rate plans for a product (ordered by sort_order). Maps to RatePlan[]. */
  async getRatePlans(productId: string) {
    const res = await pool.query(
      `SELECT ${ProductDetailService.RATE_PLAN_COLS}
       FROM product_rate_plan WHERE product_id = $1 ORDER BY sort_order ASC`,
      [productId],
    );
    return res.rows.map((r: any) => this.mapRatePlan(r));
  }

  /**
   * Add a rate plan. sort_order is placed past the current maximum so the new plan lands at the end
   * of the list. rating_factors is jsonb and must be bound as a JSON string with an explicit cast.
   */
  async createRatePlan(productId: string, dto: CreateRatePlanDto) {
    const planId = `${productId}_rp${Date.now().toString(36)}`;
    const ord = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM product_rate_plan WHERE product_id = $1`,
      [productId],
    );
    const res = await pool.query(
      `INSERT INTO product_rate_plan (${ProductDetailService.RATE_PLAN_COLS}, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)
       RETURNING ${ProductDetailService.RATE_PLAN_COLS}`,
      [
        planId, productId, dto.name, dto.tier, dto.baseRate, dto.minPremium ?? null, dto.maxPremium ?? null,
        dto.effectiveDate ?? null, dto.expiryDate ?? null, dto.status ?? 'active',
        JSON.stringify(dto.ratingFactors ?? []), ord.rows[0].next,
      ],
    );
    return this.mapRatePlan(res.rows[0]);
  }

  /**
   * Update a rate plan from the edit dialog. Only the keys present in the DTO are written, so an
   * untouched optional column keeps its stored value. sort_order is deliberately not editable — the
   * list order is owned by the seed/creation sequence. Scoped by product_id as well as rate_plan_id
   * so one product's plan can't be reached through another product's URL.
   */
  async updateRatePlan(productId: string, planId: string, dto: UpdateRatePlanDto) {
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const [key, { col, cast }] of Object.entries(ProductDetailService.RATE_PLAN_FIELD_MAP)) {
      const v = (dto as any)[key];
      if (v === undefined) continue;
      sets.push(`${col} = $${idx++}${cast ?? ''}`);
      vals.push(key === 'ratingFactors' ? JSON.stringify(v ?? []) : v);
    }
    if (!sets.length) {
      const cur = await pool.query(
        `SELECT ${ProductDetailService.RATE_PLAN_COLS} FROM product_rate_plan WHERE product_id = $1 AND rate_plan_id = $2`,
        [productId, planId],
      );
      if (!cur.rows.length) throw new NotFoundException(`Rate plan ${planId} not found`);
      return this.mapRatePlan(cur.rows[0]);
    }
    sets.push('updated_at = NOW()');
    vals.push(productId, planId);
    const res = await pool.query(
      `UPDATE product_rate_plan SET ${sets.join(', ')}
       WHERE product_id = $${idx} AND rate_plan_id = $${idx + 1}
       RETURNING ${ProductDetailService.RATE_PLAN_COLS}`,
      vals,
    );
    if (!res.rows.length) throw new NotFoundException(`Rate plan ${planId} not found`);
    return this.mapRatePlan(res.rows[0]);
  }

  /** Hard-delete a rate plan (product_rate_plan has no soft-delete column). */
  async deleteRatePlan(productId: string, planId: string) {
    const res = await pool.query(
      `DELETE FROM product_rate_plan WHERE product_id = $1 AND rate_plan_id = $2 RETURNING rate_plan_id`,
      [productId, planId],
    );
    if (!res.rows.length) throw new NotFoundException(`Rate plan ${planId} not found`);
    return { deleted: true };
  }

  /** Salable-state detail rows for the product — always returns all 50 states.
   *  可售性以 insurance_product.available_states（产品表单主数据）为准；product_state 仅承载
   *  运营层单州暂停（suspended）与种子演示列（channel_count/effective_date 等）。
   *  历史 'pending'（审核中）归一为 not-available，避免前端渲染出审批语义。 */
  async getStates(productId: string) {
    const res = await pool.query(
      `SELECT p.available_states AS master_states,
              ps.state_code, ps.state_name, ps.status, ps.enabled, ps.effective_date, ps.channel_count
       FROM insurance_product p
       LEFT JOIN product_state ps ON ps.product_id = p.product_id
       WHERE p.product_id = $1 AND p.deleted = FALSE`,
      [productId],
    );
    if (!res.rows.length) throw new NotFoundException(`Product ${productId} not found`);

    const master = new Set<string>(
      Array.isArray(res.rows[0].master_states)
        ? res.rows[0].master_states.map((s: unknown) => String(s).toUpperCase())
        : [],
    );
    const rowMap = new Map<string, any>();
    for (const r of res.rows) {
      if (r.state_code) rowMap.set(String(r.state_code).toUpperCase(), r);
    }

    return US_STATE_ENTRIES.map(([code, fallbackName]) => {
      const r = rowMap.get(code);
      const inMaster = master.has(code);
      // 清单外 → not-available；清单内但被运营暂停 → suspended；其余 active
      const rawStatus = r?.status === 'pending' ? 'not-available' : r?.status;
      const status = !inMaster
        ? 'not-available'
        : rawStatus === 'suspended'
          ? 'suspended'
          : 'active';
      return {
        code,
        name: r?.state_name || fallbackName,
        enabled: inMaster,
        effectiveDate: this.fmtDate(r?.effective_date ?? null),
        status,
        channelCount: r ? Number(r.channel_count ?? 0) : 0,
      };
    });
  }

  /** Underwriting rules for a product (ordered by priority). Maps to UnderwritingRule[]. */
  async getUnderwritingRules(productId: string) {
    const res = await pool.query(
      `SELECT ${ProductDetailService.RULE_COLS}
       FROM product_underwriting_rule WHERE product_id = $1 ORDER BY priority ASC`,
      [productId],
    );
    return res.rows.map((r: any) => this.mapRule(r));
  }

  /**
   * Insert an underwriting rule and return it in the same camelCase shape as getUnderwritingRules,
   * so the frontend can drop the response straight into its cache. rule_id follows the seeded
   * `<productId>_ur<n>` convention but uses a base36 timestamp to avoid collisions. last_modified is
   * set server-side to today and modified_by comes from the JWT username (never trusted from the body).
   */
  async createUnderwritingRule(productId: string, dto: CreateUnderwritingRuleDto, modifiedBy: string) {
    const ruleId = `${productId}_ur${Date.now().toString(36)}`;
    const res = await pool.query(
      `INSERT INTO product_underwriting_rule (${ProductDetailService.RULE_COLS})
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,CURRENT_DATE,$15)
       RETURNING ${ProductDetailService.RULE_COLS}`,
      [
        ruleId, productId, dto.name, dto.nameEn ?? null, dto.category, dto.priority ?? 0,
        dto.condition, dto.conditionEn ?? null, dto.conditionDetail ?? null, dto.conditionDetailEn ?? null,
        dto.action, dto.actionValue ?? null, dto.actionValueEn ?? null,
        dto.status ?? 'active', modifiedBy,
      ],
    );
    return this.mapRule(res.rows[0]);
  }

  /**
   * Update an underwriting rule from the edit dialog. Only the keys present in the DTO are written,
   * so a partial payload never blanks the other columns. last_modified / modified_by are refreshed
   * server-side. Scoped by product_id as well as rule_id so one product's rule can't be reached
   * through another product's URL.
   */
  async updateUnderwritingRule(productId: string, ruleId: string, dto: UpdateUnderwritingRuleDto, modifiedBy: string) {
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const [key, col] of Object.entries(ProductDetailService.RULE_FIELD_MAP)) {
      const v = (dto as any)[key];
      if (v !== undefined) { sets.push(`${col} = $${idx++}`); vals.push(v); }
    }
    if (!sets.length) {
      const cur = await pool.query(
        `SELECT ${ProductDetailService.RULE_COLS} FROM product_underwriting_rule WHERE product_id = $1 AND rule_id = $2`,
        [productId, ruleId],
      );
      if (!cur.rows.length) throw new NotFoundException(`Underwriting rule ${ruleId} not found`);
      return this.mapRule(cur.rows[0]);
    }
    sets.push(`last_modified = CURRENT_DATE`, `modified_by = $${idx++}`);
    vals.push(modifiedBy, productId, ruleId);
    const res = await pool.query(
      `UPDATE product_underwriting_rule SET ${sets.join(', ')}
       WHERE product_id = $${idx} AND rule_id = $${idx + 1}
       RETURNING ${ProductDetailService.RULE_COLS}`,
      vals,
    );
    if (!res.rows.length) throw new NotFoundException(`Underwriting rule ${ruleId} not found`);
    return this.mapRule(res.rows[0]);
  }

  /** Flip a rule between active / inactive (生效 / 失效 in the "更多" menu). */
  async setRuleStatus(productId: string, ruleId: string, status: string, modifiedBy: string) {
    const res = await pool.query(
      `UPDATE product_underwriting_rule SET status = $3, last_modified = CURRENT_DATE, modified_by = $4
       WHERE product_id = $1 AND rule_id = $2
       RETURNING ${ProductDetailService.RULE_COLS}`,
      [productId, ruleId, status, modifiedBy],
    );
    if (!res.rows.length) throw new NotFoundException(`Underwriting rule ${ruleId} not found`);
    return this.mapRule(res.rows[0]);
  }

  /**
   * Suspend / resume a single salable state. Only active ↔ suspended transitions are accepted:
   * a state outside the product form's available_states master list is not sellable and must be
   * enabled through the form, not from the states tab. Legacy products without a product_state row
   * for a master-listed state are reconciled on demand (row auto-created as active first).
   */
  async setStateStatus(productId: string, stateCode: string, status: 'active' | 'suspended') {
    const code = stateCode.trim().toUpperCase();
    const prod = await pool.query(
      `SELECT available_states FROM insurance_product WHERE product_id = $1 AND deleted = FALSE`,
      [productId],
    );
    if (!prod.rows.length) throw new NotFoundException(`Product ${productId} not found`);
    const master: string[] = Array.isArray(prod.rows[0].available_states)
      ? prod.rows[0].available_states.map((s: unknown) => String(s).toUpperCase())
      : [];
    if (!master.includes(code)) {
      throw new NotFoundException(`State ${code} is not available for this product; enable it in the product form first.`);
    }

    // 主数据清单内但缺行 / 历史 not-available(pending) 行：先对齐为 active，再执行本次转换
    await pool.query(
      `INSERT INTO product_state (product_id, state_code, state_name, enabled, status)
       VALUES ($1, $2, $3, TRUE, 'active')
       ON CONFLICT (product_id, state_code) DO UPDATE
         SET status = 'active', enabled = TRUE, updated_at = NOW()
       WHERE product_state.status IN ('not-available', 'pending')`,
      [productId, code, US_STATE_NAMES[code] ?? code],
    );

    const res = await pool.query(
      `UPDATE product_state SET status = $3, updated_at = NOW()
       WHERE product_id = $1 AND state_code = $2
       RETURNING state_code, state_name, enabled, status, effective_date, channel_count`,
      [productId, code, status],
    );
    const r = res.rows[0];
    return {
      code: r.state_code,
      name: r.state_name,
      enabled: r.enabled,
      effectiveDate: this.fmtDate(r.effective_date),
      status: r.status,
      channelCount: r.channel_count,
    };
  }

  /** Hard-delete a rule (product_underwriting_rule has no soft-delete column). */
  async deleteRule(productId: string, ruleId: string) {
    const res = await pool.query(
      `DELETE FROM product_underwriting_rule WHERE product_id = $1 AND rule_id = $2 RETURNING rule_id`,
      [productId, ruleId],
    );
    if (!res.rows.length) throw new NotFoundException(`Underwriting rule ${ruleId} not found`);
    return { deleted: true };
  }

  /** Training materials for a product (ordered by sort_order). Maps to TrainingMaterial[]. */
  async getTrainingMaterials(productId: string) {
    const res = await pool.query(
      `SELECT ${ProductDetailService.MATERIAL_COLS}
       FROM product_training_material WHERE product_id = $1 ORDER BY sort_order ASC`,
      [productId],
    );
    return res.rows.map((r: any) => this.mapMaterial(r));
  }

  /**
   * Insert a training material. upload_date is today, downloads starts at 0, and sort_order is set
   * past the current maximum so the new item lands at the end of the list. required_for is jsonb and
   * must be bound as a JSON string with an explicit ::jsonb cast.
   */
  async createTrainingMaterial(productId: string, dto: CreateTrainingMaterialDto, uploadedBy: string) {
    const materialId = `${productId}_tm${Date.now().toString(36)}`;
    const ord = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM product_training_material WHERE product_id = $1`,
      [productId],
    );
    const sortOrder = ord.rows[0].next;
    const res = await pool.query(
      `INSERT INTO product_training_material (${ProductDetailService.MATERIAL_COLS}, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_DATE,$9,$10,0,$11::jsonb,$12,'active',$13)
       RETURNING ${ProductDetailService.MATERIAL_COLS}`,
      [
        materialId, productId, dto.title, dto.titleEn ?? null, dto.type, dto.fileName ?? null,
        dto.fileSize ?? null, dto.url ?? null, uploadedBy, dto.version ?? null,
        JSON.stringify(dto.requiredFor ?? []), dto.expiryDate ?? null, sortOrder,
      ],
    );
    return this.mapMaterial(res.rows[0]);
  }

  /** Flip a material between active / inactive (置为有效 / 置为无效 in the "更多" menu). */
  async setMaterialStatus(productId: string, materialId: string, status: string) {
    const res = await pool.query(
      `UPDATE product_training_material SET status = $3, updated_at = NOW()
       WHERE product_id = $1 AND material_id = $2
       RETURNING ${ProductDetailService.MATERIAL_COLS}`,
      [productId, materialId, status],
    );
    if (!res.rows.length) throw new NotFoundException(`Training material ${materialId} not found`);
    return this.mapMaterial(res.rows[0]);
  }

  /** DTO key → DB column for the material edit dialog. required_for is jsonb (needs ::jsonb cast),
   *  and `url` maps to the file_url column. */
  private static readonly MATERIAL_FIELD_MAP: Record<string, { col: string; cast?: string }> = {
    title: { col: 'title' }, titleEn: { col: 'title_en' }, type: { col: 'type' },
    fileName: { col: 'file_name' }, fileSize: { col: 'file_size' }, version: { col: 'version' },
    requiredFor: { col: 'required_for', cast: '::jsonb' },
    expiryDate: { col: 'expiry_date' }, url: { col: 'file_url' },
  };

  /**
   * Update material metadata (and optionally replace the stored file). Only keys present in the DTO
   * are written; an empty expiryDate clears the column to NULL. When the file is replaced the old
   * upload is best-effort deleted, same as the hard-delete path.
   */
  async updateMaterial(productId: string, materialId: string, dto: {
    title?: string; titleEn?: string; type?: string; fileName?: string; fileSize?: string;
    version?: string; requiredFor?: string[]; expiryDate?: string; url?: string;
  }) {
    // Replacing the file? remember the old url BEFORE the UPDATE so it can be unlinked afterwards.
    let previousFileUrl: string | null = null;
    if (dto.url) {
      const pre = await pool.query(
        'SELECT file_url FROM product_training_material WHERE product_id = $1 AND material_id = $2',
        [productId, materialId],
      );
      if (!pre.rows.length) throw new NotFoundException(`Training material ${materialId} not found`);
      previousFileUrl = pre.rows[0].file_url ?? null;
    }

    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const [key, { col, cast }] of Object.entries(ProductDetailService.MATERIAL_FIELD_MAP)) {
      if (!(key in dto)) continue;
      let v: any = (dto as any)[key];
      if (key === 'expiryDate' && v === '') v = null;
      sets.push(`${col} = $${idx++}${cast ?? ''}`);
      vals.push(key === 'requiredFor' ? JSON.stringify(v ?? []) : v);
    }
    if (!sets.length) {
      const cur = await pool.query(
        `SELECT ${ProductDetailService.MATERIAL_COLS} FROM product_training_material WHERE product_id = $1 AND material_id = $2`,
        [productId, materialId],
      );
      if (!cur.rows.length) throw new NotFoundException(`Training material ${materialId} not found`);
      return this.mapMaterial(cur.rows[0]);
    }
    sets.push('updated_at = NOW()');
    vals.push(productId, materialId);
    const res = await pool.query(
      `UPDATE product_training_material SET ${sets.join(', ')}
       WHERE product_id = $${idx} AND material_id = $${idx + 1}
       RETURNING ${ProductDetailService.MATERIAL_COLS}`,
      vals,
    );
    if (!res.rows.length) throw new NotFoundException(`Training material ${materialId} not found`);

    // Best-effort removal of the replaced upload (same safety rules as deleteMaterial).
    if (previousFileUrl && previousFileUrl !== dto.url) {
      const target = resolve(UPLOAD_DIR, basename(previousFileUrl));
      if (target.startsWith(UPLOAD_DIR + sep)) {
        await unlink(target).catch((e: any) => this.logger.warn(`Kept orphan upload ${target}: ${e?.message}`));
      }
    }
    return this.mapMaterial(res.rows[0]);
  }

  /**
   * Hard-delete a material row and, best-effort, the file it pointed at. The row is removed first so a
   * failed unlink can't leave the UI showing a material whose record is gone; a stale file on disk is
   * harmless compared to that. Only names inside UPLOAD_DIR are touched (basename strips any path).
   */
  async deleteMaterial(productId: string, materialId: string) {
    const res = await pool.query(
      `DELETE FROM product_training_material WHERE product_id = $1 AND material_id = $2 RETURNING file_url`,
      [productId, materialId],
    );
    if (!res.rows.length) throw new NotFoundException(`Training material ${materialId} not found`);
    const fileUrl: string | null = res.rows[0].file_url ?? null;
    if (fileUrl) {
      const target = resolve(UPLOAD_DIR, basename(fileUrl));
      if (target.startsWith(UPLOAD_DIR + sep)) {
        await unlink(target).catch((e: any) => this.logger.warn(`Kept orphan upload ${target}: ${e?.message}`));
      }
    }
    return { deleted: true };
  }

  /** Monthly performance series for a product (ascending; last entry is latest month). Maps to ProductPerformanceData[]. */
  async getPerformance(productId: string) {
    const res = await pool.query(
      `SELECT month, premium, new_biz, renewal, policies, loss_ratio, claims_count
       FROM product_performance WHERE product_id = $1 ORDER BY period_order ASC`,
      [productId],
    );
    return res.rows.map((r: any) => ({
      month: r.month,
      premium: this.num(r.premium),
      newBiz: this.num(r.new_biz),
      renewal: this.num(r.renewal),
      policies: r.policies,
      lossRatio: this.num(r.loss_ratio),
      claimsCount: r.claims_count,
    }));
  }
}
