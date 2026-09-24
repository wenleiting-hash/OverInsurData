import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { pool } from '../../database/drizzle.client';
import { AuditService, AuditOperator } from '../../common/services/audit.service';
import type {
  BillImportDto, StatementImportDto, StatementLineAdjustDto,
  MappingTemplateUpsertDto, ReconcileStartDto, DiffActionDto,
  DiffFollowUpDto, FinanceProfileUpsertDto, FinanceRowDto,
  CommissionRateUpsertDto, CommissionRateImportDto, CommissionRateTrialDto,
} from './dtos/finance.dto';

const PAGE_SIZES = new Set([10, 20, 50, 100, 200, 500]);
const MAX_ROWS = 20000;
const PERIOD_RE = /^\d{4}-\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CHUNK = 200;

/** 美国州缩写（50 州 + DC），佣金率适用州校验。 */
const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME',
  'MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA',
  'RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]);

export interface RowError { row: number; field: string; message: string }

/** 四级回退费率查询函数（buildRateMaps 产出）。 */
export type RateLookup = (
  productCode: string | null,
  lob: string | null,
  state: string | null,
) => { level: string; rate: number; row: any } | null;

/** 对账比对中的一笔（report_json 快照元素）。 */
export interface CompareItem {
  policy_number: string;
  insured_name: string | null;
  diff_type?: string;
  bill: {
    bill_id?: string; line_number?: number; insured_name?: string | null;
    npn?: string | null; product_code?: string | null; channel_name?: string | null;
    state?: string | null; line_of_business?: string | null;
    premium: number | null; commission_rate: number | null; commission_amount: number | null;
  };
  our: {
    line_number?: number; insured_name?: string | null;
    npn?: string | null; product_code?: string | null; channel_name?: string | null;
    state?: string | null; line_of_business?: string | null;
    premium: number | null; commission_rate: number | null; commission_amount: number | null;
  };
  bill_amount: number;
  our_amount: number;
  diff_amount: number;
  resolution?: string;
  diff_id?: string;
  note?: string | null;
}

function parsePage(q: any, defSize = 20) {
  const page = Math.max(1, parseInt(q?.page as string, 10) || 1);
  let size = parseInt(q?.size as string, 10) || defSize;
  if (!PAGE_SIZES.has(size)) size = defSize;
  return { page, size };
}

function genId(prefix: string): string {
  return prefix + randomUUID().replace(/-/g, '').slice(0, 32 - prefix.length);
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const n2 = (v: unknown): number => (v === null || v === undefined ? 0 : parseFloat(String(v)) || 0);
const str = (v: unknown): string | null => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());
const eqText = (a: unknown, b: unknown) => str(a)?.toLowerCase() === str(b)?.toLowerCase();

/** 账单/对账单行通用校验：返回错误清单（多行错误平铺），通过的行进 valid。 */
function validateRows(
  rows: FinanceRowDto[],
  category: string,
): { valid: Array<FinanceRowDto & { _rowNo: number }>; errors: RowError[]; skipped: number; failedRows: Set<number> } {
  const errors: RowError[] = [];
  const failedRows = new Set<number>();
  const valid: Array<FinanceRowDto & { _rowNo: number }> = [];
  let skipped = 0;

  rows.forEach((r, i) => {
    const rowNo = i + 1;
    const policy = str(r.policy_number);
    const insured = str(r.insured_name);
    const hasPremium = r.premium !== undefined && r.premium !== null;
    const hasComm = r.commission_amount !== undefined && r.commission_amount !== null;
    if (!policy && !insured && !hasPremium) { skipped += 1; return; }

    const rowErrs: RowError[] = [];
    if (!policy) rowErrs.push({ row: rowNo, field: 'policy_number', message: 'Policy number is required' });
    if (!hasPremium) rowErrs.push({ row: rowNo, field: 'premium', message: 'Premium is required' });
    if (category === 'commission' && !hasComm) {
      rowErrs.push({ row: rowNo, field: 'commission_amount', message: 'Commission amount is required' });
    }
    const eff = str(r.effective_date);
    if (eff && !DATE_RE.test(eff)) {
      rowErrs.push({ row: rowNo, field: 'effective_date', message: 'Effective date must be YYYY-MM-DD' });
    }
    if (rowErrs.length > 0) {
      errors.push(...rowErrs);
      failedRows.add(rowNo);
      return;
    }
    valid.push({ ...r, _rowNo: rowNo });
  });

  return { valid, errors, skipped, failedRows };
}

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(private readonly audit: AuditService) {}

  // ─── Dashboard stats ───────────────────────────────────────────────

  async getStats() {
    const [billRes, diffRes, dueRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FILTER (WHERE category = 'commission')::int AS commission_bills,
                COALESCE(SUM(total_commission) FILTER (WHERE category = 'commission'), 0) AS commission_amount,
                COUNT(*) FILTER (WHERE category = 'premium')::int AS premium_bills,
                COALESCE(SUM(total_premium) FILTER (WHERE category = 'premium'), 0) AS premium_amount
           FROM commission_bill WHERE deleted = FALSE`,
      ),
      pool.query(
        `SELECT category,
                COUNT(*) FILTER (WHERE resolution = 'open')::int AS open,
                COUNT(*) FILTER (WHERE resolution = 'suspended')::int AS suspended,
                COUNT(*)::int AS total
           FROM reconciliation_diff WHERE deleted = FALSE GROUP BY category`,
      ),
      pool.query(
        `SELECT COUNT(*)::int AS due_soon, COALESCE(SUM(next_due_amount), 0) AS due_amount
           FROM insurer_finance_profile
          WHERE deleted = FALSE AND next_due_date IS NOT NULL
            AND next_due_date <= CURRENT_DATE + INTERVAL '7 days'`,
      ),
    ]);
    const b = billRes.rows[0];
    const diffs = { commission: { open: 0, suspended: 0, total: 0 }, premium: { open: 0, suspended: 0, total: 0 } };
    for (const r of diffRes.rows) diffs[r.category as 'commission' | 'premium'] = { open: r.open, suspended: r.suspended, total: r.total };
    return {
      commission: { bills: b.commission_bills, amount: n2(b.commission_amount), open_diffs: diffs.commission.open },
      premium: { bills: b.premium_bills, amount: n2(b.premium_amount), open_diffs: diffs.premium.open },
      suspended_diffs: diffs.commission.suspended + diffs.premium.suspended,
      due_soon: { count: dueRes.rows[0].due_soon, amount: n2(dueRes.rows[0].due_amount) },
    };
  }

  // ─── Bills (V1.0.15 批次化) ─────────────────────────────────────────

  async getBills(query: any) {
    const { page, size } = parsePage(query);
    const conds = ['b.deleted = FALSE', "b.import_status = 'imported'"];
    const vals: any[] = [];
    let idx = 1;
    // 财务新入口只展示佣金批次；保费对账无独立入口（O4），category=all 时才全部返回
    conds.push(`b.category = $${idx++}`);
    vals.push(query.category && query.category !== 'all' ? query.category : 'commission');
    if (query.insurer_id) { conds.push(`b.insurer_id = $${idx++}`); vals.push(query.insurer_id); }
    if (query.period_month) { conds.push(`b.period_month = $${idx++}`); vals.push(query.period_month); }
    if (query.import_date_from) { conds.push(`b.import_date >= $${idx++}`); vals.push(query.import_date_from); }
    if (query.import_date_to) { conds.push(`b.import_date < ($${idx++}::date + 1)`); vals.push(query.import_date_to); }
    if (query.recon_status && query.recon_status !== 'all') {
      conds.push(`b.recon_status = $${idx++}`); vals.push(query.recon_status);
    }
    if (query.has_open_diffs === 'true') {
      conds.push(`EXISTS (SELECT 1 FROM reconciliation_diff d
                          WHERE d.bill_id = b.bill_id AND d.deleted = FALSE
                            AND d.resolution IN ('open','suspended'))`);
    }
    if (query.search) {
      conds.push(`(b.batch_no ILIKE $${idx} OR b.file_name ILIKE $${idx} OR b.insurer_name ILIKE $${idx})`);
      vals.push(`%${query.search}%`);
      idx += 1;
    }
    const where = conds.join(' AND ');
    const offset = (page - 1) * size;
    vals.push(size, offset);
    const sql = `SELECT b.* FROM commission_bill b WHERE ${where}
                 ORDER BY b.import_date DESC, b.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    const countSql = `SELECT COUNT(*) FROM commission_bill b WHERE ${where}`;
    const [dataRes, countRes] = await Promise.all([
      pool.query(sql, vals),
      pool.query(countSql, vals.slice(0, idx - 1)),
    ]);

    // 列表汇总卡：批次总数 / 账单金额合计 / 待对账 / 对账中 / 已完成 + 待处理差异
    const sumRes = await pool.query(
      `SELECT COUNT(*)::int AS total_batches,
              COALESCE(SUM(total_commission), 0) AS bill_amount,
              COUNT(*) FILTER (WHERE recon_status = 'pending')::int AS pending,
              COUNT(*) FILTER (WHERE recon_status = 'running')::int AS running,
              COUNT(*) FILTER (WHERE recon_status = 'completed')::int AS completed
         FROM commission_bill b
        WHERE b.deleted = FALSE AND b.import_status = 'imported'
          AND b.category = 'commission'`,
    );
    const diffRes = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE resolution = 'open')::int AS open_diffs,
              COUNT(*) FILTER (WHERE resolution = 'suspended')::int AS suspended_diffs
         FROM reconciliation_diff WHERE deleted = FALSE AND category = 'commission'`,
    );
    const summary = {
      total_batches: sumRes.rows[0].total_batches,
      bill_amount: n2(sumRes.rows[0].bill_amount),
      pending: sumRes.rows[0].pending,
      running: sumRes.rows[0].running,
      completed: sumRes.rows[0].completed,
      open_diffs: diffRes.rows[0].open_diffs,
      suspended_diffs: diffRes.rows[0].suspended_diffs,
    };
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size, summary };
  }

  /**
   * 导入预检（不落库）：字段校验 + 行内去重 + 库内去重（保司+月份+保单号）。
   * 返回逐行分类，前端确认后凭同样 rows 调 POST /bills/import。
   */
  async precheckBill(dto: BillImportDto) {
    const classified = await this.classifyRows(dto);
    return this.classificationResult(dto, classified);
  }

  /** 行分类：valid / duplicate（行内重复或库内已存在）/ failed / empty。 */
  private async classifyRows(dto: BillImportDto) {
    const category = dto.category || 'commission';
    if (!PERIOD_RE.test(dto.period_month)) throw new BadRequestException('period_month must be YYYY-MM');
    if (dto.rows.length > MAX_ROWS) throw new BadRequestException(`rows exceeds ${MAX_ROWS}`);
    await this.requireCarrier(dto.insurer_id);

    const { valid, errors, skipped } = validateRows(dto.rows, category);
    const fieldErrors = new Map<number, RowError[]>();
    for (const e of errors) {
      const arr = fieldErrors.get(e.row) || [];
      arr.push(e);
      fieldErrors.set(e.row, arr);
    }

    // 行内重复（同文件首张有效，后续重复）
    const seenInFile = new Set<string>();
    const inFileDup = new Set<number>();
    for (const r of valid) {
      const key = this.policyKey(r.policy_number!);
      if (seenInFile.has(key)) inFileDup.add(r._rowNo);
      else seenInFile.add(key);
    }

    // 库内去重：保司 + 账单月份 + 保单号（已 imported 行）
    const winnerPolicies = valid.filter((r) => !inFileDup.has(r._rowNo)).map((r) => this.policyKey(r.policy_number!));
    const existing = new Set<string>();
    if (winnerPolicies.length > 0) {
      const res = await pool.query(
        `SELECT DISTINCT UPPER(policy_number) AS p
           FROM commission_bill_line
          WHERE insurer_id = $1 AND period_month = $2 AND category = $3
            AND line_status = 'imported' AND deleted = FALSE
            AND UPPER(policy_number) = ANY($4)`,
        [dto.insurer_id, dto.period_month, category, winnerPolicies],
      );
      for (const r of res.rows) existing.add(String(r.p).trim().toUpperCase());
    }

    const classified = dto.rows.map((raw, i) => {
      const rowNo = i + 1;
      const policy = str(raw.policy_number);
      const insured = str(raw.insured_name);
      const hasPremium = raw.premium !== undefined && raw.premium !== null;
      if (!policy && !insured && !hasPremium) {
        return { row: rowNo, raw, classification: 'empty' as const };
      }
      if (fieldErrors.has(rowNo)) {
        return {
          row: rowNo, raw, classification: 'failed' as const,
          errors: fieldErrors.get(rowNo),
          reason: (fieldErrors.get(rowNo) || []).map((e) => e.message).join('; '),
        };
      }
      if (inFileDup.has(rowNo)) {
        return { row: rowNo, raw, classification: 'duplicate' as const, reason: 'duplicate-in-file' };
      }
      if (existing.has(this.policyKey(policy!))) {
        return { row: rowNo, raw, classification: 'duplicate' as const, reason: 'already-imported' };
      }
      return { row: rowNo, raw, classification: 'valid' as const };
    });
    return { classified, skipped };
  }

  private classificationResult(dto: BillImportDto, result: { classified: Array<{ row: number; raw: FinanceRowDto; classification: string; reason?: string }>; skipped: number }) {
    const { classified, skipped } = result;
    const count = (c: string) => classified.filter((x) => x.classification === c).length;
    const errorList: Array<{ row: number; reason?: string }> = [];
    const dupList: Array<{ row: number; policy_number?: string | null; reason?: string }> = [];
    const preview = classified
      .filter((x) => x.classification !== 'empty')
      .map((x) => ({
        row: x.row,
        classification: x.classification,
        reason: x.reason,
        policy_number: str(x.raw.policy_number),
        insured_name: str(x.raw.insured_name),
        premium: n2(x.raw.premium),
        commission_rate: x.raw.commission_rate ?? null,
        commission_amount: n2(x.raw.commission_amount),
      }));
    for (const x of classified) {
      if (x.classification === 'failed') errorList.push({ row: x.row, reason: x.reason });
      if (x.classification === 'duplicate') dupList.push({ row: x.row, policy_number: str(x.raw.policy_number), reason: x.reason });
    }
    return {
      insurer_id: dto.insurer_id,
      period_month: dto.period_month,
      file_name: dto.file_name,
      total: classified.length,
      empty: skipped,
      success_count: count('valid'),
      duplicate_count: count('duplicate'),
      failed_count: count('failed'),
      duplicates: dupList,
      errors: errorList,
      preview,
    };
  }

  /** 生成当日顺序批次号 IMP-YYYYMMDD-NNN。 */
  private async nextBatchNo(): Promise<string> {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const res = await pool.query(
      `SELECT COUNT(*)::int AS c FROM commission_bill
        WHERE batch_no LIKE 'IMP-' || to_char(NOW() AT TIME ZONE 'UTC','YYYYMMDD') || '-%'`,
    );
    const seq = String((res.rows[0].c || 0) + 1).padStart(3, '0');
    return `IMP-${day}-${seq}`;
  }

  async importBill(dto: BillImportDto, operator: AuditOperator) {
    const carrier = await this.requireCarrier(dto.insurer_id);
    if (dto.mapping_template_id) await this.requireTemplate(dto.mapping_template_id);
    const { classified, skipped } = await this.classifyRows(dto);
    const result = this.classificationResult(dto, { classified, skipped });

    if (result.success_count === 0) {
      throw new BadRequestException('No valid rows to import: all rows are duplicates, failed or empty');
    }

    const validRows = classified.filter((x) => x.classification === 'valid');
    const totalPremium = validRows.reduce((s, x) => s + n2(x.raw.premium), 0);
    const totalCommission = validRows.reduce((s, x) => s + n2(x.raw.commission_amount), 0);

    const billId = genId('cb');
    const batchNo = await this.nextBatchNo();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO commission_bill
           (bill_id, batch_no, file_name, insurer_id, insurer_name, insurer_short, period,
            imported_by, file_size, file_format, status,
            total_policies, total_premium, total_commission,
            category, source_url, source_stored_name, mapping_template_id,
            import_stats, period_month,
            import_status, recon_status, success_count, failed_count, duplicate_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'uploaded',$11,$12,$13,$14,$15,$16,$17,$18::jsonb,$19,'imported','pending',$20,$21,$22)`,
        [
          billId, batchNo, dto.file_name, dto.insurer_id, carrier.carrier_name, carrier.carrier_name_short,
          dto.period_month, operator.username || 'admin', str(dto.file_size), dto.file_format || 'xlsx',
          result.success_count, round2(totalPremium), round2(totalCommission),
          dto.category || 'commission', str(dto.source_url), str(dto.source_stored_name), str(dto.mapping_template_id) || null,
          JSON.stringify({
            total: result.total, empty: result.empty, imported: result.success_count,
            failed: result.failed_count, duplicate: result.duplicate_count,
            errors: result.errors, duplicates: result.duplicates,
          }),
          dto.period_month,
          result.success_count, result.failed_count, result.duplicate_count,
        ],
      );

      const nonEmpty = classified.filter((x) => x.classification !== 'empty');
      for (let i = 0; i < nonEmpty.length; i += CHUNK) {
        const slice = nonEmpty.slice(i, i + CHUNK);
        const v: any[] = [];
        const ph: string[] = [];
        slice.forEach((x) => {
          const r = x.raw;
          const p = v.length + 1;
          ph.push(`('bl' || substring(replace(gen_random_uuid()::text,'-','') for 30),
                   $${p},$${p + 1},$${p + 2},$${p + 3},$${p + 4},$${p + 5},$${p + 6},$${p + 7},$${p + 8},
                   $${p + 9},$${p + 10},$${p + 11},$${p + 12},$${p + 13},$${p + 14},$${p + 15},
                   $${p + 16},$${p + 17}::jsonb,NOW(),NOW(),
                   $${p + 18},$${p + 19},$${p + 20},$${p + 21},$${p + 22})`);
          v.push(
            billId, x.row, str(r.policy_number), str(r.insured_name),
            str(r.channel_name), str(r.state), str(r.line_of_business), str(effOrNull(r.effective_date)),
            round2(n2(r.premium)), round4(r.commission_rate), round2(n2(r.commission_amount)),
            str(r.npn), str(r.product_code), dto.category || 'commission', false,
            JSON.stringify(r),
            dto.insurer_id, dto.period_month,
            x.classification === 'valid' ? 'imported' : x.classification,
            x.classification === 'failed' ? (x.reason || 'invalid row').slice(0, 512) : null,
            x.classification === 'duplicate' ? (x.reason || 'duplicate').slice(0, 512) : null,
          );
        });
        await client.query(
          `INSERT INTO commission_bill_line
             (line_id, bill_id, line_number, policy_number, insured_name,
              channel_name, state, line_of_business, effective_date,
              premium, commission_rate, commission_amount,
              npn, product_code, category, deleted, raw_row, created_at, updated_at,
              insurer_id, period_month, line_status, error_reason, skip_reason)
           VALUES ${ph.join(',')}`,
          v,
        );
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    await this.audit.log({
      operator, action: 'FINANCE_BILL_IMPORT', module: 'finance',
      targetType: 'commission_bill', targetId: billId, success: true,
      params: {
        batch_no: batchNo, insurer_id: dto.insurer_id, period_month: dto.period_month,
        file_name: dto.file_name, ...{
          imported: result.success_count, failed: result.failed_count,
          duplicate: result.duplicate_count, empty: result.empty,
        },
      },
    });

    return { bill_id: billId, batch_no: batchNo, ...result };
  }

  async getBillDetail(id: string) {
    const res = await pool.query(
      'SELECT * FROM commission_bill WHERE bill_id = $1 AND deleted = FALSE', [id],
    );
    if (res.rowCount === 0) throw new NotFoundException(`Bill ${id} not found`);
    const bill = res.rows[0];

    const [lineRes, distRes, diffRes] = await Promise.all([
      pool.query(
        `SELECT line_status, match_status, COUNT(*)::int AS c
           FROM commission_bill_line
          WHERE bill_id = $1 AND deleted = FALSE
          GROUP BY line_status, match_status`,
        [id],
      ),
      pool.query(
        `SELECT trial_level, COUNT(*)::int AS c
           FROM commission_bill_line
          WHERE bill_id = $1 AND deleted = FALSE AND line_status = 'imported'
          GROUP BY trial_level`,
        [id],
      ),
      pool.query(
        `SELECT resolution, COUNT(*)::int AS c, COALESCE(SUM(ABS(diff_amount)),0) AS amount
           FROM reconciliation_diff
          WHERE bill_id = $1 AND deleted = FALSE
          GROUP BY resolution`,
        [id],
      ),
    ]);
    const byLine: Record<string, number> = { imported: 0, duplicate: 0, failed: 0 };
    const byMatch: Record<string, number> = {};
    for (const r of lineRes.rows) {
      byLine[r.line_status] = r.c;
      if (r.match_status) byMatch[r.match_status] = (byMatch[r.match_status] || 0) + r.c;
    }
    const distribution: Record<string, number> = {
      product_state: 0, product_all: 0, lob_state: 0, lob_all: 0, bill_original: 0,
    };
    let distributedTotal = 0;
    for (const r of distRes.rows) {
      if (r.trial_level && r.trial_level in distribution) distribution[r.trial_level] = r.c;
      distributedTotal += n2(r.c);
    }
    const diffs: Record<string, { count: number; amount: number }> = {
      open: { count: 0, amount: 0 }, suspended: { count: 0, amount: 0 }, resolved: { count: 0, amount: 0 },
    };
    for (const r of diffRes.rows) {
      const key = ['open', 'suspended', 'resolved'].includes(r.resolution) ? r.resolution : 'resolved';
      diffs[key] = { count: r.c, amount: n2(r.amount) };
    }
    return {
      ...bill,
      line_counts: byLine,
      match_counts: byMatch,
      trial_distribution: { ...distribution, _untrialed: byLine.imported - distributedTotal },
      diff_summary: diffs,
    };
  }

  async getBillErrors(id: string) {
    await this.getBillDetail(id);
    const res = await pool.query(
      `SELECT line_number AS row, policy_number, error_reason
         FROM commission_bill_line
        WHERE bill_id = $1 AND line_status = 'failed' AND deleted = FALSE
        ORDER BY line_number`,
      [id],
    );
    return {
      bill_id: id,
      failed: res.rowCount,
      errors: res.rows.map((r) => ({ row: r.row, policy_number: r.policy_number, message: r.error_reason })),
    };
  }

  async getBillLines(billId: string, query: any) {
    await this.getBillDetail(billId);
    const { page, size } = parsePage(query, 50);
    const conds = ['l.bill_id = $1', 'l.deleted = FALSE'];
    const vals: any[] = [billId];
    let idx = 2;
    const tab = query.tab || 'all';
    if (tab === 'exception') {
      conds.push(`l.match_status IN ('rate_diff','amount_diff')`);
    } else if (tab === 'duplicate') {
      conds.push(`l.line_status = 'duplicate'`);
    } else if (tab === 'failed') {
      conds.push(`l.line_status = 'failed'`);
    } else if (tab === 'imported') {
      conds.push(`l.line_status = 'imported'`);
    }
    if (query.match_status) { conds.push(`l.match_status = $${idx++}`); vals.push(query.match_status); }
    if (query.resolution) {
      conds.push(`d.resolution = $${idx++}`);
      vals.push(query.resolution);
    }
    if (query.search) {
      conds.push(`(l.policy_number ILIKE $${idx} OR l.insured_name ILIKE $${idx})`);
      vals.push(`%${query.search}%`);
      idx += 1;
    }
    const where = conds.join(' AND ');
    const offset = (page - 1) * size;
    vals.push(size, offset);
    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT l.*, d.diff_id, d.resolution AS diff_resolution, d.resolution_result,
                d.note AS diff_note, d.suspend_reason, d.follow_ups, d.resolved_date,
                d.resolved_by
           FROM commission_bill_line l
           LEFT JOIN reconciliation_diff d
             ON d.line_id = l.line_id AND d.deleted = FALSE
          WHERE ${where}
          ORDER BY l.line_status DESC, l.line_number ASC
          LIMIT $${idx} OFFSET $${idx + 1}`,
        vals,
      ),
      pool.query(
        `SELECT COUNT(*) FROM commission_bill_line l
           LEFT JOIN reconciliation_diff d ON d.line_id = l.line_id AND d.deleted = FALSE
          WHERE ${where}`,
        vals.slice(0, idx - 1),
      ),
    ]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  // ─── 批次试算对账（V1.0.15）─────────────────────────────────────────

  /** 装载保司在指定日生效的佣金率，并构建 产品|州 / 险种|州 映射。 */
  private async buildRateMaps(carrierId: string, asOf: string) {
    const res = await pool.query(
      `SELECT r.*, p.product_code AS ip_product_code
         FROM carrier_commission_rate r
         LEFT JOIN insurance_product p ON p.product_id = r.product_id
        WHERE r.carrier_id = $1 AND r.status = 'active' AND r.deleted = FALSE
          AND r.effective_from <= $2 AND (r.effective_to IS NULL OR r.effective_to >= $2)`,
      [carrierId, asOf],
    );
    const rateByProduct = new Map<string, { rate: number; row: any }>();
    const rateByLob = new Map<string, { rate: number; row: any }>();
    for (const r of res.rows) {
      const st = str(r.state) ?? '__ALL__';
      if (r.dimension === 'product' && str(r.product_id)) {
        // 账单行 product_code 列可能是内部产品ID或保司产品编码，两个键都建索引
        rateByProduct.set(`${str(r.product_id)}|${st}`, { rate: round4(r.rate), row: r });
        if (str(r.ip_product_code)) {
          rateByProduct.set(`${str(r.ip_product_code)}|${st}`, { rate: round4(r.rate), row: r });
        }
      } else if (r.dimension === 'lob' && str(r.line_of_business)) {
        rateByLob.set(`${str(r.line_of_business)}|${st}`, { rate: round4(r.rate), row: r });
      }
    }
    const lookup = (productCode: string | null, lob: string | null, state: string | null) => {
      if (productCode) {
        if (state && rateByProduct.has(`${productCode}|${state}`)) {
          return { level: 'product_state', ...rateByProduct.get(`${productCode}|${state}`)! };
        }
        if (rateByProduct.has(`${productCode}|__ALL__`)) {
          return { level: 'product_all', ...rateByProduct.get(`${productCode}|__ALL__`)! };
        }
      }
      if (lob) {
        if (state && rateByLob.has(`${lob}|${state}`)) {
          return { level: 'lob_state', ...rateByLob.get(`${lob}|${state}`)! };
        }
        if (rateByLob.has(`${lob}|__ALL__`)) {
          return { level: 'lob_all', ...rateByLob.get(`${lob}|__ALL__`)! };
        }
      }
      return null;
    };
    return { lookup };
  }

  /** 对单行做试算：命中四级回退则 期望佣金=保费×费率；均无则沿用账单原值。 */
  private trialLine(line: any, lookup: RateLookup) {
    const hit = lookup(str(line.product_code), str(line.line_of_business), str(line.state));
    if (hit) {
      return {
        level: hit.level as string,
        our_rate: hit.rate,
        our_amount: round2(n2(line.premium) * hit.rate),
        rate_row: hit.row,
      };
    }
    return {
      level: 'bill_original',
      our_rate: round4(n2(line.commission_rate)),
      our_amount: round2(n2(line.commission_amount)),
      rate_row: null,
    };
  }

  /** 批次发起试算/重新试算：逐行写三值与档位，按批次生成/刷新 open 差异。 */
  async reconcileBill(billId: string, operator: AuditOperator) {
    const bill = await this.getBillDetail(billId);
    if (bill.import_status !== 'imported') throw new BadRequestException('Voided bill cannot be reconciled');
    if (bill.recon_status === 'completed') {
      throw new BadRequestException('Batch is locked; ask a supervisor to unlock before recalculating');
    }

    const linesRes = await pool.query(
      `SELECT * FROM commission_bill_line
        WHERE bill_id = $1 AND line_status = 'imported' AND deleted = FALSE
        ORDER BY line_number`,
      [billId],
    );
    const { lookup } = await this.buildRateMaps(bill.insurer_id, bill.period_month + '-01');

    let billAmount = 0;
    let ourAmount = 0;
    let matched = 0;
    const exceptions: Array<{ line: any; trial: { level: string; our_rate: number; our_amount: number } }> = [];
    const trials = linesRes.rows.map((line: any) => {
      const trial = this.trialLine(line, lookup);
      const billAmt = round2(n2(line.commission_amount));
      const diff = round2(billAmt - trial.our_amount);
      billAmount += billAmt;
      ourAmount += trial.our_amount;
      const moneyDiff = Math.abs(diff) > 0.005;
      const rateDiff = Math.abs(n2(line.commission_rate) - trial.our_rate) > 0.00005;
      const matchStatus = !moneyDiff ? 'matched' : rateDiff ? 'rate_diff' : 'amount_diff';
      if (matchStatus === 'matched') matched += 1;
      else exceptions.push({ line, trial: { level: trial.level, our_rate: trial.our_rate, our_amount: trial.our_amount } });
      return { line, trial, billAmt, diff, matchStatus };
    });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // 幂等：清掉仍 open/suspended 的旧差异（已 resolved 的处理记录与时间线保留）
      await client.query(
        `DELETE FROM reconciliation_diff WHERE bill_id = $1 AND resolution IN ('open','suspended')`,
        [billId],
      );
      for (const t of trials) {
        await client.query(
          `UPDATE commission_bill_line
              SET our_commission_rate = $2, our_commission_amount = $3,
                  diff_amount = $4, match_status = $5, trial_level = $6, updated_at = NOW()
            WHERE line_id = $1`,
          [t.line.line_id, t.trial.our_rate, t.trial.our_amount, t.diff, t.matchStatus, t.trial.level],
        );
      }
      for (const ex of exceptions) {
        const billAmt = round2(n2(ex.line.commission_amount));
        const diff = round2(billAmt - ex.trial.our_amount);
        const diffType = ex.line && Math.abs(n2(ex.line.commission_rate) - ex.trial.our_rate) > 0.00005
          ? 'rate_diff' : 'amount_diff';
        await client.query(
          `INSERT INTO reconciliation_diff
             (diff_id, bill_id, line_id, bill_name, insurer_id, insurer_short, policy_number,
              insured_name, diff_type, bill_amount, our_amount, diff_amount,
              status, resolution, assigned_to, created_date, category, follow_ups)
           VALUES ('df' || substring(replace(gen_random_uuid()::text,'-','') for 30),
                   $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'open','open',$12,CURRENT_DATE,'commission','[]'::jsonb)`,
          [
            billId, ex.line.line_id, bill.file_name, bill.insurer_id, bill.insurer_short,
            ex.line.policy_number, ex.line.insured_name, diffType,
            billAmt, ex.trial.our_amount, diff, operator.username || 'admin',
          ],
        );
      }
      await client.query(
        `UPDATE commission_bill
            SET recon_status = 'running',
                matched_policies = $2, exception_count = $3,
                reconciled_amount = $4, difference_amount = $5,
                total_commission = GREATEST(total_commission, $6),
                status = CASE WHEN $3 > 0 THEN 'exception' ELSE 'uploaded' END,
                updated_at = NOW()
          WHERE bill_id = $1`,
        [billId, matched, exceptions.length, round2(ourAmount), round2(billAmount - ourAmount), round2(billAmount)],
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    await this.audit.log({
      operator, action: 'FINANCE_BILL_RECONCILE', module: 'finance',
      targetType: 'commission_bill', targetId: billId, success: true,
      params: { matched, exceptions: exceptions.length, bill_amount: round2(billAmount), our_amount: round2(ourAmount) },
    });

    return this.getBillDetail(billId);
  }

  /** 封帐（确认对账）：存在 open/suspended 差异时 409（O2）。 */
  async completeBill(billId: string, operator: AuditOperator, note?: string) {
    const bill = await this.getBillDetail(billId);
    if (bill.import_status !== 'imported') throw new BadRequestException('Voided bill cannot be completed');
    if (bill.recon_status !== 'running') {
      throw new BadRequestException('Run trial reconciliation before completing the batch');
    }
    const openCount = bill.diff_summary.open.count + bill.diff_summary.suspended.count;
    if (openCount > 0) {
      throw new BadRequestException(
        `Cannot lock batch: ${bill.diff_summary.open.count} open and ${bill.diff_summary.suspended.count} suspended diffs remain`,
      );
    }
    const res = await pool.query(
      `UPDATE commission_bill
          SET recon_status = 'completed', locked_by = $2, locked_at = NOW(),
              completed_at = NOW(), status = 'reconciled', updated_at = NOW()
        WHERE bill_id = $1 RETURNING *`,
      [billId, operator.username || 'admin'],
    );
    await this.audit.log({
      operator, action: 'FINANCE_BILL_COMPLETE', module: 'finance',
      targetType: 'commission_bill', targetId: billId, success: true,
      params: { note: note ?? null },
    });
    return res.rows[0];
  }

  /** 主管解锁：completed → running，清空锁定标记。 */
  async unlockBill(billId: string, operator: AuditOperator) {
    await this.getBillDetail(billId);
    const res = await pool.query(
      `UPDATE commission_bill
          SET recon_status = 'running', locked_by = NULL, locked_at = NULL,
              completed_at = NULL, status = CASE WHEN exception_count > 0 THEN 'exception' ELSE 'uploaded' END,
              updated_at = NOW()
        WHERE bill_id = $1 AND recon_status = 'completed' RETURNING *`,
      [billId],
    );
    if (res.rowCount === 0) throw new BadRequestException('Batch is not locked');
    await this.audit.log({
      operator, action: 'FINANCE_BILL_UNLOCK', module: 'finance',
      targetType: 'commission_bill', targetId: billId, success: true, params: {},
    });
    return res.rows[0];
  }

  /** 作废（软删）：已锁定批次不可作废；数据保留可审计。 */
  async voidBill(billId: string, operator: AuditOperator) {
    const bill = await this.getBillDetail(billId);
    if (bill.recon_status === 'completed') {
      throw new BadRequestException('Locked batch must be unlocked by a supervisor before voiding');
    }
    const res = await pool.query(
      `UPDATE commission_bill
          SET import_status = 'voided', deleted = TRUE,
              voided_by = $2, voided_at = NOW(), updated_at = NOW()
        WHERE bill_id = $1 RETURNING bill_id`,
      [billId, operator.username || 'admin'],
    );
    await this.audit.log({
      operator, action: 'FINANCE_BILL_VOID', module: 'finance',
      targetType: 'commission_bill', targetId: billId, success: true, params: {},
    });
    return { bill_id: res.rows[0].bill_id, voided: true };
  }

  /** 批量作废批次（软删，仅主管；已锁定批次自动跳过）。 */
  async batchVoidBills(ids: string[], operator: AuditOperator) {
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) throw new BadRequestException('ids must be a non-empty array');
    const res = await pool.query(
      `UPDATE commission_bill
          SET import_status = 'voided', deleted = TRUE,
              voided_by = $2, voided_at = NOW(), updated_at = NOW()
        WHERE bill_id = ANY($1) AND deleted = FALSE AND recon_status <> 'completed'
       RETURNING bill_id`,
      [unique, operator.username || 'admin'],
    );
    for (const row of res.rows) {
      await this.audit.log({
        operator, action: 'FINANCE_BILL_VOID', module: 'finance',
        targetType: 'commission_bill', targetId: row.bill_id, success: true,
        params: { batch: true },
      });
    }
    return { voided: res.rowCount ?? 0, skipped: unique.length - (res.rowCount ?? 0) };
  }

  /** 差异行重新计算：用最新佣金率重跑该行试算并刷新差异金额。 */
  async recalcDiff(diffId: string, operator: AuditOperator) {
    const diff = await this.getDiffById(diffId);
    if (!diff.line_id || !diff.bill_id) throw new BadRequestException('Diff has no batch line to recalculate');
    const bill = await this.getBillDetail(diff.bill_id);
    const lineRes = await pool.query(
      'SELECT * FROM commission_bill_line WHERE line_id = $1 AND deleted = FALSE', [diff.line_id],
    );
    if (lineRes.rowCount === 0) throw new NotFoundException(`Line ${diff.line_id} not found`);
    const { lookup } = await this.buildRateMaps(bill.insurer_id, bill.period_month + '-01');
    const trial = this.trialLine(lineRes.rows[0], lookup);
    const billAmt = round2(n2(lineRes.rows[0].commission_amount));
    const newDiff = round2(billAmt - trial.our_amount);
    const rateDiff = Math.abs(n2(lineRes.rows[0].commission_rate) - trial.our_rate) > 0.00005;
    const matchStatus = Math.abs(newDiff) <= 0.005 ? 'matched' : rateDiff ? 'rate_diff' : 'amount_diff';
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE commission_bill_line
            SET our_commission_rate = $2, our_commission_amount = $3, diff_amount = $4,
                match_status = $5, trial_level = $6, updated_at = NOW()
          WHERE line_id = $1`,
        [diff.line_id, trial.our_rate, trial.our_amount, newDiff, matchStatus, trial.level],
      );
      if (matchStatus === 'matched') {
        // 重算后金额一致：自动关闭差异（处理结果=费率已更正），保留时间线
        await client.query(
          `UPDATE reconciliation_diff
              SET bill_amount = $2, our_amount = $3, diff_amount = 0,
                  diff_type = $5, resolution = 'resolved', status = 'resolved',
                  resolution_result = 'rate_corrected',
                  resolved_by = $6, resolved_date = CURRENT_DATE, updated_at = NOW()
            WHERE diff_id = $1`,
          [diffId, billAmt, trial.our_amount, newDiff, diff.diff_type || matchStatus, operator.username || 'admin'],
        );
      } else {
        await client.query(
          `UPDATE reconciliation_diff
              SET bill_amount = $2, our_amount = $3, diff_amount = $4,
                  diff_type = $5, resolution = 'open', status = 'open',
                  suspend_reason = NULL, updated_at = NOW()
            WHERE diff_id = $1`,
          [diffId, billAmt, trial.our_amount, newDiff, matchStatus, diffId],
        );
      }
      await this.refreshBillExceptionCount(client, diff.bill_id);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    await this.audit.log({
      operator, action: 'FINANCE_DIFF_RECALC', module: 'finance',
      targetType: 'reconciliation_diff', targetId: diffId, success: true,
      params: { trial_level: trial.level, our_rate: trial.our_rate, new_diff: newDiff },
    });
    return this.getDiffById(diffId);
  }

  private async refreshBillExceptionCount(client: any, billId: string) {
    await client.query(
      `UPDATE commission_bill b
          SET exception_count = (SELECT COUNT(*) FROM reconciliation_diff d
                                  WHERE d.bill_id = b.bill_id AND d.deleted = FALSE
                                    AND d.resolution IN ('open','suspended')),
              updated_at = NOW()
        WHERE b.bill_id = $1`,
      [billId],
    );
  }

  // ─── Mapping templates ─────────────────────────────────────────────

  async getTemplates(query: any) {
    const conds = ['deleted = FALSE'];
    const vals: any[] = [];
    let idx = 1;
    if (query.insurer_id) { conds.push(`insurer_id = $${idx++}`); vals.push(query.insurer_id); }
    if (query.category && query.category !== 'all') { conds.push(`category = $${idx++}`); vals.push(query.category); }
    const res = await pool.query(
      `SELECT * FROM bill_field_mapping_template WHERE ${conds.join(' AND ')}
       ORDER BY insurer_id, category, updated_at DESC`, vals,
    );
    return { data: res.rows, total: res.rowCount };
  }

  async createTemplate(dto: MappingTemplateUpsertDto, operator: AuditOperator) {
    await this.requireCarrier(dto.insurer_id);
    const id = genId('tpl');
    const res = await pool.query(
      `INSERT INTO bill_field_mapping_template
         (template_id, insurer_id, category, template_name, file_format,
          sheet_name, header_row, mapping_json, enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) RETURNING *`,
      [
        id, dto.insurer_id, dto.category || 'commission', dto.template_name, dto.file_format,
        str(dto.sheet_name), dto.header_row ?? 1,
        JSON.stringify(dto.mapping_json || {}), dto.enabled ?? true,
      ],
    );
    await this.audit.log({
      operator, action: 'MAPPING_SAVE', module: 'finance',
      targetType: 'mapping_template', targetId: id, success: true,
      params: { insurer_id: dto.insurer_id, category: dto.category || 'commission', template_name: dto.template_name },
    });
    return res.rows[0];
  }

  async updateTemplate(id: string, dto: Partial<MappingTemplateUpsertDto>, operator: AuditOperator) {
    const fields = ['template_name', 'file_format', 'sheet_name', 'header_row', 'enabled'];
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const f of fields) {
      if ((dto as any)[f] !== undefined) { sets.push(`${f} = $${idx++}`); vals.push((dto as any)[f]); }
    }
    if (dto.mapping_json !== undefined) { sets.push(`mapping_json = $${idx++}::jsonb`); vals.push(JSON.stringify(dto.mapping_json)); }
    if (sets.length === 0) return this.requireTemplate(id);
    sets.push('updated_at = NOW()');
    vals.push(id);
    const res = await pool.query(
      `UPDATE bill_field_mapping_template SET ${sets.join(', ')}
        WHERE template_id = $${idx} AND deleted = FALSE RETURNING *`, vals,
    );
    if (res.rowCount === 0) throw new NotFoundException(`Template ${id} not found`);
    await this.audit.log({
      operator, action: 'MAPPING_SAVE', module: 'finance',
      targetType: 'mapping_template', targetId: id, success: true,
      params: { updated: fields.filter((f) => (dto as any)[f] !== undefined) },
    });
    return res.rows[0];
  }

  async deleteTemplate(id: string, operator: AuditOperator) {
    const res = await pool.query(
      `UPDATE bill_field_mapping_template SET deleted = TRUE, updated_at = NOW()
        WHERE template_id = $1 AND deleted = FALSE RETURNING template_id`, [id],
    );
    if (res.rowCount === 0) throw new NotFoundException(`Template ${id} not found`);
    await this.audit.log({
      operator, action: 'MAPPING_SAVE', module: 'finance',
      targetType: 'mapping_template', targetId: id, success: true,
      params: { deleted: true },
    });
    return { deleted: true };
  }

  // ─── Our commission/premium statements ─────────────────────────────

  async getStatements(query: any) {
    const { page, size } = parsePage(query, 50);
    const conds = ['deleted = FALSE'];
    const vals: any[] = [];
    let idx = 1;
    if (query.category && query.category !== 'all') { conds.push(`category = $${idx++}`); vals.push(query.category); }
    if (query.insurer_id) { conds.push(`insurer_id = $${idx++}`); vals.push(query.insurer_id); }
    if (query.period_month) { conds.push(`period_month = $${idx++}`); vals.push(query.period_month); }
    if (query.status && query.status !== 'all') { conds.push(`status = $${idx++}`); vals.push(query.status); }
    const offset = (page - 1) * size;
    vals.push(size, offset);
    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT * FROM commission_statement WHERE ${conds.join(' AND ')}
         ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, vals,
      ),
      pool.query(`SELECT COUNT(*) FROM commission_statement WHERE ${conds.join(' AND ')}`, vals.slice(0, idx - 1)),
    ]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  async importStatement(dto: StatementImportDto, operator: AuditOperator) {
    const category = dto.category || 'commission';
    if (!PERIOD_RE.test(dto.period_month)) throw new BadRequestException('period_month must be YYYY-MM');
    if (dto.rows.length > MAX_ROWS) throw new BadRequestException(`rows exceeds ${MAX_ROWS}`);
    const carrier = await this.requireCarrier(dto.insurer_id);
    const fileName = dto.file_name || dto.source_stored_name || `statement-${dto.period_month}.${dto.file_format || 'xlsx'}`;
    const dup = await pool.query(
      `SELECT 1 FROM commission_statement
        WHERE insurer_id = $1 AND period_month = $2 AND category = $3
          AND COALESCE(source_stored_name, '') = COALESCE($4, '') AND deleted = FALSE`,
      [dto.insurer_id, dto.period_month, category, str(dto.source_stored_name) ?? str(fileName)],
    );
    if (dup.rowCount) throw new BadRequestException(`Statement already imported for this insurer/period: ${fileName}`);

    const { valid, errors, skipped, failedRows } = validateRows(dto.rows, category);
    const totalPremium = valid.reduce((s, r) => s + n2(r.premium), 0);
    const totalCommission = valid.reduce((s, r) => s + n2(r.commission_amount), 0);

    const statementId = genId('st');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO commission_statement
           (statement_id, insurer_id, insurer_name, insurer_short, period_month,
            category, status, source, source_url, source_stored_name,
            total_policies, total_premium, total_commission)
         VALUES ($1,$2,$3,$4,$5,$6,'draft',$7,$8,$9,$10,$11,$12)`,
        [
          statementId, dto.insurer_id, carrier.carrier_name, carrier.carrier_name_short, dto.period_month,
          category, dto.source || 'import', str(dto.source_url), str(dto.source_stored_name) ?? str(fileName),
          valid.length, round2(totalPremium), round2(totalCommission),
        ],
      );

      for (let i = 0; i < valid.length; i += CHUNK) {
        const slice = valid.slice(i, i + CHUNK);
        const v: any[] = [];
        const ph: string[] = [];
        slice.forEach((r) => {
          const p = v.length + 1;
          ph.push(`('sl' || substring(replace(gen_random_uuid()::text,'-','') for 30), $${p},$${p + 1},$${p + 2},$${p + 3},$${p + 4},$${p + 5},$${p + 6},$${p + 7},$${p + 8},$${p + 9},$${p + 10},$${p + 11}, FALSE, FALSE, NOW(), NOW())`);
          v.push(
            statementId, r._rowNo, str(r.policy_number), str(r.insured_name),
            str(r.npn), str(r.product_code), str(r.channel_name), str(r.state), str(r.line_of_business),
            round2(n2(r.premium)), round4(r.commission_rate), round2(n2(r.commission_amount)),
          );
        });
        await client.query(
          `INSERT INTO commission_statement_line
             (line_id, statement_id, line_number, policy_number, insured_name,
              npn, product_code, channel_name, state, line_of_business,
              premium, commission_rate, commission_amount, adjusted,
              deleted, created_at, updated_at)
           VALUES ${ph.join(',')}`,
          v,
        );
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    await this.audit.log({
      operator, action: 'STATEMENT_IMPORT', module: 'finance',
      targetType: 'commission_statement', targetId: statementId, success: true,
      params: {
        insurer_id: dto.insurer_id, period_month: dto.period_month, category,
        total: dto.rows.length, imported: valid.length, failed: failedRows.size, skipped,
      },
    });

    return {
      statement_id: statementId, total: dto.rows.length, imported: valid.length,
      failed: failedRows.size, skipped, errors,
    };
  }

  async getStatementDetail(id: string) {
    const res = await pool.query(
      'SELECT * FROM commission_statement WHERE statement_id = $1 AND deleted = FALSE', [id],
    );
    if (res.rowCount === 0) throw new NotFoundException(`Statement ${id} not found`);
    return res.rows[0];
  }

  async getStatementLines(id: string, query: any) {
    await this.getStatementDetail(id);
    const { page, size } = parsePage(query, 100);
    const offset = (page - 1) * size;
    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT * FROM commission_statement_line
          WHERE statement_id = $1 AND deleted = FALSE
          ORDER BY line_number ASC LIMIT $2 OFFSET $3`,
        [id, size, offset],
      ),
      pool.query(
        'SELECT COUNT(*) FROM commission_statement_line WHERE statement_id = $1 AND deleted = FALSE', [id],
      ),
    ]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  async adjustStatementLine(statementId: string, lineId: string, dto: StatementLineAdjustDto, operator: AuditOperator) {
    const stmt = await this.getStatementDetail(statementId);
    if (stmt.status !== 'draft') throw new BadRequestException('Only draft statements can be adjusted');
    const sets: string[] = ['adjusted = TRUE'];
    const vals: any[] = [];
    let idx = 1;
    if (dto.premium !== undefined) { sets.push(`premium = $${idx++}`); vals.push(round2(dto.premium)); }
    if (dto.commission_rate !== undefined) { sets.push(`commission_rate = $${idx++}`); vals.push(round4(dto.commission_rate)); }
    if (dto.commission_amount !== undefined) { sets.push(`commission_amount = $${idx++}`); vals.push(round2(dto.commission_amount)); }
    sets.push('updated_at = NOW()');
    vals.push(lineId, statementId);
    const res = await pool.query(
      `UPDATE commission_statement_line SET ${sets.join(', ')}
        WHERE line_id = $${idx} AND statement_id = $${idx + 1} AND deleted = FALSE RETURNING *`,
      vals,
    );
    if (res.rowCount === 0) throw new NotFoundException(`Statement line ${lineId} not found`);

    const agg = await pool.query(
      `SELECT COUNT(*)::int AS c, COALESCE(SUM(premium),0) AS p, COALESCE(SUM(commission_amount),0) AS cm
         FROM commission_statement_line WHERE statement_id = $1 AND deleted = FALSE`,
      [statementId],
    );
    await pool.query(
      `UPDATE commission_statement
         SET total_policies = $2, total_premium = $3, total_commission = $4, updated_at = NOW()
       WHERE statement_id = $1`,
      [statementId, agg.rows[0].c, round2(n2(agg.rows[0].p)), round2(n2(agg.rows[0].cm))],
    );
    await this.audit.log({
      operator, action: 'STATEMENT_ADJUST', module: 'finance',
      targetType: 'statement_line', targetId: lineId, success: true,
      params: { statement_id: statementId, premium: dto.premium, commission_rate: dto.commission_rate, commission_amount: dto.commission_amount },
    });
    return res.rows[0];
  }

  async confirmStatement(id: string, operator: AuditOperator) {
    const stmt = await this.getStatementDetail(id);
    if (stmt.status !== 'draft') throw new BadRequestException('Statement is already confirmed');
    const lineCount = await pool.query(
      'SELECT COUNT(*)::int AS c FROM commission_statement_line WHERE statement_id = $1 AND deleted = FALSE', [id],
    );
    if (lineCount.rows[0].c === 0) throw new BadRequestException('Cannot confirm an empty statement');
    const res = await pool.query(
      `UPDATE commission_statement
         SET status = 'confirmed', confirmed_by = $2, confirmed_at = NOW(), updated_at = NOW()
       WHERE statement_id = $1 RETURNING *`,
      [id, operator.username || 'admin'],
    );
    await this.audit.log({
      operator, action: 'STATEMENT_CONFIRM', module: 'finance',
      targetType: 'commission_statement', targetId: id, success: true,
      params: { total_policies: stmt.total_policies, total_commission: n2(stmt.total_commission) },
    });
    return res.rows[0];
  }

  // ─── Reconciliation engine ─────────────────────────────────────────

  async startReconciliation(dto: ReconcileStartDto, operator: AuditOperator) {
    const category = dto.category || 'commission';
    if (!PERIOD_RE.test(dto.period_month)) throw new BadRequestException('period_month must be YYYY-MM');

    const stmtRes = await pool.query(
      `SELECT * FROM commission_statement
        WHERE insurer_id = $1 AND period_month = $2 AND category = $3 AND status = 'confirmed' AND deleted = FALSE
        ORDER BY confirmed_at DESC LIMIT 1`,
      [dto.insurer_id, dto.period_month, category],
    );
    if (stmtRes.rowCount === 0) {
      throw new BadRequestException('No confirmed statement for this insurer/period/category');
    }
    const stmt = stmtRes.rows[0];

    const billsRes = await pool.query(
      `SELECT * FROM commission_bill
        WHERE insurer_id = $1 AND period_month = $2 AND category = $3 AND deleted = FALSE
        ORDER BY import_date ASC`,
      [dto.insurer_id, dto.period_month, category],
    );
    if (billsRes.rowCount === 0) throw new BadRequestException('No imported bills for this insurer/period/category');
    const bills = billsRes.rows;
    const billIds = bills.map((b: any) => b.bill_id);

    const [ourLinesRes, billLinesRes] = await Promise.all([
      pool.query(
        'SELECT * FROM commission_statement_line WHERE statement_id = $1 AND deleted = FALSE ORDER BY line_number',
        [stmt.statement_id],
      ),
      pool.query(
        `SELECT * FROM commission_bill_line WHERE bill_id = ANY($1) AND deleted = FALSE ORDER BY line_number`,
        [billIds],
      ),
    ]);

    // D5: 我方期望佣金率取自 carrier_commission_rate 主数据，期望佣金 = 保费 × 佣金率
    // key = 产品/险种代码 + '|' + 州（'__ALL__' 表示 state IS NULL 的全域记录）
    const rateDate = dto.period_month + '-01';
    const rateRes = await pool.query(
      `SELECT * FROM carrier_commission_rate
        WHERE carrier_id = $1 AND status = 'active' AND deleted = FALSE
          AND effective_from <= $2 AND (effective_to IS NULL OR effective_to >= $2)`,
      [dto.insurer_id, rateDate],
    );
    const rateByProduct = new Map<string, number>();
    const rateByLob = new Map<string, number>();
    for (const r of rateRes.rows) {
      const st = str(r.state) ?? '__ALL__';
      if (r.dimension === 'product' && str(r.product_id)) {
        rateByProduct.set(`${str(r.product_id)}|${st}`, round4(r.rate));
      } else if (r.dimension === 'lob' && str(r.line_of_business)) {
        rateByLob.set(`${str(r.line_of_business)}|${st}`, round4(r.rate));
      }
    }
    const GLOBAL_STATE = '__ALL__';
    // 四级回退：产品+州 → 产品+全域 → 险种+州 → 险种+全域；未命中返回 null
    const lookupMasterRate = (productCode: string | null, lob: string | null, state: string | null): number | null => {
      if (productCode) {
        if (state && rateByProduct.has(`${productCode}|${state}`)) return rateByProduct.get(`${productCode}|${state}`)!;
        if (rateByProduct.has(`${productCode}|${GLOBAL_STATE}`)) return rateByProduct.get(`${productCode}|${GLOBAL_STATE}`)!;
      }
      if (lob) {
        if (state && rateByLob.has(`${lob}|${state}`)) return rateByLob.get(`${lob}|${state}`)!;
        if (rateByLob.has(`${lob}|${GLOBAL_STATE}`)) return rateByLob.get(`${lob}|${GLOBAL_STATE}`)!;
      }
      return null;
    };

    const ourMap = new Map<string, any>();
    for (const l of ourLinesRes.rows) ourMap.set(this.policyKey(l.policy_number), l);
    const billMap = new Map<string, any>();
    for (const l of billLinesRes.rows) billMap.set(this.policyKey(l.policy_number), l);

    const allKeys = new Set<string>([...ourMap.keys(), ...billMap.keys()]);
    const sections: Record<'matched' | 'rate' | 'premium' | 'agent' | 'manual' | 'missing' | 'extra', CompareItem[]> = {
      matched: [], rate: [], premium: [], agent: [], manual: [], missing: [], extra: [],
    };

    const amountOf = (l: any) => (category === 'premium' ? n2(l.premium) : n2(l.commission_amount));

    for (const key of [...allKeys].sort()) {
      const b = billMap.get(key);
      const o = ourMap.get(key);

      // D5: 仅 commission 类别从主数据取佣金率，期望佣金 = 保费 × 佣金率
      let ourCommissionRate = o ? round4(n2(o.commission_rate)) : 0;
      let ourCommissionAmount = o ? round2(n2(o.commission_amount)) : 0;
      if (o && category === 'commission') {
        const productKey = str(o.product_code);
        const lobKey = str(o.line_of_business);
        const stateKey = str(o.state);
        const masterRate = lookupMasterRate(productKey, lobKey, stateKey);
        if (masterRate !== null) {
          ourCommissionRate = masterRate;
          ourCommissionAmount = round2(n2(o.premium) * masterRate);
        }
      }

      const item: CompareItem = {
        policy_number: (b || o).policy_number,
        insured_name: (b || o).insured_name,
        bill: {
          bill_id: b?.bill_id, line_number: b?.line_number, insured_name: b?.insured_name ?? null,
          npn: b?.npn ?? null, product_code: b?.product_code ?? null, channel_name: b?.channel_name ?? null,
          state: b?.state ?? null, line_of_business: b?.line_of_business ?? null,
          premium: b ? round2(n2(b.premium)) : null,
          commission_rate: b ? round4(n2(b.commission_rate)) : null,
          commission_amount: b ? round2(n2(b.commission_amount)) : null,
        },
        our: {
          line_number: o?.line_number, insured_name: o?.insured_name ?? null,
          npn: o?.npn ?? null, product_code: o?.product_code ?? null, channel_name: o?.channel_name ?? null,
          state: o?.state ?? null, line_of_business: o?.line_of_business ?? null,
          premium: o ? round2(n2(o.premium)) : null,
          commission_rate: o ? ourCommissionRate : null,
          commission_amount: o ? ourCommissionAmount : null,
        },
        bill_amount: round2(b ? amountOf(b) : 0),
        our_amount: o ? (category === 'premium' ? round2(n2(o.premium)) : ourCommissionAmount) : 0,
        diff_amount: 0,
      };
      item.diff_amount = round2(item.bill_amount - item.our_amount);

      if (!b) {
        item.diff_type = 'missing';
        sections.missing.push(item);
      } else if (!o) {
        item.diff_type = 'extra';
        sections.extra.push(item);
      } else {
        let type: 'rate' | 'premium' | 'agent' | 'manual' | null = null;
        const moneyDiff = Math.abs(item.bill_amount - item.our_amount) > 0.005;
        const premiumDiff = Math.abs(n2(b.premium) - n2(o.premium)) > 0.005;
        const rateDiff = Math.abs(n2(b.commission_rate) - ourCommissionRate) > 0.00005;
        const agentDiff =
          (str(b.channel_name) && str(o.channel_name) && !eqText(b.channel_name, o.channel_name)) ||
          (str(b.npn) && str(o.npn) && !eqText(b.npn, o.npn)) ||
          (str(b.product_code) && str(o.product_code) && !eqText(b.product_code, o.product_code));

        if (category === 'commission') {
          if (moneyDiff) type = rateDiff ? 'rate' : premiumDiff ? 'premium' : 'manual';
          else if (premiumDiff) type = 'premium';
          else if (agentDiff) type = 'agent';
        } else {
          if (moneyDiff) type = 'premium';
          else if (agentDiff) type = 'agent';
        }
        if (!type) sections.matched.push(item);
        else { item.diff_type = type; sections[type].push(item); }
      }
    }

    const diffItems = [...sections.rate, ...sections.premium, ...sections.agent, ...sections.manual, ...sections.missing, ...sections.extra];
    const matchedCount = sections.matched.length;
    const diffCount = sections.rate.length + sections.premium.length + sections.agent.length + sections.manual.length;
    const billAmount = round2([...allKeys].reduce((s, k) => s + (billMap.has(k) ? amountOf(billMap.get(k)) : 0), 0));
    const ourAmount = round2(
      [...sections.matched, ...diffItems].reduce((s, it) => s + it.our_amount, 0),
    );

    const runId = genId('rr');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 幂等：清掉同维度历史 run 上仍 open 的差异（已处理的保留作历史）
      await client.query(
        `DELETE FROM reconciliation_diff
          WHERE insurer_id = $1 AND category = $2 AND resolution = 'open'
            AND run_id IN (SELECT run_id FROM reconciliation_run
                            WHERE insurer_id = $1 AND period_month = $3 AND category = $2)`,
        [dto.insurer_id, category, dto.period_month],
      );

      await client.query(
        `INSERT INTO reconciliation_run
           (run_id, insurer_id, insurer_name, insurer_short, period_month, category,
            statement_id, bill_ids, status,
            total_count, matched_count, diff_count, missing_count, extra_count,
            bill_amount, our_amount, diff_amount, created_by, report_json)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,'done',$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb)`,
        [
          runId, dto.insurer_id, stmt.insurer_name, stmt.insurer_short, dto.period_month, category,
          stmt.statement_id, JSON.stringify(billIds),
          allKeys.size, matchedCount, diffCount, sections.missing.length, sections.extra.length,
          billAmount, ourAmount, round2(billAmount - ourAmount),
          operator.username || 'admin',
          JSON.stringify(sections),
        ],
      );

      for (const item of diffItems) {
        const b = billMap.get(this.policyKey(item.policy_number));
        await client.query(
          `INSERT INTO reconciliation_diff
             (diff_id, bill_id, bill_name, insurer_id, insurer_short, policy_number,
              insured_name, diff_type, bill_amount, our_amount, diff_amount,
              status, resolution, note, assigned_to, created_date,
              category, run_id, follow_ups)
           VALUES ('df' || substring(replace(gen_random_uuid()::text,'-','') for 30),
                   $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'open','open',NULL,$11,CURRENT_DATE,$12,$13,'[]'::jsonb)`,
          [
            item.diff_type === 'missing' ? null : b?.bill_id ?? null,
            item.diff_type === 'missing' ? null : b ? bills.find((x: any) => x.bill_id === b.bill_id)?.file_name ?? null : null,
            dto.insurer_id, stmt.insurer_short, item.policy_number,
            item.insured_name, item.diff_type,
            item.bill_amount, item.our_amount, item.diff_amount,
            operator.username || 'admin', category, runId,
          ],
        );
      }

      // 回写账单汇总状态
      for (const bill of bills) {
        const billItems = diffItems.filter((it) => it.bill.bill_id === bill.bill_id);
        const matchedForBill = sections.matched.filter((it) => it.bill.bill_id === bill.bill_id).length;
        const reconciled = round2(
          sections.matched.filter((it) => it.bill.bill_id === bill.bill_id).reduce((s, it) => s + it.our_amount, 0),
        );
        await client.query(
          `UPDATE commission_bill
             SET status = $2, matched_policies = $3, exception_count = $4,
                 reconciled_amount = $5,
                 difference_amount = $6, updated_at = NOW()
           WHERE bill_id = $1`,
          [
            bill.bill_id,
            billItems.length > 0 ? 'exception' : 'reconciled',
            matchedForBill, billItems.length, reconciled,
            round2(billItems.reduce((s, it) => s + it.diff_amount, 0)),
          ],
        );
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    await this.audit.log({
      operator, action: 'RECON_START', module: 'finance',
      targetType: 'reconciliation_run', targetId: runId, success: true,
      params: {
        insurer_id: dto.insurer_id, period_month: dto.period_month, category,
        total: allKeys.size, matched: matchedCount, diff: diffCount,
        missing: sections.missing.length, extra: sections.extra.length,
      },
    });

    return this.getRunDetail(runId);
  }

  async getRuns(query: any) {
    const { page, size } = parsePage(query, 20);
    const conds = ['deleted = FALSE'];
    const vals: any[] = [];
    let idx = 1;
    if (query.category && query.category !== 'all') { conds.push(`category = $${idx++}`); vals.push(query.category); }
    if (query.insurer_id) { conds.push(`insurer_id = $${idx++}`); vals.push(query.insurer_id); }
    if (query.period_month) { conds.push(`period_month = $${idx++}`); vals.push(query.period_month); }
    const offset = (page - 1) * size;
    vals.push(size, offset);
    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT * FROM reconciliation_run WHERE ${conds.join(' AND ')}
         ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, vals,
      ),
      pool.query(`SELECT COUNT(*) FROM reconciliation_run WHERE ${conds.join(' AND ')}`, vals.slice(0, idx - 1)),
    ]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  async getRunDetail(id: string) {
    const res = await pool.query(
      'SELECT * FROM reconciliation_run WHERE run_id = $1 AND deleted = FALSE', [id],
    );
    if (res.rowCount === 0) throw new NotFoundException(`Run ${id} not found`);
    const run = res.rows[0];
    const diffRes = await pool.query(
      'SELECT * FROM reconciliation_diff WHERE run_id = $1 AND deleted = FALSE', [id],
    );
    const diffByKey = new Map<string, any>();
    for (const d of diffRes.rows) diffByKey.set(`${d.diff_type}:${this.policyKey(d.policy_number)}`, d);

    const sections = (run.report_json || {}) as Record<string, CompareItem[]>;
    for (const key of Object.keys(sections)) {
      sections[key] = sections[key].map((item) => {
        const cur = diffByKey.get(`${item.diff_type}:${this.policyKey(item.policy_number)}`);
        return cur
          ? { ...item, diff_id: cur.diff_id, resolution: cur.resolution, note: cur.note, follow_ups: cur.follow_ups }
          : { ...item, resolution: 'closed' };
      });
    }
    return { run, items: sections };
  }

  // ─── Diffs (lightweight close-loop) ────────────────────────────────

  async getDiffs(query: any) {
    const { page, size } = parsePage(query, 20);
    const conds = ['d.deleted = FALSE'];
    const vals: any[] = [];
    let idx = 1;
    if (query.category && query.category !== 'all') { conds.push(`d.category = $${idx++}`); vals.push(query.category); }
    if (query.resolution && query.resolution !== 'all') { conds.push(`d.resolution = $${idx++}`); vals.push(query.resolution); }
    if (query.diff_type) { conds.push(`d.diff_type = $${idx++}`); vals.push(query.diff_type); }
    if (query.insurer_id) { conds.push(`d.insurer_id = $${idx++}`); vals.push(query.insurer_id); }
    if (query.period_month) {
      conds.push(`EXISTS (SELECT 1 FROM reconciliation_run r WHERE r.run_id = d.run_id AND r.period_month = $${idx++})`);
      vals.push(query.period_month);
    }
    if (query.search) {
      conds.push(`(d.policy_number ILIKE $${idx} OR d.insured_name ILIKE $${idx})`);
      vals.push(`%${query.search}%`);
      idx += 1;
    }
    const offset = (page - 1) * size;
    vals.push(size, offset);
    const sql = `
      SELECT d.*, r.period_month, r.category AS run_category
        FROM reconciliation_diff d
        LEFT JOIN reconciliation_run r ON r.run_id = d.run_id
       WHERE ${conds.join(' AND ')}
       ORDER BY d.created_at DESC, d.diff_id DESC
       LIMIT $${idx} OFFSET $${idx + 1}`;
    const countSql = `SELECT COUNT(*) FROM reconciliation_diff d WHERE ${conds.join(' AND ')}`;
    const [dataRes, countRes] = await Promise.all([
      pool.query(sql, vals),
      pool.query(countSql, vals.slice(0, idx - 1)),
    ]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  async getDiffStats(query: any) {
    const conds = ['deleted = FALSE'];
    const vals: any[] = [];
    let idx = 1;
    if (query.category && query.category !== 'all') { conds.push(`category = $${idx++}`); vals.push(query.category); }
    if (query.insurer_id) { conds.push(`insurer_id = $${idx++}`); vals.push(query.insurer_id); }
    if (query.period_month) {
      conds.push(`run_id IN (SELECT run_id FROM reconciliation_run WHERE period_month = $${idx++})`);
      vals.push(query.period_month);
    }
    const where = conds.join(' AND ');
    const [resolutionRes, typeRes, insurerRes] = await Promise.all([
      pool.query(
        `SELECT resolution, COUNT(*)::int AS count, COALESCE(SUM(ABS(diff_amount)), 0) AS amount
           FROM reconciliation_diff WHERE ${where} GROUP BY resolution ORDER BY resolution`,
        vals,
      ),
      pool.query(
        `SELECT diff_type, COUNT(*)::int AS count, COALESCE(SUM(ABS(diff_amount)), 0) AS amount
           FROM reconciliation_diff WHERE ${where} GROUP BY diff_type ORDER BY diff_type`,
        vals,
      ),
      pool.query(
        `SELECT insurer_id, insurer_short, category,
                COUNT(*) FILTER (WHERE resolution = 'open')::int AS open,
                COUNT(*) FILTER (WHERE resolution = 'suspended')::int AS suspended,
                COUNT(*)::int AS total,
                COALESCE(SUM(diff_amount) FILTER (WHERE resolution = 'open'), 0) AS open_amount
           FROM reconciliation_diff WHERE ${where}
          GROUP BY insurer_id, insurer_short, category ORDER BY open DESC, total DESC`,
        vals,
      ),
    ]);
    return {
      by_resolution: resolutionRes.rows.map((r) => ({ ...r, amount: n2(r.amount) })),
      by_type: typeRes.rows.map((r) => ({ ...r, amount: n2(r.amount) })),
      by_insurer: insurerRes.rows.map((r) => ({ ...r, open_amount: n2(r.open_amount) })),
    };
  }

  async diffAction(id: string, dto: DiffActionDto, operator: AuditOperator) {
    const diff = await this.getDiffById(id);
    let res;
    if (dto.action === 'resolve') {
      if (!dto.resolution_result) {
        throw new BadRequestException('resolve requires resolution_result');
      }
      res = await pool.query(
        `UPDATE reconciliation_diff
            SET resolution = 'resolved', status = 'resolved',
                resolution_result = $2,
                note = CASE WHEN $3::text IS NOT NULL THEN $3 ELSE note END,
                resolved_by = $4, resolved_date = CURRENT_DATE,
                suspend_reason = NULL, updated_at = NOW()
          WHERE diff_id = $1 RETURNING *`,
        [id, dto.resolution_result, str(dto.note), operator.username || 'admin'],
      );
    } else if (dto.action === 'suspend') {
      if (!str(dto.note)) throw new BadRequestException('suspend requires a reason note');
      res = await pool.query(
        `UPDATE reconciliation_diff
            SET resolution = 'suspended', status = 'suspended',
                suspend_reason = $2, updated_at = NOW()
          WHERE diff_id = $1 RETURNING *`,
        [id, str(dto.note)!.slice(0, 512)],
      );
    } else {
      // reopen：重新打开（仅 resolved/suspended 可打开）
      res = await pool.query(
        `UPDATE reconciliation_diff
            SET resolution = 'open', status = 'open',
                resolved_date = NULL, updated_at = NOW()
          WHERE diff_id = $1 AND resolution IN ('resolved','suspended','open') RETURNING *`,
        [id],
      );
    }
    await this.refreshBillExceptionCount(pool, diff.bill_id);
    await this.audit.log({
      operator, action: 'DIFF_ACTION', module: 'finance',
      targetType: 'reconciliation_diff', targetId: id, success: true,
      params: {
        action: dto.action, resolution_result: dto.resolution_result,
        note: dto.note, previous: diff.resolution,
      },
    });
    return res.rows[0];
  }

  async addDiffFollowUp(id: string, dto: DiffFollowUpDto, operator: AuditOperator) {
    await this.getDiffById(id);
    const entry = [{ at: new Date().toISOString(), by: operator.username || 'admin', note: dto.note }];
    const res = await pool.query(
      `UPDATE reconciliation_diff
          SET follow_ups = follow_ups || $2::jsonb, updated_at = NOW()
        WHERE diff_id = $1 RETURNING *`,
      [id, JSON.stringify(entry)],
    );
    await this.audit.log({
      operator, action: 'DIFF_FOLLOWUP', module: 'finance',
      targetType: 'reconciliation_diff', targetId: id, success: true,
      params: { note: dto.note },
    });
    return res.rows[0];
  }

  async getDiffById(id: string) {
    const res = await pool.query(
      'SELECT * FROM reconciliation_diff WHERE diff_id = $1 AND deleted = FALSE', [id],
    );
    if (res.rowCount === 0) throw new NotFoundException(`Diff ${id} not found`);
    return res.rows[0];
  }

  // ─── Insurer configs (master + 1:1 finance profile) ────────────────

  async getInsurerConfigs() {
    const res = await pool.query(
      `SELECT c.config_id, c.carrier_id, ic.carrier_name, ic.carrier_name_short AS insurer_short,
              c.cycle, c.bill_cutoff_day, c.payment_term_days, c.payment_method,
              c.billing_format, c.api_enabled, c.premium_collection,
              p.next_due_date, p.next_due_amount, p.ytd_settled,
              p.bank_account, p.routing_number, p.contact_email,
              p.notify_days_before, p.min_settle_amount, p.auto_reconcile
         FROM carrier_settlement_config c
         JOIN insurance_carrier ic ON ic.carrier_id = c.carrier_id
         LEFT JOIN insurer_finance_profile p ON p.config_id = c.config_id
        WHERE c.deleted = FALSE
        ORDER BY c.carrier_id`,
    );
    return { data: res.rows, total: res.rowCount };
  }

  async upsertProfile(configId: string, dto: FinanceProfileUpsertDto, operator: AuditOperator) {
    const exists = await pool.query(
      `SELECT 1 FROM carrier_settlement_config WHERE config_id = $1 AND deleted = FALSE`, [configId],
    );
    if (exists.rowCount === 0) throw new NotFoundException(`Settlement config ${configId} not found`);

    await pool.query(
      `INSERT INTO insurer_finance_profile (config_id) VALUES ($1) ON CONFLICT (config_id) DO NOTHING`,
      [configId],
    );
    const fields = ['next_due_date', 'next_due_amount', 'ytd_settled', 'bank_account',
      'routing_number', 'contact_email', 'notify_days_before', 'min_settle_amount', 'auto_reconcile'];
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const f of fields) {
      if ((dto as any)[f] !== undefined) {
        if (['next_due_amount', 'ytd_settled', 'min_settle_amount'].includes(f)) {
          sets.push(`${f} = $${idx++}`); vals.push(round2((dto as any)[f]));
        } else {
          sets.push(`${f} = $${idx++}`); vals.push((dto as any)[f]);
        }
      }
    }
    if (sets.length > 0) {
      sets.push('updated_at = NOW()');
      vals.push(configId);
      await pool.query(
        `UPDATE insurer_finance_profile SET ${sets.join(', ')} WHERE config_id = $${idx}`, vals,
      );
    }
    await this.audit.log({
      operator, action: 'PROFILE_UPDATE', module: 'finance',
      targetType: 'insurer_finance_profile', targetId: configId, success: true,
      params: fields.filter((f) => (dto as any)[f] !== undefined)
        .reduce((acc, f) => ({ ...acc, [f]: (dto as any)[f] }), {}),
    });
    const res = await pool.query(
      `SELECT c.config_id, c.carrier_id, ic.carrier_name, ic.carrier_name_short AS insurer_short,
              c.cycle, c.bill_cutoff_day, c.payment_term_days, c.payment_method,
              c.billing_format, c.api_enabled, c.premium_collection,
              p.next_due_date, p.next_due_amount, p.ytd_settled,
              p.bank_account, p.routing_number, p.contact_email,
              p.notify_days_before, p.min_settle_amount, p.auto_reconcile
         FROM carrier_settlement_config c
         JOIN insurance_carrier ic ON ic.carrier_id = c.carrier_id
         LEFT JOIN insurer_finance_profile p ON p.config_id = c.config_id
        WHERE c.config_id = $1`,
      [configId],
    );
    return res.rows[0];
  }

  // ─── Commission rate master data ───────────────────────────────────

  async getCommissionRates(carrierId?: string, dimension?: string, status?: string, state?: string) {
    const conds = ['r.deleted = FALSE'];
    const vals: any[] = [];
    let idx = 1;
    if (carrierId) { conds.push(`r.carrier_id = $${idx++}`); vals.push(carrierId); }
    if (dimension) { conds.push(`r.dimension = $${idx++}`); vals.push(dimension); }
    if (status) { conds.push(`r.status = $${idx++}`); vals.push(status); }
    // state: 'ALL'/空=不过滤；'__null__'=仅全域(state IS NULL)；其他值=州精确过滤
    if (state && state !== 'ALL') {
      if (state === '__null__') {
        conds.push('r.state IS NULL');
      } else {
        conds.push(`r.state = $${idx++}`);
        vals.push(state);
      }
    }
    const res = await pool.query(
      `SELECT r.rate_id, r.carrier_id, r.dimension, r.line_of_business, r.product_id, r.state,
              r.rate, r.effective_from, r.effective_to, r.status, r.version, r.created_by,
              r.remark, r.deleted, r.created_at, r.updated_at,
              ic.carrier_name,
              p.product_name, p.product_code
         FROM carrier_commission_rate r
         JOIN insurance_carrier ic ON ic.carrier_id = r.carrier_id
         LEFT JOIN insurance_product p ON p.product_id = r.product_id
        WHERE ${conds.join(' AND ')}
        ORDER BY r.carrier_id, r.effective_from DESC, r.version DESC`,
      vals,
    );
    return { data: res.rows, total: res.rowCount };
  }

  /** 同一费率键：保司+维度+险种或产品+州（NULL=全域）。 */
  private rateKey(carrierId: string, dimension: string, lob: string | null, productId: string | null, state: string | null) {
    return `${carrierId}|${dimension}|${dimension === 'product' ? productId ?? '' : lob ?? ''}|${state ?? ''}`;
  }

  private validateRateShape(
    row: { dimension?: string; line_of_business?: string; product_id?: string; state?: string | null; rate?: number; effective_from?: string; effective_to?: string },
    rowNo?: number,
  ): RowError[] {
    const errs: RowError[] = [];
    const at = (field: string, message: string): RowError => ({ row: rowNo ?? 0, field, message });
    if (row.dimension === 'product' && !str(row.product_id)) errs.push(at('product_id', 'Product is required for product dimension'));
    if (row.dimension === 'lob' && !str(row.line_of_business)) errs.push(at('line_of_business', 'Line of business is required for lob dimension'));
    const st = str(row.state);
    if (st && !US_STATES.has(st.toUpperCase())) errs.push(at('state', `Invalid US state: ${st}`));
    if (row.rate === undefined || row.rate === null || Number.isNaN(Number(row.rate))) {
      errs.push(at('rate', 'Rate is required'));
    } else if (Number(row.rate) < 0 || Number(row.rate) > 1) {
      errs.push(at('rate', 'Rate must be between 0 and 1'));
    }
    if (!row.effective_from || !DATE_RE.test(row.effective_from)) errs.push(at('effective_from', 'Effective from must be YYYY-MM-DD'));
    if (str(row.effective_to) && !DATE_RE.test(row.effective_to!)) errs.push(at('effective_to', 'Effective to must be YYYY-MM-DD'));
    if (str(row.effective_to) && row.effective_from && row.effective_to! < row.effective_from) {
      errs.push(at('effective_to', 'Effective to cannot be earlier than effective from'));
    }
    return errs;
  }

  /** 写入一行费率：版本按同键递增；新生效行自动关闭同键旧生效行（effective_to 衔接）。 */
  private async insertRateRow(
    carrierId: string,
    row: {
      dimension: string; line_of_business?: string; product_id?: string;
      state?: string | null; rate: number; effective_from: string; effective_to?: string;
      remark?: string; status?: string;
    },
    operator: AuditOperator,
  ) {
    const lob = str(row.line_of_business);
    const productId = str(row.product_id);
    const state = str(row.state)?.toUpperCase() ?? null;
    const key = this.rateKey(carrierId, row.dimension, lob, productId, state);
    const verRes = await pool.query(
      `SELECT COALESCE(MAX(version), 0)::int AS v FROM carrier_commission_rate
        WHERE carrier_id = $1 AND dimension = $2
          AND COALESCE(line_of_business,'') = COALESCE($3,'')
          AND COALESCE(product_id,'') = COALESCE($4,'')
          AND COALESCE(state,'') = COALESCE($5,'') AND deleted = FALSE`,
      [carrierId, row.dimension, lob, productId, state],
    );
    const version = verRes.rows[0].v + 1;
    const today = new Date().toISOString().slice(0, 10);
    const status = row.status
      || (row.effective_from <= today && (!row.effective_to || row.effective_to >= today) ? 'active' : 'pending');

    const client = await pool.connect();
    let inserted: any;
    try {
      await client.query('BEGIN');
      if (status === 'active') {
        // 同键旧生效/待生效行置失效，生效截止衔接到新生效日前一天
        await client.query(
          `UPDATE carrier_commission_rate
              SET status = 'expired',
                  effective_to = CASE WHEN effective_to IS NULL OR effective_to >= $2
                                      THEN ($2::date - 1) ELSE effective_to END,
                  updated_at = NOW()
            WHERE carrier_id = $1 AND dimension = $3
              AND COALESCE(line_of_business,'') = COALESCE($4,'')
              AND COALESCE(product_id,'') = COALESCE($5,'')
              AND COALESCE(state,'') = COALESCE($6,'')
              AND status IN ('active','pending') AND deleted = FALSE`,
          [carrierId, row.effective_from, row.dimension, lob, productId, state],
        );
      }
      const ins = await client.query(
        `INSERT INTO carrier_commission_rate
           (rate_id, carrier_id, dimension, line_of_business, product_id, state,
            rate, effective_from, effective_to, status, version, created_by, remark)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [
          genId('ccr'), carrierId, row.dimension, lob, productId, state,
          round4(row.rate), row.effective_from, str(row.effective_to),
          status, version, operator.username || 'admin', str(row.remark),
        ],
      );
      inserted = ins.rows[0];
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    return { row: inserted, key };
  }

  async createCommissionRate(dto: CommissionRateUpsertDto, operator: AuditOperator) {
    const carrier = await this.requireCarrier(dto.carrier_id);
    const errs = this.validateRateShape(dto);
    if (errs.length > 0) throw new BadRequestException(errs.map((e) => e.message).join('; '));
    const { row } = await this.insertRateRow(
      dto.carrier_id,
      {
        dimension: dto.dimension, line_of_business: dto.line_of_business, product_id: dto.product_id,
        state: dto.state ?? null, rate: dto.rate, effective_from: dto.effective_from,
        effective_to: dto.effective_to, remark: dto.remark, status: dto.status,
      },
      operator,
    );
    await this.audit.log({
      operator, action: 'COMMISSION_RATE_CREATE', module: 'finance',
      targetType: 'carrier_commission_rate', targetId: row.rate_id, success: true,
      params: {
        carrier_id: dto.carrier_id, carrier_name: carrier.carrier_name,
        dimension: dto.dimension, rate: round4(dto.rate), version: row.version, state: row.state,
      },
    });
    return row;
  }

  async updateCommissionRate(rateId: string, dto: Partial<CommissionRateUpsertDto>, operator: AuditOperator) {
    const fields = ['dimension', 'line_of_business', 'product_id', 'state', 'rate', 'effective_from', 'effective_to', 'status', 'remark'];
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const f of fields) {
      if ((dto as any)[f] !== undefined) {
        if (f === 'rate') { sets.push(`rate = $${idx++}`); vals.push(round4((dto as any)[f])); }
        else if (f === 'state') { sets.push(`state = $${idx++}`); vals.push(str((dto as any)[f])?.toUpperCase() ?? null); }
        else { sets.push(`${f} = $${idx++}`); vals.push((dto as any)[f]); }
      }
    }
    if (sets.length === 0) {
      const cur = await pool.query(
        'SELECT * FROM carrier_commission_rate WHERE rate_id = $1 AND deleted = FALSE', [rateId],
      );
      if (cur.rowCount === 0) throw new NotFoundException(`Commission rate ${rateId} not found`);
      return cur.rows[0];
    }
    sets.push('updated_at = NOW()');
    vals.push(rateId);
    const res = await pool.query(
      `UPDATE carrier_commission_rate SET ${sets.join(', ')}
        WHERE rate_id = $${idx} AND deleted = FALSE RETURNING *`,
      vals,
    );
    if (res.rowCount === 0) throw new NotFoundException(`Commission rate ${rateId} not found`);
    await this.audit.log({
      operator, action: 'COMMISSION_RATE_UPDATE', module: 'finance',
      targetType: 'carrier_commission_rate', targetId: rateId, success: true,
      params: { updated: fields.filter((f) => (dto as any)[f] !== undefined) },
    });
    return res.rows[0];
  }

  /** V1.0.15：佣金率仅可置失效（不物理删除，库内记录保留可审计）。 */
  async deleteCommissionRate(rateId: string, operator: AuditOperator) {
    const res = await pool.query(
      `UPDATE carrier_commission_rate
          SET status = 'expired', effective_to = LEAST(COALESCE(effective_to, CURRENT_DATE), CURRENT_DATE),
              updated_at = NOW()
        WHERE rate_id = $1 AND deleted = FALSE RETURNING rate_id`,
      [rateId],
    );
    if (res.rowCount === 0) throw new NotFoundException(`Commission rate ${rateId} not found`);
    await this.audit.log({
      operator, action: 'COMMISSION_RATE_DEACTIVATE', module: 'finance',
      targetType: 'carrier_commission_rate', targetId: rateId, success: true,
      params: { status: 'expired' },
    });
    return { deactivated: true };
  }

  /** 批量置失效佣金率（软删）。 */
  async batchDeleteCommissionRates(ids: string[], operator: AuditOperator) {
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) throw new BadRequestException('ids must be a non-empty array');
    const res = await pool.query(
      `UPDATE carrier_commission_rate
          SET status = 'expired', effective_to = LEAST(COALESCE(effective_to, CURRENT_DATE), CURRENT_DATE),
              updated_at = NOW()
        WHERE rate_id = ANY($1) AND deleted = FALSE AND status <> 'expired'
       RETURNING rate_id`,
      [unique],
    );
    for (const row of res.rows) {
      await this.audit.log({
        operator, action: 'COMMISSION_RATE_DEACTIVATE', module: 'finance',
        targetType: 'carrier_commission_rate', targetId: row.rate_id, success: true,
        params: { status: 'expired', batch: true },
      });
    }
    return { deactivated: res.rowCount ?? 0, skipped: unique.length - (res.rowCount ?? 0) };
  }

  // ─── 佣金率批量导入（预检 / 确认）────────────────────────────────────

  /** 库内同键同生效日集合（批量导入去重用）。 */
  private async existingRateKeys(carrierId: string): Promise<Set<string>> {
    const res = await pool.query(
      `SELECT dimension, COALESCE(line_of_business,'') AS lob,
              COALESCE(product_id,'') AS pid, COALESCE(state,'') AS st, effective_from
         FROM carrier_commission_rate
        WHERE carrier_id = $1 AND deleted = FALSE`,
      [carrierId],
    );
    return new Set(
      res.rows.map((r) =>
        `${carrierId}|${r.dimension}|${r.dimension === 'product' ? r.pid : r.lob}|${r.st}|${String(r.effective_from).slice(0, 10)}`),
    );
  }

  async precheckCommissionRates(dto: CommissionRateImportDto) {
    await this.requireCarrier(dto.carrier_id);
    const errors: RowError[] = [];
    const seenKeys = new Set<string>();
    const duplicates: Array<{ row: number; key: string; reason: string }> = [];
    const inFileDupRows = new Set<number>();

    dto.rows.forEach((r, i) => {
      const rowNo = i + 1;
      const rowErrs = this.validateRateShape(r, rowNo);
      errors.push(...rowErrs);
      if (rowErrs.length === 0) {
        const key = `${this.rateKey(
          dto.carrier_id, r.dimension, str(r.line_of_business), str(r.product_id), str(r.state)?.toUpperCase() ?? null,
        )}|${r.effective_from}`;
        if (seenKeys.has(key)) {
          duplicates.push({ row: rowNo, key, reason: 'duplicate-in-file' });
          inFileDupRows.add(rowNo);
        } else {
          seenKeys.add(key);
        }
      }
    });

    const dbKeys = await this.existingRateKeys(dto.carrier_id);
    let validCount = 0;
    dto.rows.forEach((r, i) => {
      const rowNo = i + 1;
      const rowErrs = this.validateRateShape(r, rowNo);
      if (rowErrs.length > 0 || inFileDupRows.has(rowNo)) return;
      const key = `${this.rateKey(
        dto.carrier_id, r.dimension, str(r.line_of_business), str(r.product_id), str(r.state)?.toUpperCase() ?? null,
      )}|${r.effective_from}`;
      if (dbKeys.has(key)) {
        duplicates.push({ row: rowNo, key, reason: 'already-exists' });
        return;
      }
      validCount += 1;
    });

    return {
      carrier_id: dto.carrier_id,
      total: dto.rows.length,
      valid_count: validCount,
      error_count: new Set(errors.map((e) => e.row)).size,
      duplicate_count: duplicates.length,
      errors,
      duplicates,
    };
  }

  async importCommissionRates(dto: CommissionRateImportDto, operator: AuditOperator) {
    await this.requireCarrier(dto.carrier_id);
    const dbKeys = await this.existingRateKeys(dto.carrier_id);
    let inserted = 0;
    const failed: Array<{ row: number; message: string }> = [];
    const seenKeys = new Set<string>();
    for (let i = 0; i < dto.rows.length; i += 1) {
      const r = dto.rows[i];
      const rowNo = i + 1;
      const errs = this.validateRateShape(r, rowNo);
      if (errs.length > 0) {
        failed.push({ row: rowNo, message: errs.map((e) => e.message).join('; ') });
        continue;
      }
      const key = `${this.rateKey(
        dto.carrier_id, r.dimension, str(r.line_of_business), str(r.product_id), str(r.state)?.toUpperCase() ?? null,
      )}|${r.effective_from}`;
      if (seenKeys.has(key)) {
        failed.push({ row: rowNo, message: 'duplicate in import file' });
        continue;
      }
      if (dbKeys.has(key)) {
        failed.push({ row: rowNo, message: 'rate already exists for this key and effective date' });
        continue;
      }
      seenKeys.add(key);
      try {
        const { row } = await this.insertRateRow(
          dto.carrier_id,
          {
            dimension: r.dimension, line_of_business: r.line_of_business, product_id: r.product_id,
            state: r.state ?? null, rate: r.rate, effective_from: r.effective_from,
            effective_to: r.effective_to, remark: r.remark,
          },
          operator,
        );
        if (row.rate_id) {
          inserted += 1;
          dbKeys.add(key);
        }
      } catch (e: any) {
        failed.push({ row: rowNo, message: String(e?.message || e) });
      }
    }
    await this.audit.log({
      operator, action: 'COMMISSION_RATE_IMPORT', module: 'finance',
      targetType: 'carrier_commission_rate', targetId: dto.carrier_id, success: true,
      params: { total: dto.rows.length, inserted, failed: failed.length },
    });
    return { total: dto.rows.length, inserted, failed_count: failed.length, failed };
  }

  // ─── 佣金率试算预览 / 版本对比 ───────────────────────────────────────

  async trialCommissionRate(dto: CommissionRateTrialDto) {
    await this.requireCarrier(dto.carrier_id);
    const onDate = str(dto.on_date) || new Date().toISOString().slice(0, 10);
    const hit = await this.getEffectiveRate(
      dto.carrier_id, 'product', str(dto.line_of_business) ?? undefined,
      str(dto.product_id) ?? undefined, onDate, str(dto.state) ?? undefined,
    );
    if (!hit) {
      return {
        matched: false, level: 'bill_original', rate: null, amount: null,
        message: 'No configured rate matched; bill original commission will be used',
      };
    }
    const level = hit.dimension === 'product'
      ? (hit.state ? 'product_state' : 'product_all')
      : (hit.state ? 'lob_state' : 'lob_all');
    const rate = round4(hit.rate);
    return {
      matched: true, level, rate, amount: round2(n2(dto.premium) * rate),
      rate_id: hit.rate_id, version: hit.version, effective_from: hit.effective_from,
    };
  }

  /** 版本号清单（按保司聚合：每个费率键的最新版本）。 */
  async getRateVersions(carrierId?: string) {
    const conds = ['deleted = FALSE'];
    const vals: any[] = [];
    if (carrierId) { conds.push('carrier_id = $1'); vals.push(carrierId); }
    const res = await pool.query(
      `SELECT carrier_id,
              dimension, COALESCE(line_of_business,'') AS line_of_business,
              COALESCE(product_id,'') AS product_id, COALESCE(state,'') AS state,
              MAX(version)::int AS latest_version,
              COUNT(*)::int AS versions_count
         FROM carrier_commission_rate
        WHERE ${conds.join(' AND ')}
        GROUP BY carrier_id, dimension, line_of_business, product_id, state
        ORDER BY carrier_id, dimension`,
      vals,
    );
    const maxVer = await pool.query(
      `SELECT COALESCE(MAX(version),1)::int AS max_version
         FROM carrier_commission_rate WHERE ${conds.join(' AND ')}`,
      vals,
    );
    return { data: res.rows, latest: maxVer.rows[0].max_version };
  }

  /** 两个版本对比：逐键返回 v1/v2 费率行。 */
  async getRateVersionDiff(query: any) {
    const carrierId = query.carrier_id;
    const v1 = parseInt(query.v1, 10);
    const v2 = parseInt(query.v2, 10);
    if (!carrierId || !v1 || !v2) throw new BadRequestException('carrier_id, v1, v2 are required');
    const res = await pool.query(
      `SELECT dimension, COALESCE(line_of_business,'') AS line_of_business,
              COALESCE(product_id,'') AS product_id, COALESCE(state,'') AS state,
              MAX(CASE WHEN version = $2 THEN rate::float8 END) AS rate_v1,
              MAX(CASE WHEN version = $3 THEN rate::float8 END) AS rate_v2,
              MAX(CASE WHEN version = $2 THEN effective_from END) AS from_v1,
              MAX(CASE WHEN version = $3 THEN effective_from END) AS from_v2,
              MAX(CASE WHEN version = $2 THEN status END) AS status_v1,
              MAX(CASE WHEN version = $3 THEN status END) AS status_v2
         FROM carrier_commission_rate
        WHERE carrier_id = $1 AND version IN ($2,$3) AND deleted = FALSE
        GROUP BY dimension, line_of_business, product_id, state
        ORDER BY dimension, product_id, line_of_business, state`,
      [carrierId, v1, v2],
    );
    return { v1, v2, data: res.rows };
  }

  async getEffectiveRate(
    carrierId: string,
    dimension: string,
    lob?: string,
    productId?: string,
    asOfDate?: string,
    state?: string,
  ) {
    const asOf = str(asOfDate) || new Date().toISOString().slice(0, 10);
    const st = str(state);
    const conds = [
      'carrier_id = $1',
      "status = 'active'",
      'deleted = FALSE',
      'effective_from <= $2',
      '(effective_to IS NULL OR effective_to >= $2)',
    ];
    // 四级回退：产品+州 → 产品+全域 → 险种+州 → 险种+全域
    const dimConds: string[] = [];
    const vals: any[] = [carrierId, asOf];
    let idx = 3;
    if (productId) {
      if (st) {
        dimConds.push(`(dimension = 'product' AND product_id = $${idx} AND state = $${idx + 1})`);
        vals.push(productId, st);
        idx += 2;
      }
      dimConds.push(`(dimension = 'product' AND product_id = $${idx++} AND state IS NULL)`);
      vals.push(productId);
    }
    if (lob) {
      if (st) {
        dimConds.push(`(dimension = 'lob' AND line_of_business = $${idx} AND state = $${idx + 1})`);
        vals.push(lob, st);
        idx += 2;
      }
      dimConds.push(`(dimension = 'lob' AND line_of_business = $${idx++} AND state IS NULL)`);
      vals.push(lob);
    }
    if (dimConds.length === 0) return null;
    conds.push(`(${dimConds.join(' OR ')})`);
    const res = await pool.query(
      `SELECT * FROM carrier_commission_rate
        WHERE ${conds.join(' AND ')}
        ORDER BY CASE
                   WHEN dimension = 'product' AND state IS NOT NULL THEN 0
                   WHEN dimension = 'product' THEN 1
                   WHEN dimension = 'lob' AND state IS NOT NULL THEN 2
                   ELSE 3
                 END,
                 effective_from DESC
        LIMIT 1`,
      vals,
    );
    return res.rows[0] || null;
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private policyKey(policy: string) {
    return String(policy || '').trim().toUpperCase();
  }

  private async requireCarrier(insurerId: string) {
    // 历史保司可能已软删除，但存量账单/配置仍引用，导入与对账允许其参与。
    const res = await pool.query(
      `SELECT carrier_id, carrier_name, carrier_name_short
         FROM insurance_carrier WHERE carrier_id = $1`,
      [insurerId],
    );
    if (res.rowCount === 0) throw new BadRequestException(`Unknown insurer: ${insurerId}`);
    return res.rows[0];
  }

  private async requireTemplate(id: string) {
    const res = await pool.query(
      'SELECT * FROM bill_field_mapping_template WHERE template_id = $1 AND deleted = FALSE', [id],
    );
    if (res.rowCount === 0) throw new BadRequestException(`Unknown mapping template: ${id}`);
    return res.rows[0];
  }
}

/** 费率 numeric(8,4)。 */
function round4(n: unknown): number {
  const v = n === undefined || n === null || n === '' ? 0 : parseFloat(String(n)) || 0;
  return Math.round((v + Number.EPSILON) * 10000) / 10000;
}

function effOrNull(v?: string): string | null {
  const s = str(v);
  return s && DATE_RE.test(s) ? s : null;
}
