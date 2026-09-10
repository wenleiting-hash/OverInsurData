import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';
import { CreateCooperationDto, UpdateCooperationDto, CreateContractDto, CreateContactDto } from './dtos/cooperation.dto';

@Injectable()
export class CooperationService {
  private readonly logger = new Logger(CooperationService.name);

  // ── Cooperations ──
  async getList(query: { status?: string; carrier?: string }) {
    const conds: string[] = ['deleted = FALSE']; const vals: any[] = []; let pi = 1;
    if (query.status && query.status !== 'all') { conds.push(`status = $${pi}`); vals.push(query.status); pi++; }
    if (query.carrier && query.carrier !== 'all') { conds.push(`carrier_id = $${pi}`); vals.push(query.carrier); pi++; }
    const res = await pool.query(`SELECT cp.*, c.carrier_name_short AS insurer_short FROM carrier_partnership cp LEFT JOIN insurance_carrier c ON c.carrier_id = cp.carrier_id WHERE cp.${conds.join(' AND cp.')} ORDER BY cp.created_at DESC`, vals);
    return res.rows;
  }

  async getById(id: string) {
    const res = await pool.query('SELECT cp.*, c.carrier_name_short AS insurer_short FROM carrier_partnership cp LEFT JOIN insurance_carrier c ON c.carrier_id = cp.carrier_id WHERE cp.partnership_id = $1 AND cp.deleted = FALSE', [id]);
    if (!res.rows.length) throw new NotFoundException(`Cooperation ${id} not found`);
    return res.rows[0];
  }

  async create(dto: CreateCooperationDto, userId: string) {
    const id = 'coop' + Date.now().toString(36);
    const cols = ['partnership_id', 'carrier_id', 'created_by'];
    const vals: any[] = [id, dto.carrier_id, userId];
    const ph = ['$1', '$2', '$3']; let idx = 4;
    const opt: [string, any][] = [
      ['cooperation_type', dto.cooperation_type], ['status', dto.status || 'Draft'],
      ['commission_tier', dto.commission_tier], ['notes', dto.notes], ['notes_en', dto.notes_en],
      ['settlement_method', dto.settlement_method], ['settlement_cycle_days', dto.settlement_cycle_days],
      ['premium_collection', dto.premium_collection], ['premium_settlement', dto.premium_settlement],
      ['effective_date', dto.effective_date], ['expiration_date', dto.expiration_date],
      ['product_scope', dto.product_scope ? JSON.stringify(dto.product_scope) : undefined],
      ['state_scope', dto.state_scope ? JSON.stringify(dto.state_scope) : undefined],
    ];
    for (const [c, v] of opt) { if (v !== undefined) { cols.push(c); vals.push(v); ph.push(`$${idx++}`); } }
    return (await pool.query(`INSERT INTO carrier_partnership (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`, vals)).rows[0];
  }

  async update(id: string, dto: UpdateCooperationDto) {
    const sets: string[] = []; const vals: any[] = []; let idx = 1;
    for (const [k, v] of Object.entries(dto).filter(([, v]) => v !== undefined)) {
      sets.push(`${k} = $${idx++}`);
      vals.push(['product_scope', 'state_scope'].includes(k) ? JSON.stringify(v) : v);
    }
    if (!sets.length) return this.getById(id);
    sets.push('updated_at = NOW()'); vals.push(id);
    const res = await pool.query(`UPDATE carrier_partnership SET ${sets.join(', ')} WHERE partnership_id = $${idx} AND deleted = FALSE RETURNING *`, vals);
    if (!res.rows.length) throw new NotFoundException(`Cooperation ${id} not found`);
    return res.rows[0];
  }

  async terminate(id: string, reason?: string) {
    const res = await pool.query(
      `UPDATE carrier_partnership SET status = 'Terminated', notes = COALESCE($2, notes), updated_at = NOW() WHERE partnership_id = $1 AND deleted = FALSE RETURNING *`,
      [id, reason]);
    if (!res.rows.length) throw new NotFoundException(`Cooperation ${id} not found`);
    return res.rows[0];
  }

  // ── Contracts ──
  async getContracts(coopId: string) {
    const res = await pool.query('SELECT * FROM carrier_contract WHERE partnership_id = $1 AND deleted = FALSE ORDER BY effective_date DESC', [coopId]);
    return res.rows;
  }

  async createContract(dto: CreateContractDto, coopId?: string) {
    const id = 'contract' + Date.now().toString(36);
    const cols = ['contract_id', 'carrier_id', 'title']; const vals: any[] = [id, dto.carrier_id, dto.title]; const ph = ['$1', '$2', '$3']; let idx = 4;
    if (coopId) { cols.push('partnership_id'); vals.push(coopId); ph.push(`$${idx++}`); }
    const opt: [string, any][] = [
      ['title_en', dto.title_en], ['contract_type', dto.contract_type], ['version', dto.version],
      ['effective_date', dto.effective_date], ['expiry_date', dto.expiry_date],
      ['signatory_us', dto.signatory_us], ['signatory_them', dto.signatory_them],
      ['status', dto.status || 'draft'], ['auto_renew', dto.auto_renew],
      ['tags', dto.tags ? JSON.stringify(dto.tags) : undefined],
      ['tags_en', dto.tags_en ? JSON.stringify(dto.tags_en) : undefined],
    ];
    for (const [c, v] of opt) { if (v !== undefined) { cols.push(c); vals.push(v); ph.push(`$${idx++}`); } }
    return (await pool.query(`INSERT INTO carrier_contract (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`, vals)).rows[0];
  }

  // ── Contacts ──
  async getContacts(coopId: string) {
    const res = await pool.query('SELECT * FROM carrier_contact WHERE partnership_id = $1 AND deleted = FALSE ORDER BY is_primary DESC, full_name', [coopId]);
    return res.rows;
  }

  async createContact(dto: CreateContactDto, coopId?: string) {
    const id = 'ct' + Date.now().toString(36);
    const cols = ['contact_id', 'carrier_id', 'full_name']; const vals: any[] = [id, dto.carrier_id, dto.full_name]; const ph = ['$1', '$2', '$3']; let idx = 4;
    if (coopId) { cols.push('partnership_id'); vals.push(coopId); ph.push(`$${idx++}`); }
    const opt: [string, any][] = [
      ['first_name', dto.first_name], ['last_name', dto.last_name], ['position', dto.position],
      ['department', dto.department], ['role', dto.role], ['email', dto.email],
      ['phone', dto.phone], ['mobile_phone', dto.mobile_phone], ['office_address', dto.office_address],
      ['is_primary', dto.is_primary],
    ];
    for (const [c, v] of opt) { if (v !== undefined) { cols.push(c); vals.push(v); ph.push(`$${idx++}`); } }
    return (await pool.query(`INSERT INTO carrier_contact (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`, vals)).rows[0];
  }

  // ── Settlement ──
  async getSettlement(coopId: string) {
    const res = await pool.query('SELECT * FROM carrier_settlement_config WHERE partnership_id = $1 AND deleted = FALSE LIMIT 1', [coopId]);
    return res.rows[0] || null;
  }

  async updateSettlement(coopId: string, dto: any) {
    const existing = await this.getSettlement(coopId);
    if (!existing) throw new NotFoundException(`Settlement config for ${coopId} not found`);
    const sets: string[] = []; const vals: any[] = []; let idx = 1;
    for (const [k, v] of Object.entries(dto).filter(([, v]) => v !== undefined)) {
      sets.push(`${k} = $${idx++}`); vals.push(v);
    }
    if (!sets.length) return existing;
    sets.push('updated_at = NOW()'); vals.push(existing.config_id);
    return (await pool.query(`UPDATE carrier_settlement_config SET ${sets.join(', ')} WHERE config_id = $${idx} RETURNING *`, vals)).rows[0];
  }
}
