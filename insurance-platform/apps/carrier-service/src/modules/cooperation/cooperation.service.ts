import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger, OnModuleInit } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';
import { AuditService, AuditOperator } from '../../common/services/audit.service';
import { UPLOAD_DIR } from '../upload/upload.config';
import { basename, resolve, sep } from 'path';
import { unlink } from 'fs/promises';
import {
  CreateCooperationDto, UpdateCooperationDto, TerminateCooperationDto,
  CreateContractDto, UpdateContractDto,
  CreateContactDto, UpdateContactDto, UpsertSettlementDto,
  CreateRenewalDto, UpdateRenewalDto, ExecuteRenewalDto,
  CreateAccessRequestDto, UpdateAccessRequestStatusDto,
  RegisterRenewalDto, AddProductLinksDto,
} from './dtos/cooperation.dto';

const SYSTEM_OPERATOR: AuditOperator = { userId: 'system', username: 'system:scheduler' };

/**
 * Cooperation lifecycle (doc 3.6, V1.0.12 — no approval pipeline):
 *   Negotiating 洽谈中 → PendingSign 待签约 → Signed 已签约 → Active 履行中 → Terminated 已终止
 * Expiring/Expired are derived at read time from expiration_date (Active rows only).
 */
const COOP_STATUSES = ['Negotiating', 'PendingSign', 'Signed', 'Active', 'Terminated'] as const;

/** Status changes allowed via PUT /cooperations/:id. Termination goes through /terminate. */
const COOP_TRANSITIONS: Record<string, string[]> = {
  Negotiating: ['PendingSign'],
  PendingSign: ['Negotiating', 'Signed'],
  Signed: ['PendingSign', 'Active'],
  Active: [],
  Terminated: [],
};

/** Only pre-signing cooperations may be deleted (V1.0.12 rule). */
const COOP_DELETABLE = ['Negotiating', 'PendingSign'];

/** Active cooperation flips to Expiring within this many days of expiration. */
const EXPIRING_WINDOW_DAYS = 90;

/** Allowed contract status transitions (expired/terminated are terminal). */
const CONTRACT_TRANSITIONS: Record<string, string[]> = {
  draft: ['negotiating', 'pending-sign', 'terminated'],
  negotiating: ['pending-sign', 'draft', 'terminated'],
  'pending-sign': ['active', 'negotiating', 'terminated'],
  active: ['expiring', 'expired', 'terminated'],
  expiring: ['active', 'expired', 'terminated'],
  expired: [],
  terminated: [],
};

/** Product access pipeline: available→requested→in-review→approved→integrated (+rejected/suspended). */
const ACCESS_TRANSITIONS: Record<string, string[]> = {
  available: ['requested'],
  requested: ['in-review', 'rejected', 'available'],
  'in-review': ['approved', 'rejected', 'requested'],
  approved: ['integrated', 'rejected', 'in-review'],
  integrated: ['suspended'],
  suspended: ['integrated'],
  rejected: [],
};

@Injectable()
export class CooperationService implements OnModuleInit {
  private readonly logger = new Logger(CooperationService.name);

  constructor(private readonly audit: AuditService) {}

  // ── Scheduled terminations (same shape as product pending_change) ──

  onModuleInit() {
    setTimeout(() => {
      this.applyDueTerminations().catch(e => this.logger.error(`Initial termination sweep failed: ${e?.message}`));
      this.applyDueActivations().catch(e => this.logger.error(`Initial activation sweep failed: ${e?.message}`));
      setInterval(() => {
        this.applyDueTerminations().catch(e => this.logger.error(`Termination sweep failed: ${e?.message}`));
        this.applyDueActivations().catch(e => this.logger.error(`Activation sweep failed: ${e?.message}`));
      }, 60_000);
    }, 10_000);
  }

  /** Signed cooperations become Active automatically once their effective date arrives. */
  private async applyDueActivations() {
    const due = await pool.query(
      `SELECT * FROM carrier_partnership
       WHERE status = 'Signed' AND deleted = FALSE
         AND effective_date IS NOT NULL AND effective_date <= CURRENT_DATE`,
    );
    for (const row of due.rows) {
      try {
        await pool.query(
          `UPDATE carrier_partnership SET status = 'Active', updated_at = NOW()
           WHERE partnership_id = $1 AND status = 'Signed'`, [row.partnership_id]);
        await this.audit.log({
          operator: SYSTEM_OPERATOR, action: 'COOP_ACTIVATE', module: 'cooperation',
          targetType: 'partnership', targetId: row.partnership_id, success: true,
          params: { source: 'scheduler', effective_date: row.effective_date },
        });
      } catch (e: any) {
        this.logger.error(`Scheduled activation failed for ${row.partnership_id}: ${e?.message}`);
      }
    }
  }

  /**
   * Read-time derived status (never persisted):
   *  - Active with past expiration → Expired 已到期
   *  - Active expiring within window → Expiring 即将到期
   *  - otherwise the stored status (Negotiating/PendingSign/Signed/Active/Terminated)
   */
  private decorateCooperation(row: any) {
    if (!row) return row;
    let effectiveStatus = row.status;
    if (row.status === 'Active' && row.expiration_date) {
      const days = Math.ceil((new Date(row.expiration_date).getTime() - Date.now()) / 86400000);
      if (days < 0) effectiveStatus = 'Expired';
      else if (days <= EXPIRING_WINDOW_DAYS) effectiveStatus = 'Expiring';
    }
    return { ...row, effective_status: effectiveStatus };
  }

  private async applyDueTerminations() {
    const due = await pool.query(
      `SELECT * FROM carrier_partnership
       WHERE pending_change IS NOT NULL AND terminate_effective_at IS NOT NULL
         AND terminate_effective_at <= NOW() AND deleted = FALSE`,
    );
    for (const row of due.rows) {
      try {
        const change = row.pending_change as Record<string, unknown>;
        // Guard against races: a human may have moved the cooperation away from Active meanwhile.
        if (row.status !== 'Active') {
          await pool.query(
            `UPDATE carrier_partnership SET pending_change = NULL, terminate_effective_at = NULL
             WHERE partnership_id = $1`, [row.partnership_id]);
          this.logger.warn(`Discard stale scheduled termination for ${row.partnership_id} (status=${row.status})`);
          continue;
        }
        await pool.query(
          `UPDATE carrier_partnership
             SET status = 'Terminated', terminated_at = NOW(),
                 pending_change = NULL, terminate_effective_at = NULL, updated_at = NOW()
           WHERE partnership_id = $1`, [row.partnership_id]);
        await this.audit.log({
          operator: SYSTEM_OPERATOR, action: 'COOP_TERMINATE', module: 'cooperation',
          targetType: 'partnership', targetId: row.partnership_id, success: true,
          params: { ...change, source: 'scheduler' },
        });
      } catch (e: any) {
        this.logger.error(`Scheduled termination failed for ${row.partnership_id}: ${e?.message}`);
      }
    }
  }

  // ── Cooperations ──

  /**
   * V1.0.10 prototype alignment (doc ch.10): paginated + searchable cooperation list.
   * q matches insurer name/short name/NAIC, cooperation_type, and any lobType in product_scope.
   * Response envelope mirrors /api/insurers: { data, total, page, pageSize }.
   */
  async getList(query: {
    status?: string; carrier?: string; type?: string; q?: string;
    page?: number; pageSize?: number;
  }) {
    await this.applyDueTerminations();
    await this.applyDueActivations();
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = [10, 20, 50, 100].includes(Number(query.pageSize)) ? Number(query.pageSize) : 10;
    const conds: string[] = ['cp.deleted = FALSE']; const vals: any[] = []; let pi = 1;
    if (query.status && query.status !== 'all') {
      // Expiring/Expired are derived-only: translate to date predicates on Active rows.
      if (query.status === 'Expiring') {
        conds.push(`cp.status = 'Active' AND cp.expiration_date IS NOT NULL
                    AND cp.expiration_date >= CURRENT_DATE
                    AND cp.expiration_date <= CURRENT_DATE + ${EXPIRING_WINDOW_DAYS}::int`);
      } else if (query.status === 'Expired') {
        conds.push(`cp.status = 'Active' AND cp.expiration_date IS NOT NULL AND cp.expiration_date < CURRENT_DATE`);
      } else {
        conds.push(`cp.status = $${pi}`); vals.push(query.status); pi++;
      }
    }
    if (query.carrier && query.carrier !== 'all') { conds.push(`cp.carrier_id = $${pi}`); vals.push(query.carrier); pi++; }
    if (query.type && query.type !== 'all') { conds.push(`cp.cooperation_type = $${pi}`); vals.push(query.type); pi++; }
    if (query.q && query.q.trim()) {
      const like = `%${query.q.trim()}%`;
      conds.push(
        `(c.carrier_name ILIKE $${pi} OR c.carrier_name_short ILIKE $${pi} OR c.naic_code ILIKE $${pi}
          OR cp.cooperation_type ILIKE $${pi}
          OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(cp.product_scope->'lobTypes') lob
                     WHERE lob ILIKE $${pi}))`,
      );
      vals.push(like); pi++;
    }
    const where = conds.join(' AND ');
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS n FROM carrier_partnership cp
       LEFT JOIN insurance_carrier c ON c.carrier_id = cp.carrier_id WHERE ${where}`, vals);
    const dataRes = await pool.query(
      `SELECT cp.*, c.carrier_name AS insurer_name, c.carrier_name_short AS insurer_short, c.naic_code AS naic_code
       FROM carrier_partnership cp
       LEFT JOIN insurance_carrier c ON c.carrier_id = cp.carrier_id
       WHERE ${where} ORDER BY cp.created_at DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...vals, pageSize, (page - 1) * pageSize]);
    return { data: dataRes.rows.map(r => this.decorateCooperation(r)), total: countRes.rows[0].n, page, pageSize };
  }

  /**
   * List-page KPI tiles (doc 10.2). active = every non-Terminated cooperation (incl.
   * pre-signing stages); coveredLineCount dedupes lobTypes across cooperations in SQL;
   * renewal counts reuse the lazy sync so the tile and the renewals tab share one source.
   */
  async getOverview() {
    await this.applyDueTerminations();
    await this.applyDueActivations();
    await this.syncRenewalTasks();
    const coopRes = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status <> 'Terminated')::int AS active_count,
         COUNT(*) FILTER (WHERE status = 'Terminated')::int AS terminated_count
       FROM carrier_partnership WHERE deleted = FALSE`);
    const lobRes = await pool.query(
      `SELECT COUNT(DISTINCT lob)::int AS n
       FROM carrier_partnership cp,
            jsonb_array_elements_text(cp.product_scope->'lobTypes') AS lob
       WHERE cp.deleted = FALSE`);
    const renewalRes = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('upcoming','in-negotiation'))::int AS pending_count,
         COUNT(*) FILTER (WHERE status IN ('upcoming','in-negotiation')
                          AND priority IN ('critical','high'))::int AS urgent_count
       FROM carrier_renewal_task WHERE deleted = FALSE`);
    return {
      activeCount: coopRes.rows[0].active_count,
      terminatedCount: coopRes.rows[0].terminated_count,
      coveredLineCount: lobRes.rows[0].n,
      renewalPendingCount: renewalRes.rows[0].pending_count,
      renewalUrgentCount: renewalRes.rows[0].urgent_count,
    };
  }

  async getById(id: string) {
    await this.applyDueTerminations();
    await this.applyDueActivations();
    const res = await pool.query(
      `SELECT cp.*, c.carrier_name AS insurer_name, c.carrier_name_short AS insurer_short,
              c.naic_code AS naic_code, c.carrier_type AS carrier_type, c.am_best_rating AS am_best_rating
       FROM carrier_partnership cp
       LEFT JOIN insurance_carrier c ON c.carrier_id = cp.carrier_id
       WHERE cp.partnership_id = $1 AND cp.deleted = FALSE`, [id]);
    if (!res.rows.length) throw new NotFoundException(`Cooperation ${id} not found`);
    return this.decorateCooperation(res.rows[0]);
  }

  async create(dto: CreateCooperationDto, operator: AuditOperator) {
    const id = 'coop' + Date.now().toString(36);
    // New cooperations enter the lifecycle at Negotiating (洽谈中); PendingSign is the
    // only other accepted entry state when terms were already agreed offline.
    const initialStatus = dto.status && COOP_TRANSITIONS['Negotiating'].concat('Negotiating').includes(dto.status)
      ? dto.status : 'Negotiating';
    const cols = ['partnership_id', 'carrier_id', 'created_by'];
    const vals: any[] = [id, dto.carrier_id, operator.userId || operator.username || null];
    const ph = ['$1', '$2', '$3']; let idx = 4;
    const opt: [string, any, string?][] = [
      ['cooperation_type', dto.cooperation_type], ['status', initialStatus],
      ['owner_name', dto.owner_name],
      ['commission_tier', dto.commission_tier], ['notes', dto.notes], ['notes_en', dto.notes_en],
      ['settlement_method', dto.settlement_method], ['settlement_cycle_days', dto.settlement_cycle_days],
      ['premium_collection', dto.premium_collection], ['premium_settlement', dto.premium_settlement],
      ['effective_date', dto.effective_date], ['expiration_date', dto.expiration_date],
      ['product_scope', dto.product_scope ? JSON.stringify(dto.product_scope) : undefined, 'jsonb'],
      ['state_scope', dto.state_scope ? JSON.stringify(dto.state_scope) : undefined, 'jsonb'],
    ];
    for (const [c, v, cast] of opt) {
      if (v !== undefined) { cols.push(c); vals.push(v); ph.push(`$${idx++}${cast ? `::${cast}` : ''}`); }
    }
    const row = (await pool.query(
      `INSERT INTO carrier_partnership (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`, vals)).rows[0];
    await this.audit.log({
      operator, action: 'COOP_CREATE', module: 'cooperation', targetType: 'partnership',
      targetId: id, success: true, params: { carrier_id: dto.carrier_id, status: row.status, owner_name: dto.owner_name ?? null },
    });
    return row;
  }

  private static readonly COOP_UPDATABLE = [
    'cooperation_type', 'status', 'owner_name', 'commission_tier', 'notes', 'notes_en',
    'settlement_method', 'settlement_cycle_days', 'premium_collection', 'premium_settlement',
    'effective_date', 'expiration_date', 'product_scope', 'state_scope',
  ];

  async update(id: string, dto: UpdateCooperationDto, operator: AuditOperator) {
    const existing = await this.getById(id);
    // Edit lock (V1.0.12 business rule): only pre-fulfilment cooperations
    // (Negotiating/PendingSign/Signed) can be edited. In-force cooperations carry
    // live business/settlement data and are read-only here; termination and renewal
    // use their dedicated flows (termination/scheduled sweeps update rows directly).
    if (['Active', 'Terminated'].includes(existing.status)) {
      throw new BadRequestException(
        `Cooperations in status ${existing.status} cannot be edited; use terminate/renewal actions instead`,
      );
    }
    // Lifecycle guard: enforce the doc 3.6 state machine. Termination must go through
    // /terminate (carries reason/effective type); terminal cooperations are immutable.
    if (dto.status !== undefined && dto.status !== existing.status) {
      if (existing.status === 'Terminated') {
        throw new BadRequestException('Terminated cooperations cannot change status');
      }
      if (!COOP_STATUSES.includes(dto.status as any)) {
        throw new BadRequestException(`Unknown cooperation status: ${dto.status}`);
      }
      if (!(COOP_TRANSITIONS[existing.status] ?? []).includes(dto.status)) {
        throw new BadRequestException(`Status transition ${existing.status} → ${dto.status} is not allowed`);
      }
    }
    const sets: string[] = []; const vals: any[] = []; let idx = 1;
    for (const k of CooperationService.COOP_UPDATABLE) {
      const v = (dto as any)[k];
      if (v !== undefined) {
        const isJson = k === 'product_scope' || k === 'state_scope';
        sets.push(`${k} = $${idx++}${isJson ? '::jsonb' : ''}`);
        vals.push(isJson ? JSON.stringify(v) : v);
      }
    }
    if (!sets.length) return this.getById(id);
    sets.push('updated_at = NOW()'); vals.push(id);
    const res = await pool.query(
      `UPDATE carrier_partnership SET ${sets.join(', ')} WHERE partnership_id = $${idx} AND deleted = FALSE RETURNING *`, vals);
    if (!res.rows.length) throw new NotFoundException(`Cooperation ${id} not found`);
    await this.audit.log({
      operator, action: 'COOP_UPDATE', module: 'cooperation', targetType: 'partnership',
      targetId: id, success: true,
      params: Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined)),
    });
    return this.decorateCooperation(res.rows[0]);
  }

  /**
   * Delete (soft) a cooperation. Allowed only before signing: Negotiating/PendingSign.
   * Signed/Active/Terminated records carry contracts/settlement/business history and must
   * be preserved; use terminate (3.2) for Active cooperations instead.
   */
  async delete(id: string, operator: AuditOperator) {
    const coop = await this.getById(id);
    if (!COOP_DELETABLE.includes(coop.status)) {
      throw new BadRequestException(
        `Only Negotiating/PendingSign cooperations can be deleted (current: ${coop.status}); use termination for active cooperations`,
      );
    }
    await pool.query(
      'UPDATE carrier_partnership SET deleted = TRUE, updated_at = NOW() WHERE partnership_id = $1', [id]);
    await this.audit.log({
      operator, action: 'COOP_DELETE', module: 'cooperation', targetType: 'partnership',
      targetId: id, success: true, params: { carrier_id: coop.carrier_id, status: coop.status },
    });
    return { deleted: true };
  }

  /**
   * Batch soft-delete (mirrors product batchRemove). The deletable-status rule is
   * enforced server-side: rows beyond Negotiating/PendingSign (or missing/already
   * deleted) are skipped and reported as `skipped` instead of failing the batch.
   */
  async batchRemove(ids: string[], operator: AuditOperator) {
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) throw new BadRequestException('ids must be a non-empty array');
    const res = await pool.query(
      `UPDATE carrier_partnership SET deleted = TRUE, updated_at = NOW()
       WHERE partnership_id = ANY($1) AND deleted = FALSE AND status = ANY($2)
       RETURNING partnership_id, carrier_id, status`,
      [unique, COOP_DELETABLE],
    );
    for (const row of res.rows) {
      await this.audit.log({
        operator, action: 'COOP_DELETE', module: 'cooperation', targetType: 'partnership',
        targetId: row.partnership_id, success: true,
        params: { carrier_id: row.carrier_id, status: row.status, batch: true },
      });
    }
    return { deleted: res.rowCount ?? 0, skipped: unique.length - (res.rowCount ?? 0) };
  }

  /**
   * Terminate a cooperation.
   * - immediate: status → Terminated now
   * - scheduled: pending_change stored, applied by sweep/lazy-read at effectiveAt
   * - end-of-term: scheduled at the cooperation's expiration_date
   * No approval step (V1.0.12 business rule): the request takes effect directly
   * according to the chosen effect type. Expiring/Expired are Active at storage level.
   */
  async terminate(id: string, dto: TerminateCooperationDto, operator: AuditOperator) {
    const coop = await this.getById(id);
    if (coop.status !== 'Active') {
      throw new BadRequestException(
        `Only in-force cooperations can be terminated (current: ${coop.status}); delete pre-signing cooperations instead`,
      );
    }
    const effectType = dto.effectType || 'immediate';

    if (effectType === 'immediate') {
      const res = await pool.query(
        `UPDATE carrier_partnership
           SET status = 'Terminated', terminated_at = NOW(),
               terminate_reason = $2, terminate_note = $3, terminate_effect_type = 'immediate',
               pending_change = NULL, terminate_effective_at = NULL, updated_at = NOW()
         WHERE partnership_id = $1 RETURNING *`,
        [id, dto.reason, dto.note || null]);
      await this.audit.log({
        operator, action: 'COOP_TERMINATE', module: 'cooperation', targetType: 'partnership',
        targetId: id, success: true,
        params: { reason: dto.reason, note: dto.note ?? null, effectType, source: 'immediate' },
      });
      return { ...res.rows[0], scheduled: false };
    }

    let effectiveAt: Date;
    if (effectType === 'end-of-term') {
      if (!coop.expiration_date) {
        throw new BadRequestException('Cooperation has no expiration date; end-of-term termination is unavailable');
      }
      effectiveAt = new Date(coop.expiration_date);
    } else {
      if (!dto.effectiveAt) throw new BadRequestException('effectiveAt is required for scheduled termination');
      effectiveAt = new Date(dto.effectiveAt);
      if (isNaN(effectiveAt.getTime())) throw new BadRequestException('effectiveAt is not a valid date');
    }
    if (effectiveAt.getTime() <= Date.now()) {
      throw new BadRequestException('Termination effective time must be in the future');
    }

    const pending = { action: 'terminate', reason: dto.reason, note: dto.note ?? null, effectType, source: 'immediate' };
    const res = await pool.query(
      `UPDATE carrier_partnership
         SET terminate_reason = $2, terminate_note = $3, terminate_effect_type = $4,
             terminate_effective_at = $5, pending_change = $6::jsonb, updated_at = NOW()
       WHERE partnership_id = $1 RETURNING *`,
      [id, dto.reason, dto.note || null, effectType, effectiveAt.toISOString(), JSON.stringify(pending)]);
    await this.audit.log({
      operator, action: 'COOP_TERMINATE_SCHEDULED', module: 'cooperation', targetType: 'partnership',
      targetId: id, success: true,
      params: { reason: dto.reason, note: dto.note ?? null, effectType, effectiveAt: effectiveAt.toISOString() },
    });
    return { ...res.rows[0], scheduled: true };
  }

  // ── Contracts ──

  /** active/expiring rows derive expired/expiring from expiry_date at read time (no DB writeback). */
  private decorateContract(row: any) {
    if (!row) return row;
    let effectiveStatus = row.status;
    if (row.status === 'active' || row.status === 'expiring') {
      const days = row.expiry_date ? Math.ceil((new Date(row.expiry_date).getTime() - Date.now()) / 86400000) : null;
      if (days !== null && days < 0) effectiveStatus = 'expired';
      else if (days !== null && days <= 90) effectiveStatus = 'expiring';
    }
    return { ...row, id: row.contract_id, effective_status: effectiveStatus };
  }

  async getContracts(coopId: string) {
    const res = await pool.query(
      `SELECT cc.*, c.carrier_name_short AS insurer_short
       FROM carrier_contract cc
       LEFT JOIN insurance_carrier c ON c.carrier_id = cc.carrier_id
       WHERE cc.partnership_id = $1 AND cc.deleted = FALSE
       ORDER BY cc.effective_date DESC`, [coopId]);
    return res.rows.map(r => this.decorateContract(r));
  }

  async getAllContracts(query: { carrier?: string; status?: string; type?: string }) {
    const conds: string[] = ['cc.deleted = FALSE']; const vals: any[] = []; let pi = 1;
    if (query.carrier && query.carrier !== 'all') { conds.push(`cc.carrier_id = $${pi++}`); vals.push(query.carrier); }
    if (query.status && query.status !== 'all') { conds.push(`cc.status = $${pi++}`); vals.push(query.status); }
    if (query.type && query.type !== 'all') { conds.push(`cc.contract_type = $${pi++}`); vals.push(query.type); }
    const res = await pool.query(
      `SELECT cc.*, c.carrier_name_short AS insurer_short
       FROM carrier_contract cc
       LEFT JOIN insurance_carrier c ON c.carrier_id = cc.carrier_id
       WHERE ${conds.join(' AND ')}
       ORDER BY cc.effective_date DESC NULLS LAST`, vals);
    return res.rows.map(r => this.decorateContract(r));
  }

  private static readonly CONTRACT_FIELDS: [string, string][] = [
    ['carrier_id', 'text'], ['title', 'text'], ['title_en', 'text'], ['contract_type', 'text'],
    ['version', 'text'], ['effective_date', 'text'], ['expiry_date', 'text'],
    ['signatory_us', 'text'], ['signatory_them', 'text'], ['status', 'text'],
    ['auto_renew', 'boolean'], ['tags', 'jsonb'], ['tags_en', 'jsonb'], ['file_url', 'text'],
  ];

  async createContract(dto: CreateContractDto, coopId: string | undefined, operator: AuditOperator) {
    const id = 'contract' + Date.now().toString(36);
    const cols = ['contract_id', 'carrier_id', 'title'];
    const vals: any[] = [id, dto.carrier_id, dto.title];
    const ph = ['$1', '$2', '$3']; let idx = 4;
    if (coopId) { cols.push('partnership_id'); vals.push(coopId); ph.push(`$${idx++}`); }
    for (const [col, type] of CooperationService.CONTRACT_FIELDS.slice(3)) {
      const v = (dto as any)[col];
      if (v !== undefined) {
        cols.push(col);
        vals.push(type === 'jsonb' ? JSON.stringify(v) : v);
        ph.push(`$${idx++}${type === 'jsonb' ? '::jsonb' : ''}`);
      }
    }
    const row = (await pool.query(
      `INSERT INTO carrier_contract (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`, vals)).rows[0];
    await this.audit.log({
      operator, action: 'CONTRACT_CREATE', module: 'cooperation', targetType: 'contract',
      targetId: id, success: true, params: { partnership_id: coopId ?? null, title: dto.title },
    });
    return this.decorateContract(row);
  }

  private async requireContract(coopId: string, contractId: string) {
    const res = await pool.query(
      'SELECT * FROM carrier_contract WHERE contract_id = $1 AND partnership_id = $2 AND deleted = FALSE',
      [contractId, coopId]);
    if (!res.rows.length) throw new NotFoundException(`Contract ${contractId} not found`);
    return res.rows[0];
  }

  async updateContract(coopId: string, contractId: string, dto: UpdateContractDto, operator: AuditOperator) {
    const existing = await this.requireContract(coopId, contractId);
    const sets: string[] = []; const vals: any[] = []; let idx = 1;
    for (const [col, type] of CooperationService.CONTRACT_FIELDS) {
      const v = (dto as any)[col];
      if (v !== undefined) {
        sets.push(`${col} = $${idx++}${type === 'jsonb' ? '::jsonb' : ''}`);
        vals.push(type === 'jsonb' ? JSON.stringify(v) : v);
      }
    }
    if (!sets.length) return this.decorateContract(existing);
    sets.push('updated_at = NOW()'); vals.push(contractId);
    const res = await pool.query(
      `UPDATE carrier_contract SET ${sets.join(', ')} WHERE contract_id = $${idx} RETURNING *`, vals);
    // Best-effort cleanup of the replaced attachment.
    if (dto.file_url && existing.file_url && dto.file_url !== existing.file_url) {
      await this.removeUploadedFile(existing.file_url);
    }
    await this.audit.log({
      operator, action: 'CONTRACT_UPDATE', module: 'cooperation', targetType: 'contract',
      targetId: contractId, success: true,
      params: Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined)),
    });
    return this.decorateContract(res.rows[0]);
  }

  async setContractStatus(coopId: string, contractId: string, status: string, operator: AuditOperator) {
    const existing = await this.requireContract(coopId, contractId);
    const allowed = CONTRACT_TRANSITIONS[existing.status];
    if (!allowed) throw new BadRequestException(`Unknown contract status: ${existing.status}`);
    if (!CONTRACT_TRANSITIONS[existing.status]?.includes(status)) {
      throw new BadRequestException(`Contract status transition ${existing.status} → ${status} is not allowed`);
    }
    const res = await pool.query(
      `UPDATE carrier_contract SET status = $2, updated_at = NOW() WHERE contract_id = $1 RETURNING *`,
      [contractId, status]);
    await this.audit.log({
      operator, action: 'CONTRACT_STATUS', module: 'cooperation', targetType: 'contract',
      targetId: contractId, success: true, params: { from: existing.status, to: status },
    });
    return this.decorateContract(res.rows[0]);
  }

  async deleteContract(coopId: string, contractId: string, operator: AuditOperator) {
    const existing = await this.requireContract(coopId, contractId);
    await pool.query('UPDATE carrier_contract SET deleted = TRUE, updated_at = NOW() WHERE contract_id = $1', [contractId]);
    if (existing.file_url) await this.removeUploadedFile(existing.file_url);
    await this.audit.log({
      operator, action: 'CONTRACT_DELETE', module: 'cooperation', targetType: 'contract',
      targetId: contractId, success: true,
    });
    return { deleted: true };
  }

  /** Delete an uploaded attachment from disk. Mirrors the product-material safety rules:
   *  basename strips traversal, resolve + prefix check confines deletion inside UPLOAD_DIR. */
  private async removeUploadedFile(fileUrl: string) {
    try {
      const target = resolve(UPLOAD_DIR, basename(fileUrl));
      if (target.startsWith(UPLOAD_DIR + sep)) await unlink(target);
    } catch (e: any) {
      this.logger.warn(`Failed to remove old contract file ${fileUrl}: ${e?.message}`);
    }
  }

  // ── Contacts ──

  async getContacts(coopId: string) {
    const res = await pool.query(
      `SELECT cc.*, c.carrier_name_short AS insurer_short
       FROM carrier_contact cc
       LEFT JOIN insurance_carrier c ON c.carrier_id = cc.carrier_id
       WHERE cc.partnership_id = $1 AND cc.deleted = FALSE
       ORDER BY cc.is_primary DESC, cc.full_name`, [coopId]);
    return res.rows;
  }

  async getAllContacts(query: { carrier?: string }) {
    const conds: string[] = ['cc.deleted = FALSE']; const vals: string[] = [];
    if (query.carrier && query.carrier !== 'all') { conds.push(`cc.carrier_id = $1`); vals.push(query.carrier); }
    const res = await pool.query(
      `SELECT cc.*, c.carrier_name_short AS insurer_short
       FROM carrier_contact cc
       LEFT JOIN insurance_carrier c ON c.carrier_id = cc.carrier_id
       WHERE ${conds.join(' AND ')}
       ORDER BY c.carrier_name_short, cc.is_primary DESC, cc.full_name`, vals);
    return res.rows;
  }

  private static readonly CONTACT_FIELDS = [
    'carrier_id', 'full_name', 'first_name', 'last_name', 'position', 'department', 'role',
    'email', 'phone', 'mobile_phone', 'office_address', 'is_active', 'is_primary',
  ];

  async createContact(dto: CreateContactDto, coopId: string | undefined, operator: AuditOperator) {
    const id = 'ct' + Date.now().toString(36);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (dto.is_primary) {
        await client.query(
          `UPDATE carrier_contact SET is_primary = FALSE, updated_at = NOW()
           WHERE carrier_id = $1 AND COALESCE(partnership_id, '') = COALESCE($2, '') AND deleted = FALSE`,
          [dto.carrier_id, coopId || null]);
      }
      const cols = ['contact_id', 'carrier_id', 'full_name'];
      const vals: any[] = [id, dto.carrier_id, dto.full_name];
      const ph = ['$1', '$2', '$3']; let idx = 4;
      if (coopId) { cols.push('partnership_id'); vals.push(coopId); ph.push(`$${idx++}`); }
      for (const col of CooperationService.CONTACT_FIELDS.slice(3)) {
        const v = (dto as any)[col];
        if (v !== undefined) { cols.push(col); vals.push(v); ph.push(`$${idx++}`); }
      }
      const row = (await client.query(
        `INSERT INTO carrier_contact (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`, vals)).rows[0];
      await client.query('COMMIT');
      await this.audit.log({
        operator, action: 'CONTACT_CREATE', module: 'cooperation', targetType: 'contact',
        targetId: id, success: true, params: { partnership_id: coopId ?? null, full_name: dto.full_name, is_primary: !!dto.is_primary },
      });
      return row;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  private async requireContact(contactId: string) {
    const res = await pool.query(
      'SELECT * FROM carrier_contact WHERE contact_id = $1 AND deleted = FALSE', [contactId]);
    if (!res.rows.length) throw new NotFoundException(`Contact ${contactId} not found`);
    return res.rows[0];
  }

  async updateContact(contactId: string, dto: UpdateContactDto, operator: AuditOperator) {
    await this.requireContact(contactId);
    const sets: string[] = []; const vals: any[] = []; let idx = 1;
    for (const col of CooperationService.CONTACT_FIELDS) {
      const v = (dto as any)[col];
      if (v !== undefined) { sets.push(`${col} = $${idx++}`); vals.push(v); }
    }
    if (!sets.length) {
      const res = await pool.query('SELECT * FROM carrier_contact WHERE contact_id = $1', [contactId]);
      return res.rows[0];
    }
    sets.push('updated_at = NOW()'); vals.push(contactId);
    const res = await pool.query(
      `UPDATE carrier_contact SET ${sets.join(', ')} WHERE contact_id = $${idx} RETURNING *`, vals);
    await this.audit.log({
      operator, action: 'CONTACT_UPDATE', module: 'cooperation', targetType: 'contact',
      targetId: contactId, success: true,
      params: Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined)),
    });
    return res.rows[0];
  }

  async deleteContact(contactId: string, operator: AuditOperator) {
    await this.requireContact(contactId);
    await pool.query('UPDATE carrier_contact SET deleted = TRUE, is_active = FALSE, updated_at = NOW() WHERE contact_id = $1', [contactId]);
    await this.audit.log({
      operator, action: 'CONTACT_DELETE', module: 'cooperation', targetType: 'contact',
      targetId: contactId, success: true,
    });
    return { deleted: true };
  }

  async setPrimaryContact(contactId: string, operator: AuditOperator) {
    const target = await this.requireContact(contactId);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE carrier_contact SET is_primary = FALSE, updated_at = NOW()
         WHERE carrier_id = $1 AND COALESCE(partnership_id, '') = COALESCE($2, '') AND deleted = FALSE`,
        [target.carrier_id, target.partnership_id || null]);
      const res = await client.query(
        `UPDATE carrier_contact SET is_primary = TRUE, updated_at = NOW() WHERE contact_id = $1 RETURNING *`,
        [contactId]);
      await client.query('COMMIT');
      await this.audit.log({
        operator, action: 'CONTACT_SET_PRIMARY', module: 'cooperation', targetType: 'contact',
        targetId: contactId, success: true, params: { carrier_id: target.carrier_id },
      });
      return res.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // ── Settlement ──

  async getSettlement(coopId: string) {
    const res = await pool.query(
      'SELECT * FROM carrier_settlement_config WHERE partnership_id = $1 AND deleted = FALSE LIMIT 1', [coopId]);
    return res.rows[0] || null;
  }

  async getAllSettlementConfigs() {
    const res = await pool.query(
      `SELECT sc.*, c.carrier_name_short AS insurer_short
       FROM carrier_settlement_config sc
       LEFT JOIN insurance_carrier c ON c.carrier_id = sc.carrier_id
       WHERE sc.deleted = FALSE
       ORDER BY sc.updated_at DESC NULLS LAST`);
    return res.rows;
  }

  private static readonly SETTLEMENT_FIELDS = [
    'cycle', 'bill_cutoff_day', 'payment_term_days', 'payment_method',
    'billing_format', 'api_enabled', 'premium_collection',
  ];

  /** Idempotent upsert: a cooperation owns 0..1 config, so PUT creates when absent (never 404). */
  async upsertSettlement(coopId: string, dto: UpsertSettlementDto, operator: AuditOperator) {
    const coopRes = await pool.query(
      'SELECT carrier_id FROM carrier_partnership WHERE partnership_id = $1 AND deleted = FALSE', [coopId]);
    if (!coopRes.rows.length) throw new NotFoundException(`Cooperation ${coopId} not found`);
    const existing = await this.getSettlement(coopId);
    const fieldSet = Object.fromEntries(
      CooperationService.SETTLEMENT_FIELDS.map(k => [k, (dto as any)[k]]).filter(([, v]) => v !== undefined),
    );

    let row;
    if (existing) {
      const sets: string[] = []; const vals: any[] = []; let idx = 1;
      for (const [k, v] of Object.entries(fieldSet)) { sets.push(`${k} = $${idx++}`); vals.push(v); }
      if (!sets.length) return existing;
      sets.push('updated_by = $' + idx, 'last_updated = NOW()', 'updated_at = NOW()');
      vals.push(operator.username || operator.userId || null);
      vals.push(existing.config_id);
      row = (await pool.query(
        `UPDATE carrier_settlement_config SET ${sets.join(', ')} WHERE config_id = $${idx + 1} RETURNING *`, vals)).rows[0];
    } else {
      const id = 'cfg' + Date.now().toString(36);
      row = (await pool.query(
        `INSERT INTO carrier_settlement_config
           (config_id, carrier_id, partnership_id, cycle, bill_cutoff_day, payment_term_days,
            payment_method, billing_format, api_enabled, premium_collection, updated_by, last_updated)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING *`,
        [
          id, dto.carrier_id || coopRes.rows[0].carrier_id, coopId,
          fieldSet.cycle ?? 'Monthly', fieldSet.bill_cutoff_day ?? 25, fieldSet.payment_term_days ?? 30,
          fieldSet.payment_method ?? 'ACH', fieldSet.billing_format ?? 'EDI',
          fieldSet.api_enabled ?? false, fieldSet.premium_collection ?? 'AgencyBill',
          operator.username || operator.userId || null,
        ])).rows[0];
    }
    await this.audit.log({
      operator, action: 'SETTLEMENT_UPSERT', module: 'cooperation', targetType: 'settlement',
      targetId: row.config_id, success: true, params: { partnership_id: coopId, created: !existing, ...fieldSet },
    });
    return row;
  }

  // ── Renewals ──

  private priorityForDays(days: number): string {
    if (days < 0) return 'critical';
    if (days <= 60) return 'high';
    if (days <= 120) return 'normal';
    return 'low';
  }

  /**
   * Derive renewal tasks from contracts (preferred) and contract-less partnerships.
   * Window: expiry within [today-30d, today+200d]. Deterministic IDs make this idempotent;
   * rows already renewed/expired and manually created rows (timestamp IDs) are never touched.
   */
  async syncRenewalTasks() {
    const sources = await pool.query(
      `WITH contract_sources AS (
         SELECT cc.contract_id, cc.partnership_id, cc.carrier_id,
                COALESCE(cc.title_en, cc.title) AS title,
                cc.expiry_date, cc.auto_renew, c.carrier_name_short
         FROM carrier_contract cc
         LEFT JOIN insurance_carrier c ON c.carrier_id = cc.carrier_id
         WHERE cc.deleted = FALSE AND cc.status IN ('active','expiring','expired')
           AND cc.expiry_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE + INTERVAL '200 days'
       )
       SELECT 'contract' AS source, contract_id AS ref_id, partnership_id, carrier_id,
              title, expiry_date, auto_renew, carrier_name_short
       FROM contract_sources
       UNION ALL
       SELECT 'partnership', cp.partnership_id, cp.partnership_id, cp.carrier_id,
              NULL, cp.expiration_date, FALSE, c.carrier_name_short
       FROM carrier_partnership cp
       LEFT JOIN insurance_carrier c ON c.carrier_id = cp.carrier_id
       WHERE cp.deleted = FALSE AND cp.status = 'Active'
         AND cp.expiration_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE + INTERVAL '200 days'
         AND NOT EXISTS (SELECT 1 FROM contract_sources cs WHERE cs.partnership_id = cp.partnership_id)`);

    for (const s of sources.rows) {
      const renewalId = s.source === 'contract' ? `rn_c_${s.ref_id}` : `rn_p_${s.ref_id}`;
      const title = s.source === 'contract'
        ? s.title
        : `${s.carrier_name_short || s.carrier_id} Partnership Renewal`;
      const days = Math.ceil((new Date(s.expiry_date).getTime() - Date.now()) / 86400000);
      const priority = this.priorityForDays(days);
      const existing = await pool.query('SELECT * FROM carrier_renewal_task WHERE renewal_id = $1', [renewalId]);
      if (!existing.rows.length) {
        await pool.query(
          `INSERT INTO carrier_renewal_task
             (renewal_id, partnership_id, carrier_id, contract_id, title, expiry_date, priority, status, auto_renew)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'upcoming',$8)
           ON CONFLICT (renewal_id) DO NOTHING`,
          [renewalId, s.partnership_id, s.carrier_id, s.source === 'contract' ? s.ref_id : null,
           title, s.expiry_date, priority, !!s.auto_renew]);
      } else if (!['renewed', 'expired'].includes(existing.rows[0].status)) {
        await pool.query(
          `UPDATE carrier_renewal_task
             SET title = $2, expiry_date = $3, priority = $4, auto_renew = $5, updated_at = NOW()
           WHERE renewal_id = $1`,
          [renewalId, title, s.expiry_date, priority, !!s.auto_renew]);
      }
    }
  }

  async getRenewals(query: { status?: string }) {
    await this.syncRenewalTasks();
    const conds = ['rt.deleted = FALSE']; const vals: string[] = [];
    if (query.status && query.status !== 'all') { conds.push('rt.status = $1'); vals.push(query.status); }
    const res = await pool.query(
      `SELECT rt.*, c.carrier_name_short AS insurer_short
       FROM carrier_renewal_task rt
       LEFT JOIN insurance_carrier c ON c.carrier_id = rt.carrier_id
       WHERE ${conds.join(' AND ')}
       ORDER BY rt.expiry_date ASC`, vals);
    return res.rows;
  }

  async createRenewal(coopId: string, dto: CreateRenewalDto, operator: AuditOperator) {
    const coop = await pool.query(
      'SELECT carrier_id FROM carrier_partnership WHERE partnership_id = $1 AND deleted = FALSE', [coopId]);
    if (!coop.rows.length) throw new NotFoundException(`Cooperation ${coopId} not found`);
    const id = 'rn' + Date.now().toString(36);
    const days = Math.ceil((new Date(dto.expiry_date).getTime() - Date.now()) / 86400000);
    const row = (await pool.query(
      `INSERT INTO carrier_renewal_task
         (renewal_id, partnership_id, carrier_id, contract_id, title, expiry_date, priority, status,
          auto_renew, account_manager, last_action, last_action_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'in-negotiation',$8,$9,$10,CURRENT_DATE) RETURNING *`,
      [
        id, coopId, coop.rows[0].carrier_id, dto.contract_id || null, dto.title, dto.expiry_date,
        dto.priority || this.priorityForDays(days), !!dto.auto_renew,
        dto.account_manager || null, dto.last_action || 'Renewal initiated',
      ])).rows[0];
    await this.audit.log({
      operator, action: 'RENEWAL_CREATE', module: 'cooperation', targetType: 'renewal',
      targetId: id, success: true, params: { partnership_id: coopId, expiry_date: dto.expiry_date },
    });
    return row;
  }

  private async requireRenewal(renewalId: string) {
    const res = await pool.query('SELECT * FROM carrier_renewal_task WHERE renewal_id = $1 AND deleted = FALSE', [renewalId]);
    if (!res.rows.length) throw new NotFoundException(`Renewal ${renewalId} not found`);
    return res.rows[0];
  }

  async updateRenewal(renewalId: string, dto: UpdateRenewalDto, operator: AuditOperator) {
    await this.requireRenewal(renewalId);
    const fields = ['title', 'expiry_date', 'priority', 'status', 'account_manager', 'auto_renew'];
    const sets: string[] = []; const vals: any[] = []; let idx = 1;
    for (const f of fields) {
      const v = (dto as any)[f];
      if (v !== undefined) { sets.push(`${f} = $${idx++}`); vals.push(v); }
    }
    if (dto.last_action !== undefined) {
      sets.push(`last_action = $${idx++}`, 'last_action_at = CURRENT_DATE');
      vals.push(dto.last_action);
    }
    if (!sets.length) {
      const res = await pool.query('SELECT * FROM carrier_renewal_task WHERE renewal_id = $1', [renewalId]);
      return res.rows[0];
    }
    sets.push('updated_at = NOW()'); vals.push(renewalId);
    const res = await pool.query(
      `UPDATE carrier_renewal_task SET ${sets.join(', ')} WHERE renewal_id = $${idx} RETURNING *`, vals);
    await this.audit.log({
      operator, action: 'RENEWAL_UPDATE', module: 'cooperation', targetType: 'renewal',
      targetId: renewalId, success: true,
      params: Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined)),
    });
    return res.rows[0];
  }

  async executeRenewal(renewalId: string, dto: ExecuteRenewalDto, operator: AuditOperator) {
    const task = await this.requireRenewal(renewalId);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Default extension: one year past the current expiry (or one year from today if already expired).
      const finalExpiry = dto.new_expiry_date
        || (() => {
            const base = (task.expiry_date && new Date(task.expiry_date) > new Date())
              ? new Date(task.expiry_date) : new Date();
            base.setFullYear(base.getFullYear() + 1);
            return base.toISOString().slice(0, 10);
          })();
      await client.query(
        `UPDATE carrier_partnership SET expiration_date = $2, updated_at = NOW() WHERE partnership_id = $1`,
        [task.partnership_id, finalExpiry]);
      if (task.contract_id) {
        await client.query(
          `UPDATE carrier_contract SET expiry_date = $2, status = 'active', updated_at = NOW()
           WHERE contract_id = $1 AND deleted = FALSE`, [task.contract_id, finalExpiry]);
      }
      const res = await client.query(
        `UPDATE carrier_renewal_task
           SET status = 'renewed', last_action = 'Renewed', last_action_at = CURRENT_DATE, updated_at = NOW()
         WHERE renewal_id = $1 RETURNING *`, [renewalId]);
      await client.query('COMMIT');
      await this.audit.log({
        operator, action: 'RENEWAL_EXECUTE', module: 'cooperation', targetType: 'renewal',
        targetId: renewalId, success: true,
        params: { partnership_id: task.partnership_id, contract_id: task.contract_id ?? null, new_expiry_date: finalExpiry },
      });
      return res.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // ── Product access requests ──

  async getAccessRequests(query: { status?: string; carrier?: string }) {
    const conds = ['r.deleted = FALSE']; const vals: string[] = []; let pi = 1;
    if (query.status && query.status !== 'all') { conds.push(`r.status = $${pi++}`); vals.push(query.status); }
    if (query.carrier && query.carrier !== 'all') { conds.push(`r.carrier_id = $${pi++}`); vals.push(query.carrier); }
    const res = await pool.query(
      `SELECT r.*, c.carrier_name_short AS insurer_short
       FROM carrier_product_access_request r
       LEFT JOIN insurance_carrier c ON c.carrier_id = r.carrier_id
       WHERE ${conds.join(' AND ')}
       ORDER BY r.created_at DESC`, vals);
    return res.rows;
  }

  async createAccessRequest(dto: CreateAccessRequestDto, operator: AuditOperator) {
    const id = 'req' + Date.now().toString(36);
    const row = (await pool.query(
      `INSERT INTO carrier_product_access_request
         (request_id, partnership_id, carrier_id, product_id, product_name, product_code, line_of_business,
          target_states, priority, status, estimated_premium, technical_reqs, notes, requested_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,'requested',$10,$11::jsonb,$12,$13) RETURNING *`,
      [
        id, dto.partnership_id || null, dto.carrier_id, dto.product_id || null,
        dto.product_name, dto.product_code || null, dto.line_of_business || null,
        JSON.stringify(dto.target_states?.length ? dto.target_states : ['ALL']),
        dto.priority || 'normal', dto.estimated_premium ?? null,
        JSON.stringify(dto.technical_reqs || []), dto.notes || null,
        operator.username || operator.userId || null,
      ])).rows[0];
    await this.audit.log({
      operator, action: 'ACCESS_REQUEST_CREATE', module: 'cooperation', targetType: 'access_request',
      targetId: id, success: true, params: { carrier_id: dto.carrier_id, product_name: dto.product_name },
    });
    return row;
  }

  async updateAccessRequest(requestId: string, dto: UpdateAccessRequestStatusDto, operator: AuditOperator) {
    const res = await pool.query(
      'SELECT * FROM carrier_product_access_request WHERE request_id = $1 AND deleted = FALSE', [requestId]);
    if (!res.rows.length) throw new NotFoundException(`Access request ${requestId} not found`);
    const existing = res.rows[0];
    const target = dto.status;

    // Flag-only update (technical integration progress): no status change.
    if (target === undefined) {
      if (existing.status !== 'approved') {
        throw new BadRequestException('Technical flags can only be updated while the request is approved');
      }
      const apiDoc = dto.api_doc ?? existing.api_doc;
      const testCompleted = dto.test_completed ?? existing.test_completed;
      const flagUpd = await pool.query(
        `UPDATE carrier_product_access_request
           SET api_doc = $2, test_completed = $3, updated_at = NOW()
         WHERE request_id = $1 RETURNING *`,
        [requestId, apiDoc, testCompleted]);
      await this.audit.log({
        operator, action: 'ACCESS_REQUEST_STATUS', module: 'cooperation', targetType: 'access_request',
        targetId: requestId, success: true,
        params: { flagsOnly: true, api_doc: apiDoc, test_completed: testCompleted },
      });
      return flagUpd.rows[0];
    }

    if (!ACCESS_TRANSITIONS[existing.status]) throw new BadRequestException(`Unknown request status: ${existing.status}`);
    if (!ACCESS_TRANSITIONS[existing.status].includes(target)) {
      throw new BadRequestException(`Access request transition ${existing.status} → ${target} is not allowed`);
    }
    if (target === 'rejected' && !dto.notes) {
      throw new BadRequestException('A rejection note is required');
    }
    const testCompleted = dto.test_completed ?? existing.test_completed;
    const apiDoc = dto.api_doc ?? existing.api_doc;
    if (target === 'integrated' && !testCompleted) {
      throw new BadRequestException('Technical testing must be completed before integration');
    }
    const reviewedStates = ['in-review', 'approved', 'integrated', 'rejected', 'suspended'];
    const sets = [
      'status = $2', 'api_doc = $3', 'test_completed = $4', 'notes = COALESCE($5, notes)', 'updated_at = NOW()',
    ];
    const vals: any[] = [
      requestId, target, apiDoc, testCompleted, dto.notes ?? null,
    ];
    if (reviewedStates.includes(target)) {
      sets.push('reviewed_by = $6', 'reviewed_at = NOW()');
      vals.push(operator.username || operator.userId || null);
    }
    const upd = await pool.query(
      `UPDATE carrier_product_access_request SET ${sets.join(', ')} WHERE request_id = $1 RETURNING *`, vals);
    await this.audit.log({
      operator, action: 'ACCESS_REQUEST_STATUS', module: 'cooperation', targetType: 'access_request',
      targetId: requestId, success: true, params: { from: existing.status, to: target, notes: dto.notes ?? null },
    });
    return upd.rows[0];
  }

  // ── V1.0.15 续约直接登记（O6：无中间态）────────────────────────────

  /** 某合作的续约登记记录（时间线，新→旧）。 */
  async getCoopRenewals(coopId: string) {
    const coop = await pool.query(
      'SELECT partnership_id FROM carrier_partnership WHERE partnership_id = $1 AND deleted = FALSE', [coopId]);
    if (!coop.rows.length) throw new NotFoundException(`Cooperation ${coopId} not found`);
    const res = await pool.query(
      `SELECT rt.renewal_id, rt.title, rt.expiry_date, rt.status, rt.priority, rt.auto_renew,
              rt.new_expiry_date, rt.new_contract_id, rt.register_note, rt.registered_at, rt.registered_by,
              rt.created_at, COALESCE(cc.title_en, cc.title) AS new_contract_title
         FROM carrier_renewal_task rt
         LEFT JOIN carrier_contract cc ON cc.contract_id = rt.new_contract_id
        WHERE rt.partnership_id = $1 AND rt.deleted = FALSE
        ORDER BY COALESCE(rt.registered_at, rt.created_at) DESC`,
      [coopId]);
    return res.rows;
  }

  /**
   * 直接登记续约：延长合作到期日（已签约则同时置 Active）、可选续约合同同步延期，
   * 写一条 status=renewed 的登记记录。无谈判/待执行中间态（O6）。
   */
  async registerRenewal(coopId: string, dto: RegisterRenewalDto, operator: AuditOperator) {
    const coopRes = await pool.query(
      'SELECT * FROM carrier_partnership WHERE partnership_id = $1 AND deleted = FALSE', [coopId]);
    if (!coopRes.rows.length) throw new NotFoundException(`Cooperation ${coopId} not found`);
    const coop = coopRes.rows[0];

    if (coop.status === 'Terminated') {
      throw new BadRequestException('Terminated cooperation cannot be renewed');
    }
    if (['Negotiating', 'PendingSign'].includes(coop.status)) {
      throw new BadRequestException(`Cooperation in status ${coop.status} is not signed yet and cannot be renewed`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.new_expiry_date)) {
      throw new BadRequestException('new_expiry_date must be YYYY-MM-DD');
    }
    const next = new Date(`${dto.new_expiry_date}T00:00:00Z`);
    if (Number.isNaN(next.getTime())) throw new BadRequestException('Invalid new_expiry_date');
    if (next.getTime() <= Date.now()) {
      throw new BadRequestException('New expiry date must be in the future');
    }
    if (coop.expiration_date && next <= new Date(coop.expiration_date)) {
      throw new BadRequestException('New expiry date must be later than current expiration date');
    }
    if (dto.new_contract_id) {
      const c = await pool.query(
        'SELECT contract_id FROM carrier_contract WHERE contract_id = $1 AND partnership_id = $2 AND deleted = FALSE',
        [dto.new_contract_id, coopId]);
      if (!c.rows.length) throw new BadRequestException('Renewal contract does not belong to this cooperation');
    }

    const renewalId = `rnreg${Date.now().toString(36)}`;
    const days = Math.ceil((next.getTime() - Date.now()) / 86400000);
    const priority = this.priorityForDays(days);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // 已签约 → 履行中；履行中/派生到期状态保持 Active（Expiring 仅读取时派生）
      await client.query(
        `UPDATE carrier_partnership
            SET expiration_date = $2,
                status = CASE WHEN status = 'Signed' THEN 'Active' ELSE status END,
                updated_at = NOW()
          WHERE partnership_id = $1`,
        [coopId, dto.new_expiry_date]);
      if (dto.new_contract_id) {
        await client.query(
          `UPDATE carrier_contract
              SET expiry_date = $2, status = 'active', updated_at = NOW()
            WHERE contract_id = $1 AND deleted = FALSE`,
          [dto.new_contract_id, dto.new_expiry_date]);
      }
      const res = await client.query(
        `INSERT INTO carrier_renewal_task
           (renewal_id, partnership_id, carrier_id, contract_id, title, expiry_date, priority, status,
            auto_renew, last_action, last_action_at,
            new_expiry_date, new_contract_id, register_note, registered_at, registered_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'renewed',FALSE,'Renewal registered',CURRENT_DATE,
                 $6,$4,$8,NOW(),$9) RETURNING *`,
        [
          renewalId, coopId, coop.carrier_id, dto.new_contract_id || null,
          `Renewal registered ${dto.new_expiry_date}`, dto.new_expiry_date, priority,
          dto.note?.slice(0, 512) || null,
          operator.username || operator.userId || null,
        ]);
      await client.query('COMMIT');
      await this.audit.log({
        operator, action: 'RENEWAL_REGISTER', module: 'cooperation', targetType: 'renewal',
        targetId: renewalId, success: true,
        params: {
          partnership_id: coopId, new_expiry_date: dto.new_expiry_date,
          new_contract_id: dto.new_contract_id ?? null, note: dto.note ?? null,
        },
      });
      return res.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // ── V1.0.15 合作-产品关联（C2）─────────────────────────────────────

  /** 合作已关联产品（附带渠道授权占用数，用于取消关联前提示）。 */
  async getProductLinks(coopId: string) {
    const coop = await pool.query(
      'SELECT partnership_id FROM carrier_partnership WHERE partnership_id = $1 AND deleted = FALSE', [coopId]);
    if (!coop.rows.length) throw new NotFoundException(`Cooperation ${coopId} not found`);
    const res = await pool.query(
      `SELECT cp.link_id, cp.partnership_id, cp.carrier_id, cp.product_id, cp.effective_from, cp.remark,
              cp.created_by, cp.created_at,
              p.product_name, p.short_name, p.product_code, p.line_of_business,
              p.status AS product_status, p.available_states,
              (SELECT COUNT(*) FROM channel_product_authorization a
                WHERE a.product_id = cp.product_id AND a.carrier_id = cp.carrier_id AND a.deleted = FALSE)::int AS channel_auth_count
         FROM cooperation_product cp
         JOIN insurance_product p ON p.product_id = cp.product_id
        WHERE cp.partnership_id = $1 AND cp.deleted = FALSE
        ORDER BY cp.created_at DESC, p.product_name`,
      [coopId]);
    return res.rows;
  }

  /**
   * 批量关联产品（两步弹窗的确认步）：产品必须属于该合作保司；重复关联跳过。
   */
  async addProductLinks(coopId: string, dto: AddProductLinksDto, operator: AuditOperator) {
    const coopRes = await pool.query(
      'SELECT * FROM carrier_partnership WHERE partnership_id = $1 AND deleted = FALSE', [coopId]);
    if (!coopRes.rows.length) throw new NotFoundException(`Cooperation ${coopId} not found`);
    const coop = coopRes.rows[0];
    const ids = Array.from(new Set((dto.product_ids ?? []).filter(Boolean)));
    if (!ids.length) throw new BadRequestException('product_ids must not be empty');

    const prodRes = await pool.query(
      `SELECT product_id, carrier_id, product_name, product_code, status
         FROM insurance_product WHERE product_id = ANY($1)`, [ids]);
    const byId = new Map(prodRes.rows.map((r) => [r.product_id, r]));
    const invalid: string[] = [];
    for (const pid of ids) {
      const p = byId.get(pid);
      if (!p) invalid.push(`${pid}: product not found`);
      else if (p.carrier_id !== coop.carrier_id) invalid.push(`${p.product_code || pid}: not a product of this carrier`);
    }
    if (invalid.length) throw new BadRequestException(`Invalid products: ${invalid.join('; ')}`);

    const effectiveFrom = dto.effective_from || new Date().toISOString().slice(0, 10);
    const inserted: any[] = [];
    const skipped: string[] = [];
    for (let i = 0; i < ids.length; i += 1) {
      const pid = ids[i];
      const linkId = `cpl${Date.now().toString(36)}${i.toString(36)}`;
      try {
        const r = await pool.query(
          `INSERT INTO cooperation_product
             (link_id, partnership_id, carrier_id, product_id, effective_from, remark, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT DO NOTHING RETURNING *`,
          [linkId, coopId, coop.carrier_id, pid, effectiveFrom, dto.remark?.slice(0, 512) || null,
            operator.username || operator.userId || null]);
        if (r.rows.length) inserted.push(r.rows[0]);
        else skipped.push(pid);
      } catch {
        skipped.push(pid);
      }
    }
    await this.audit.log({
      operator, action: 'PRODUCT_LINK_ADD', module: 'cooperation', targetType: 'cooperation_product',
      targetId: coopId, success: true,
      params: { product_ids: ids, inserted: inserted.length, skipped: skipped.length },
    });
    return { inserted: inserted.length, skipped, data: inserted };
  }

  /**
   * 取消关联：若该 保司+产品 仍被渠道产品授权占用则拒绝（409 + 占用渠道清单）。
   */
  async removeProductLink(coopId: string, linkId: string, operator: AuditOperator) {
    const linkRes = await pool.query(
      'SELECT * FROM cooperation_product WHERE link_id = $1 AND partnership_id = $2 AND deleted = FALSE',
      [linkId, coopId]);
    if (!linkRes.rows.length) throw new NotFoundException(`Product link ${linkId} not found`);
    const link = linkRes.rows[0];

    const occRes = await pool.query(
      `SELECT a.channel_id, a.status AS auth_status,
              COALESCE(o.channel_name, a.channel_id) AS channel_name, o.hq_state
         FROM channel_product_authorization a
         LEFT JOIN channel_org o ON o.channel_id = a.channel_id
        WHERE a.product_id = $1 AND a.carrier_id = $2 AND a.deleted = FALSE
        ORDER BY channel_name`,
      [link.product_id, link.carrier_id]);
    if (occRes.rows.length > 0) {
      throw new ConflictException({
        message: 'Product is still authorized to channels; revoke channel authorizations before unlinking',
        occupied_channels: occRes.rows,
      });
    }

    await pool.query(
      'UPDATE cooperation_product SET deleted = TRUE, updated_at = NOW() WHERE link_id = $1', [linkId]);
    await this.audit.log({
      operator, action: 'PRODUCT_LINK_REMOVE', module: 'cooperation', targetType: 'cooperation_product',
      targetId: linkId, success: true,
      params: { partnership_id: coopId, product_id: link.product_id, carrier_id: link.carrier_id },
    });
    return { removed: true };
  }

  /**
   * 更新产品接入信息（备注 / 生效日，V1.0.16 F1）：仅允许更新本合作下未删除的关联。
   */
  async updateProductLink(coopId: string, linkId: string, dto: { remark?: string; effective_from?: string }, operator: AuditOperator) {
    const linkRes = await pool.query(
      'SELECT * FROM cooperation_product WHERE link_id = $1 AND partnership_id = $2 AND deleted = FALSE',
      [linkId, coopId]);
    if (!linkRes.rows.length) throw new NotFoundException(`Product link ${linkId} not found`);

    const sets: string[] = [];
    const vals: any[] = [];
    if (dto.remark !== undefined) {
      vals.push(dto.remark.trim().slice(0, 512) || null);
      sets.push(`remark = $${vals.length}`);
    }
    if (dto.effective_from !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.effective_from)) {
        throw new BadRequestException('effective_from must be YYYY-MM-DD');
      }
      vals.push(dto.effective_from);
      sets.push(`effective_from = $${vals.length}`);
    }
    if (!sets.length) throw new BadRequestException('Nothing to update');
    vals.push(linkId);
    const r = await pool.query(
      `UPDATE cooperation_product SET ${sets.join(', ')}, updated_at = NOW()
        WHERE link_id = $${vals.length} RETURNING *`, vals);

    await this.audit.log({
      operator, action: 'PRODUCT_LINK_UPDATE', module: 'cooperation', targetType: 'cooperation_product',
      targetId: linkId, success: true,
      params: { partnership_id: coopId, fields: Object.keys(dto) },
    });
    return r.rows[0];
  }
}
