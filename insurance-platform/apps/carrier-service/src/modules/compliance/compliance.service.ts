import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  // ─── Dashboard ─────────────────────────────────────────────────────

  async getDashboard() {
    const [rulesRes, ofacRes, interRes, licenseRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE enabled = TRUE) AS enabled_count FROM compliance_rule WHERE deleted = FALSE`),
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE result = 'blocked') AS blocked, COUNT(*) FILTER (WHERE result = 'watchlist') AS watchlist, COUNT(*) FILTER (WHERE result = 'clear') AS cleared FROM ofac_screening_record WHERE deleted = FALSE`),
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE result = 'blocked') AS blocked, COUNT(*) FILTER (WHERE severity = 'critical') AS critical FROM compliance_interception WHERE deleted = FALSE`),
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'expired') AS expired, COUNT(*) FILTER (WHERE status = 'active') AS active FROM nipr_license WHERE deleted = FALSE`),
    ]);
    const rules = rulesRes.rows[0];
    const ofac = ofacRes.rows[0];
    const inter = interRes.rows[0];
    const lic = licenseRes.rows[0];
    const totalRules = parseInt(rules.total, 10);
    const enabledRules = parseInt(rules.enabled_count, 10);
    const totalOfac = parseInt(ofac.total, 10);
    const clearedOfac = parseInt(ofac.cleared, 10);
    return {
      stats: {
        complaint_count: parseInt(inter.total, 10),
        resolution_rate: totalOfac > 0 ? Math.round((clearedOfac / totalOfac) * 100) : 100,
        risk_score: Math.max(0, 100 - (parseInt(inter.critical, 10) * 15)),
        compliance_rate: totalRules > 0 ? Math.round((enabledRules / totalRules) * 100) : 100,
      },
      recent_alerts: [],
      ofac_summary: { total: totalOfac, blocked: parseInt(ofac.blocked, 10), watchlist: parseInt(ofac.watchlist, 10), cleared: clearedOfac },
      license_summary: { total: parseInt(lic.total, 10), active: parseInt(lic.active, 10), expired: parseInt(lic.expired, 10) },
    };
  }

  // ─── Rules CRUD ────────────────────────────────────────────────────

  async getRules(query: { category?: string; page?: number; size?: number }) {
    const { category, page = 1, size = 50 } = query;
    const conditions = ['deleted = FALSE'];
    const values: any[] = [];
    let idx = 1;
    if (category && category !== 'all') { conditions.push(`category = $${idx}`); values.push(category); idx++; }
    const offset = (page - 1) * size;
    values.push(size, offset);
    const sql = `SELECT * FROM compliance_rule WHERE ${conditions.join(' AND ')} ORDER BY priority ASC, created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    const countSql = `SELECT COUNT(*) FROM compliance_rule WHERE ${conditions.join(' AND ')}`;
    const [dataRes, countRes] = await Promise.all([pool.query(sql, values), pool.query(countSql, values.slice(0, idx - 1))]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  async createRule(dto: any) {
    const id = 'cr' + Date.now().toString(36);
    const cols = ['rule_id', 'rule_name', 'rule_name_en', 'category', 'condition_expr', 'condition_expr_en', 'action', 'priority', 'enabled'];
    const vals = [id, dto.rule_name, dto.rule_name_en, dto.category || 'appointment', dto.condition_expr, dto.condition_expr_en, dto.action || 'warn', dto.priority ?? 50, dto.enabled ?? true];
    const ph = vals.map((_, i) => `$${i + 1}`);
    const sql = `INSERT INTO compliance_rule (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`;
    const res = await pool.query(sql, vals);
    return res.rows[0];
  }

  async updateRule(id: string, dto: any) {
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    const fields = ['rule_name', 'rule_name_en', 'category', 'condition_expr', 'condition_expr_en', 'action', 'priority', 'enabled'];
    for (const key of fields) {
      if (dto[key] !== undefined) { sets.push(`${key} = $${idx++}`); vals.push(dto[key]); }
    }
    if (sets.length === 0) return this.getRuleById(id);
    sets.push('updated_at = NOW()');
    vals.push(id);
    const sql = `UPDATE compliance_rule SET ${sets.join(', ')} WHERE rule_id = $${idx} AND deleted = FALSE RETURNING *`;
    const res = await pool.query(sql, vals);
    if (res.rows.length === 0) throw new NotFoundException(`Rule ${id} not found`);
    return res.rows[0];
  }

  async getRuleById(id: string) {
    const res = await pool.query('SELECT * FROM compliance_rule WHERE rule_id = $1 AND deleted = FALSE', [id]);
    if (res.rows.length === 0) throw new NotFoundException(`Rule ${id} not found`);
    return res.rows[0];
  }

  async deleteRule(id: string) {
    const res = await pool.query('UPDATE compliance_rule SET deleted = TRUE, updated_at = NOW() WHERE rule_id = $1 RETURNING rule_id', [id]);
    if (res.rows.length === 0) throw new NotFoundException(`Rule ${id} not found`);
    return { deleted: true };
  }

  async toggleRule(id: string) {
    const res = await pool.query(
      `UPDATE compliance_rule SET enabled = NOT enabled, updated_at = NOW() WHERE rule_id = $1 AND deleted = FALSE RETURNING *`, [id],
    );
    if (res.rows.length === 0) throw new NotFoundException(`Rule ${id} not found`);
    return res.rows[0];
  }

  // ─── OFAC Screening ────────────────────────────────────────────────

  async getOFACList(query: { status?: string; page?: number; size?: number }) {
    const { status, page = 1, size = 20 } = query;
    const conditions = ['deleted = FALSE'];
    const values: any[] = [];
    let idx = 1;
    if (status && status !== 'all') { conditions.push(`result = $${idx}`); values.push(status); idx++; }
    const offset = (page - 1) * size;
    values.push(size, offset);
    const sql = `SELECT * FROM ofac_screening_record WHERE ${conditions.join(' AND ')} ORDER BY timestamp DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    const countSql = `SELECT COUNT(*) FROM ofac_screening_record WHERE ${conditions.join(' AND ')}`;
    const [dataRes, countRes] = await Promise.all([pool.query(sql, values), pool.query(countSql, values.slice(0, idx - 1))]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  async screenOFAC(dto: any) {
    const id = 'of' + Date.now().toString(36);
    const cols = ['screening_id', 'entity_name', 'entity_type', 'country', 'date_of_birth', 'identification_number', 'address', 'screened_by', 'result'];
    const vals = [id, dto.entity_name, dto.entity_type, dto.country, dto.date_of_birth, dto.identification_number, dto.address, dto.screened_by || 'System Auto', dto.result || 'pending'];
    const ph = vals.map((_, i) => `$${i + 1}`);
    const sql = `INSERT INTO ofac_screening_record (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`;
    const res = await pool.query(sql, vals);
    return res.rows[0];
  }

  async reviewOFAC(id: string, dto: any) {
    const sets = ['reviewed_by = $1', 'review_note = $2', 'result = $3', 'override_approved = $4', 'review_date = NOW()', 'updated_at = NOW()'];
    const vals = [dto.reviewed_by, dto.review_note, dto.result, dto.override_approved ?? false, id];
    const sql = `UPDATE ofac_screening_record SET ${sets.join(', ')} WHERE screening_id = $5 AND deleted = FALSE RETURNING *`;
    const res = await pool.query(sql, vals);
    if (res.rows.length === 0) throw new NotFoundException(`OFAC record ${id} not found`);
    return res.rows[0];
  }

  // ─── Interceptions ─────────────────────────────────────────────────

  async getInterceptions(query: { result?: string; severity?: string; page?: number; size?: number }) {
    const { result, severity, page = 1, size = 20 } = query;
    const conditions = ['deleted = FALSE'];
    const values: any[] = [];
    let idx = 1;
    if (result && result !== 'all') { conditions.push(`result = $${idx}`); values.push(result); idx++; }
    if (severity && severity !== 'all') { conditions.push(`severity = $${idx}`); values.push(severity); idx++; }
    const offset = (page - 1) * size;
    values.push(size, offset);
    const sql = `SELECT * FROM compliance_interception WHERE ${conditions.join(' AND ')} ORDER BY timestamp DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    const countSql = `SELECT COUNT(*) FROM compliance_interception WHERE ${conditions.join(' AND ')}`;
    const [dataRes, countRes] = await Promise.all([pool.query(sql, values), pool.query(countSql, values.slice(0, idx - 1))]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  async resolveInterception(id: string, dto: any) {
    const sets = ['resolved_status = $1', 'resolved_at = NOW()', 'reviewed_by = $2', 'override_note = $3', 'updated_at = NOW()'];
    const vals = [dto.resolved_status, dto.reviewed_by, dto.override_note, id];
    const sql = `UPDATE compliance_interception SET ${sets.join(', ')} WHERE interception_id = $4 AND deleted = FALSE RETURNING *`;
    const res = await pool.query(sql, vals);
    if (res.rows.length === 0) throw new NotFoundException(`Interception ${id} not found`);
    return res.rows[0];
  }

  // ─── Licenses ──────────────────────────────────────────────────────

  async getLicenses(query: { state?: string; status?: string; page?: number; size?: number }) {
    const { state, status, page = 1, size = 20 } = query;
    const conditions = ['deleted = FALSE'];
    const values: any[] = [];
    let idx = 1;
    if (state && state !== 'all') { conditions.push(`state = $${idx}`); values.push(state); idx++; }
    if (status && status !== 'all') { conditions.push(`status = $${idx}`); values.push(status); idx++; }
    const offset = (page - 1) * size;
    values.push(size, offset);
    const sql = `SELECT * FROM nipr_license WHERE ${conditions.join(' AND ')} ORDER BY expiry_date ASC LIMIT $${idx} OFFSET $${idx + 1}`;
    const countSql = `SELECT COUNT(*) FROM nipr_license WHERE ${conditions.join(' AND ')}`;
    const [dataRes, countRes] = await Promise.all([pool.query(sql, values), pool.query(countSql, values.slice(0, idx - 1))]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  async verifyLicenses(dto: any) {
    // Record verification request — actual NIPR API integration deferred to V1.10
    const ids = dto.license_ids || [];
    const results: any[] = [];
    for (const licId of ids) {
      const res = await pool.query(
        `UPDATE nipr_license SET verification_status = 'pending', last_verified_at = NOW(), updated_at = NOW() WHERE license_id = $1 AND deleted = FALSE RETURNING *`,
        [licId],
      );
      if (res.rows.length > 0) results.push(res.rows[0]);
    }
    return { verified: results.length, results };
  }

  // ─── License Reminders ────────────────────────────────────────────

  async getLicenseReminders(query: { status?: string; page?: number; size?: number }) {
    const { status, page = 1, size = 20 } = query;
    const conditions = ['r.deleted = FALSE'];
    const values: any[] = [];
    let idx = 1;
    if (status && status !== 'all') { conditions.push(`r.status = $${idx}`); values.push(status); idx++; }
    const offset = (page - 1) * size;
    values.push(size, offset);
    const sql = `SELECT r.*, l.license_number, l.state, l.expiry_date, l.license_type FROM license_expiry_reminder r LEFT JOIN nipr_license l ON r.license_id = l.license_id WHERE ${conditions.join(' AND ')} ORDER BY r.notify_at ASC LIMIT $${idx} OFFSET $${idx + 1}`;
    const countSql = `SELECT COUNT(*) FROM license_expiry_reminder r WHERE ${conditions.join(' AND ')}`;
    const [dataRes, countRes] = await Promise.all([pool.query(sql, values), pool.query(countSql, values.slice(0, idx - 1))]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  // ─── Reports ───────────────────────────────────────────────────────

  async getReports(query: { category?: string; page?: number; size?: number }) {
    const { category, page = 1, size = 20 } = query;
    const conditions = ['deleted = FALSE'];
    const values: any[] = [];
    let idx = 1;
    if (category && category !== 'all') { conditions.push(`category = $${idx}`); values.push(category); idx++; }
    const offset = (page - 1) * size;
    values.push(size, offset);
    const sql = `SELECT * FROM compliance_audit_report WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    const countSql = `SELECT COUNT(*) FROM compliance_audit_report WHERE ${conditions.join(' AND ')}`;
    const [dataRes, countRes] = await Promise.all([pool.query(sql, values), pool.query(countSql, values.slice(0, idx - 1))]);
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, size };
  }

  async generateReport(dto: any) {
    const id = 'rp' + Date.now().toString(36);
    const cols = ['report_id', 'report_name', 'category', 'period', 'generated_by', 'status', 'format', 'recipients'];
    const vals = [id, dto.report_name, dto.category, dto.period, dto.generated_by || 'System Auto', 'generating', dto.format || 'PDF', JSON.stringify(dto.recipients || [])];
    const ph = vals.map((_, i) => `$${i + 1}`);
    const sql = `INSERT INTO compliance_audit_report (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`;
    const res = await pool.query(sql, vals);
    // Simulate report generation completion
    await pool.query(`UPDATE compliance_audit_report SET status = 'ready', generated_at = NOW(), file_size = '1.2 MB', record_count = 0, updated_at = NOW() WHERE report_id = $1`, [id]);
    const updated = await pool.query('SELECT * FROM compliance_audit_report WHERE report_id = $1', [id]);
    return updated.rows[0];
  }
}
