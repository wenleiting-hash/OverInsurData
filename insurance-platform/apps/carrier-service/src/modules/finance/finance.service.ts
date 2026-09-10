import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  // ─── Stats ─────────────────────────────────────────────────────────

  async getStats() {
    const [billRes, diffRes, sccRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'pending-parse') AS pending, COUNT(*) FILTER (WHERE status = 'exception') AS exceptions, COALESCE(SUM(total_commission), 0) AS total_commission, COALESCE(SUM(reconciled_amount), 0) AS reconciled FROM commission_bill WHERE deleted = FALSE`),
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'open') AS open_diffs FROM reconciliation_diff WHERE deleted = FALSE`),
      pool.query(`SELECT COALESCE(SUM(ytd_settled), 0) AS ytd_settled FROM settlement_cycle_config WHERE deleted = FALSE`),
    ]);
    const b = billRes.rows[0];
    const d = diffRes.rows[0];
    const s = sccRes.rows[0];
    return {
      total_bills: parseInt(b.total, 10),
      pending_parse: parseInt(b.pending, 10),
      exceptions: parseInt(b.exceptions, 10),
      total_commission: parseFloat(b.total_commission),
      reconciled_amount: parseFloat(b.reconciled),
      open_diffs: parseInt(d.open_diffs, 10),
      total_diffs: parseInt(d.total, 10),
      ytd_settled: parseFloat(s.ytd_settled),
    };
  }

  // ─── Bills ─────────────────────────────────────────────────────────

  async getBills(query: { status?: string; search?: string; page?: number; size?: number }) {
    const { status, search, page = 1, size = 20 } = query;
    const conditions = ['deleted = FALSE'];
    const values: any[] = [];
    let idx = 1;
    if (status && status !== 'all') { conditions.push(`status = $${idx}`); values.push(status); idx++; }
    if (search) { conditions.push(`(file_name ILIKE $${idx} OR insurer_name ILIKE $${idx} OR period ILIKE $${idx})`); values.push(`%${search}%`); idx++; }
    const offset = (page - 1) * size;
    values.push(size, offset);
    const sql = `SELECT * FROM commission_bill WHERE ${conditions.join(' AND ')} ORDER BY import_date DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    const countSql = `SELECT COUNT(*) FROM commission_bill WHERE ${conditions.join(' AND ')}`;
    const [dataRes, countRes] = await Promise.all([pool.query(sql, values), pool.query(countSql, values.slice(0, idx - 1))]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  async uploadBill(dto: any) {
    const id = 'cb' + Date.now().toString(36);
    const cols = ['bill_id', 'file_name', 'insurer_id', 'insurer_name', 'insurer_short', 'period', 'imported_by', 'file_size', 'file_format', 'status', 'total_policies', 'total_premium', 'total_commission'];
    const vals = [id, dto.file_name, dto.insurer_id, dto.insurer_name, dto.insurer_short, dto.period, dto.imported_by || 'System Auto', dto.file_size, dto.file_format || 'CSV', 'pending-parse', dto.total_policies || 0, dto.total_premium || 0, dto.total_commission || 0];
    const ph = vals.map((_, i) => `$${i + 1}`);
    const sql = `INSERT INTO commission_bill (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`;
    const res = await pool.query(sql, vals);
    return res.rows[0];
  }

  async getBillDetail(id: string) {
    const res = await pool.query('SELECT * FROM commission_bill WHERE bill_id = $1 AND deleted = FALSE', [id]);
    if (res.rows.length === 0) throw new NotFoundException(`Bill ${id} not found`);
    return res.rows[0];
  }

  async parseBill(id: string) {
    const res = await pool.query(
      `UPDATE commission_bill SET status = 'parsed', parsed_policies = total_policies, updated_at = NOW() WHERE bill_id = $1 AND deleted = FALSE RETURNING *`, [id],
    );
    if (res.rows.length === 0) throw new NotFoundException(`Bill ${id} not found`);
    return res.rows[0];
  }

  async getBillLines(billId: string, query: { page?: number; size?: number }) {
    const { page = 1, size = 50 } = query;
    const offset = (page - 1) * size;
    const sql = `SELECT * FROM commission_bill_line WHERE bill_id = $1 AND deleted = FALSE ORDER BY line_number ASC LIMIT $2 OFFSET $3`;
    const countSql = `SELECT COUNT(*) FROM commission_bill_line WHERE bill_id = $1 AND deleted = FALSE`;
    const [dataRes, countRes] = await Promise.all([pool.query(sql, [billId, size, offset]), pool.query(countSql, [billId])]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  // ─── Reconciliation ────────────────────────────────────────────────

  async getReconciliation(query: { period?: string; insurer_id?: string }) {
    const { period, insurer_id } = query;
    const conditions = ['d.deleted = FALSE'];
    const values: any[] = [];
    let idx = 1;
    if (period) { conditions.push(`b.period = $${idx}`); values.push(period); idx++; }
    if (insurer_id) { conditions.push(`d.insurer_id = $${idx}`); values.push(insurer_id); idx++; }
    const sql = `SELECT d.*, b.period, b.file_name AS bill_name FROM reconciliation_diff d LEFT JOIN commission_bill b ON d.bill_id = b.bill_id WHERE ${conditions.join(' AND ')} ORDER BY d.created_at DESC`;
    const res = await pool.query(sql, values);
    return { data: res.rows, total: res.rows.length };
  }

  async batchReconcile(dto: any) {
    const billIds = dto.bill_ids || [];
    let reconciled = 0;
    for (const billId of billIds) {
      await pool.query(
        `UPDATE commission_bill SET status = 'reconciled', reconciled_amount = total_commission - COALESCE(difference_amount, 0), matched_policies = parsed_policies - exception_count, updated_at = NOW() WHERE bill_id = $1 AND deleted = FALSE`, [billId],
      );
      reconciled++;
    }
    return { reconciled };
  }

  // ─── Diffs ─────────────────────────────────────────────────────────

  async getDiffs(query: { status?: string; page?: number; size?: number }) {
    const { status, page = 1, size = 20 } = query;
    const conditions = ['deleted = FALSE'];
    const values: any[] = [];
    let idx = 1;
    if (status && status !== 'all') { conditions.push(`status = $${idx}`); values.push(status); idx++; }
    const offset = (page - 1) * size;
    values.push(size, offset);
    const sql = `SELECT * FROM reconciliation_diff WHERE ${conditions.join(' AND ')} ORDER BY created_date DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    const countSql = `SELECT COUNT(*) FROM reconciliation_diff WHERE ${conditions.join(' AND ')}`;
    const [dataRes, countRes] = await Promise.all([pool.query(sql, values), pool.query(countSql, values.slice(0, idx - 1))]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  async updateDiff(id: string, dto: any) {
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    const fields = ['status', 'note', 'note_en', 'assigned_to', 'resolved_date'];
    for (const key of fields) {
      if (dto[key] !== undefined) { sets.push(`${key} = $${idx++}`); vals.push(dto[key]); }
    }
    if (sets.length === 0) return this.getDiffById(id);
    sets.push('updated_at = NOW()');
    vals.push(id);
    const sql = `UPDATE reconciliation_diff SET ${sets.join(', ')} WHERE diff_id = $${idx} AND deleted = FALSE RETURNING *`;
    const res = await pool.query(sql, vals);
    if (res.rows.length === 0) throw new NotFoundException(`Diff ${id} not found`);
    return res.rows[0];
  }

  async getDiffById(id: string) {
    const res = await pool.query('SELECT * FROM reconciliation_diff WHERE diff_id = $1 AND deleted = FALSE', [id]);
    if (res.rows.length === 0) throw new NotFoundException(`Diff ${id} not found`);
    return res.rows[0];
  }

  async handleDiffAction(id: string, dto: any) {
    const action = dto.action; // review / dispute / accept / adjust / waive
    const statusMap: Record<string, string> = { review: 'under-review', dispute: 'disputed', accept: 'accepted', adjust: 'adjusted', waive: 'waived' };
    const newStatus = statusMap[action] || 'under-review';
    const res = await pool.query(
      `UPDATE reconciliation_diff SET status = $1, note = COALESCE($2, note), resolved_date = CASE WHEN $1 IN ('accepted','adjusted','waived') THEN CURRENT_DATE ELSE resolved_date END, updated_at = NOW() WHERE diff_id = $3 AND deleted = FALSE RETURNING *`,
      [newStatus, dto.note, id],
    );
    if (res.rows.length === 0) throw new NotFoundException(`Diff ${id} not found`);
    return res.rows[0];
  }

  // ─── Settlement Configs ────────────────────────────────────────────

  async getSettlementConfigs(query: { page?: number; size?: number }) {
    const { page = 1, size = 50 } = query;
    const offset = (page - 1) * size;
    const sql = `SELECT * FROM settlement_cycle_config WHERE deleted = FALSE ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
    const countSql = `SELECT COUNT(*) FROM settlement_cycle_config WHERE deleted = FALSE`;
    const [dataRes, countRes] = await Promise.all([pool.query(sql, [size, offset]), pool.query(countSql)]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  async createSettlementConfig(dto: any) {
    const id = 'sc' + Date.now().toString(36);
    const cols = ['config_id', 'insurer_id', 'insurer_name', 'insurer_short', 'frequency', 'cutoff_day', 'payment_due_days', 'method', 'currency', 'min_settle_amount', 'auto_reconcile', 'auto_settle', 'notify_days_before', 'bank_account', 'routing_number', 'contact_email', 'next_due_date', 'ytd_settled'];
    const vals = [id, dto.insurer_id, dto.insurer_name, dto.insurer_short, dto.frequency || 'monthly', dto.cutoff_day || 25, dto.payment_due_days || 30, dto.method || 'ach', dto.currency || 'USD', dto.min_settle_amount || 0, dto.auto_reconcile ?? false, dto.auto_settle ?? false, dto.notify_days_before || 7, dto.bank_account, dto.routing_number, dto.contact_email, dto.next_due_date, dto.ytd_settled || 0];
    const ph = vals.map((_, i) => `$${i + 1}`);
    const sql = `INSERT INTO settlement_cycle_config (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`;
    const res = await pool.query(sql, vals);
    return res.rows[0];
  }

  async updateSettlementConfig(id: string, dto: any) {
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    const fields = ['frequency', 'cutoff_day', 'payment_due_days', 'method', 'currency', 'min_settle_amount', 'auto_reconcile', 'auto_settle', 'notify_days_before', 'bank_account', 'routing_number', 'contact_email', 'next_due_date', 'next_due_amount', 'last_settled_date', 'ytd_settled'];
    for (const key of fields) {
      if (dto[key] !== undefined) { sets.push(`${key} = $${idx++}`); vals.push(dto[key]); }
    }
    if (sets.length === 0) return this.getSettlementConfigById(id);
    sets.push('updated_at = NOW()');
    vals.push(id);
    const sql = `UPDATE settlement_cycle_config SET ${sets.join(', ')} WHERE config_id = $${idx} AND deleted = FALSE RETURNING *`;
    const res = await pool.query(sql, vals);
    if (res.rows.length === 0) throw new NotFoundException(`Settlement config ${id} not found`);
    return res.rows[0];
  }

  async getSettlementConfigById(id: string) {
    const res = await pool.query('SELECT * FROM settlement_cycle_config WHERE config_id = $1 AND deleted = FALSE', [id]);
    if (res.rows.length === 0) throw new NotFoundException(`Settlement config ${id} not found`);
    return res.rows[0];
  }

  async deleteSettlementConfig(id: string) {
    const res = await pool.query('UPDATE settlement_cycle_config SET deleted = TRUE, updated_at = NOW() WHERE config_id = $1 RETURNING config_id', [id]);
    if (res.rows.length === 0) throw new NotFoundException(`Settlement config ${id} not found`);
    return { deleted: true };
  }

  // ─── Settlement History ────────────────────────────────────────────

  async getSettlementHistory(query: { insurer_id?: string; page?: number; size?: number }) {
    const { insurer_id, page = 1, size = 20 } = query;
    // Settlement history is derived from commission_bill where status = 'settled'
    const conditions = ['deleted = FALSE', "status = 'settled'"];
    const values: any[] = [];
    let idx = 1;
    if (insurer_id) { conditions.push(`insurer_id = $${idx}`); values.push(insurer_id); idx++; }
    const offset = (page - 1) * size;
    values.push(size, offset);
    const sql = `SELECT bill_id AS id, insurer_id, insurer_short, period, settled_date, reconciled_amount AS amount, 'wire-transfer' AS method, '' AS reference_number, 'completed' AS status, imported_by AS confirmed_by FROM commission_bill WHERE ${conditions.join(' AND ')} ORDER BY settled_date DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    const countSql = `SELECT COUNT(*) FROM commission_bill WHERE ${conditions.join(' AND ')}`;
    const [dataRes, countRes] = await Promise.all([pool.query(sql, values), pool.query(countSql, values.slice(0, idx - 1))]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  // ─── Premium Reconciliation ────────────────────────────────────────

  async getPremiumReconciliation(query: { period?: string; insurer_id?: string }) {
    const { period, insurer_id } = query;
    // Aggregated from commission_bill grouped by insurer
    const conditions = ['deleted = FALSE'];
    const values: any[] = [];
    let idx = 1;
    if (period) { conditions.push(`period = $${idx}`); values.push(period); idx++; }
    if (insurer_id) { conditions.push(`insurer_id = $${idx}`); values.push(insurer_id); idx++; }
    const sql = `SELECT insurer_id, insurer_short, period, COUNT(*) AS total_policies, SUM(total_premium) AS total_expected, SUM(reconciled_amount) AS total_remitted, SUM(difference_amount) AS total_diff, CASE WHEN SUM(parsed_policies) > 0 THEN ROUND(CAST(SUM(matched_policies) AS NUMERIC) / GREATEST(SUM(parsed_policies), 1), 3) ELSE 0 END AS match_rate, SUM(exception_count) AS exception_count FROM commission_bill WHERE ${conditions.join(' AND ')} GROUP BY insurer_id, insurer_short, period ORDER BY period DESC`;
    const res = await pool.query(sql, values);
    return { data: res.rows, total: res.rows.length };
  }

  async getPremiumRecords(query: { period?: string; insurer_id?: string; page?: number; size?: number }) {
    const { period, insurer_id, page = 1, size = 20 } = query;
    const conditions = ['l.deleted = FALSE'];
    const values: any[] = [];
    let idx = 1;
    if (period) { conditions.push(`b.period = $${idx}`); values.push(period); idx++; }
    if (insurer_id) { conditions.push(`b.insurer_id = $${idx}`); values.push(insurer_id); idx++; }
    const offset = (page - 1) * size;
    values.push(size, offset);
    const sql = `SELECT l.*, b.period, b.insurer_id, b.insurer_short FROM commission_bill_line l JOIN commission_bill b ON l.bill_id = b.bill_id WHERE ${conditions.join(' AND ')} ORDER BY l.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    const countSql = `SELECT COUNT(*) FROM commission_bill_line l JOIN commission_bill b ON l.bill_id = b.bill_id WHERE ${conditions.join(' AND ')}`;
    const [dataRes, countRes] = await Promise.all([pool.query(sql, values), pool.query(countSql, values.slice(0, idx - 1))]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }
}
