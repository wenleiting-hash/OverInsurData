import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';
import { AuditService, AuditOperator } from '../../common/services/audit.service';
import {
  CreateChannelAuthorizationDto, UpdateChannelAuthorizationDto,
  SetAuthorizationStatusDto, UpsertIssuancePermissionDto,
} from './dtos/channel-auth.dto';

const EXPIRING_WINDOW_DAYS = 30;

function newId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export interface AuthRow extends Record<string, any> {}

@Injectable()
export class ChannelService {
  constructor(private readonly audit: AuditService) {}

  // ── Channel master (minimal, for authorization selectors) ──

  async getChannels(query: { status?: string; q?: string }) {
    const conds: string[] = ['deleted = FALSE']; const vals: any[] = []; let pi = 1;
    if (query.status && query.status !== 'all') { conds.push(`status = $${pi++}`); vals.push(query.status); }
    if (query.q && query.q.trim()) {
      conds.push(`(channel_name ILIKE $${pi} OR npn_code ILIKE $${pi} OR manager_name ILIKE $${pi})`);
      vals.push(`%${query.q.trim()}%`);
    }
    const res = await pool.query(
      `SELECT * FROM channel_org WHERE ${conds.join(' AND ')} ORDER BY channel_name`, vals);
    return res.rows;
  }

  // ── Authorization status derivation (read-time, mirrors contract decoration) ──

  private decorate(row: AuthRow): AuthRow {
    if (!row) return row;
    let effectiveStatus = row.status;
    if (row.status === 'active' && row.expiration_date) {
      const days = Math.ceil((new Date(row.expiration_date).getTime() - Date.now()) / 86400000);
      if (days < 0) effectiveStatus = 'expired';
      else if (days <= EXPIRING_WINDOW_DAYS) effectiveStatus = 'expiring';
    }
    return { ...row, effective_status: effectiveStatus };
  }

  private readonly LIST_SELECT = `
    SELECT a.*, o.channel_name,
           p.product_name, p.product_code, p.status AS product_status,
           c.carrier_name AS carrier_name, c.carrier_name_short AS carrier_short,
           pm.can_quote, pm.can_bind, pm.can_endorse, pm.can_renew,
           pm.can_surrender, pm.can_claim_report, pm.bind_mode,
           pm.limit_per_policy, pm.limit_monthly, pm.limit_quarterly, pm.over_limit_rule
      FROM channel_product_authorization a
      LEFT JOIN channel_org o ON o.channel_id = a.channel_id
      LEFT JOIN insurance_product p ON p.product_id = a.product_id
      LEFT JOIN insurance_carrier c ON c.carrier_id = a.carrier_id
      LEFT JOIN channel_issuance_permission pm ON pm.auth_id = a.auth_id AND pm.deleted = FALSE`;

  async listAuthorizations(query: {
    channelId?: string; carrierId?: string; productId?: string;
    status?: string; q?: string;
  }) {
    const conds: string[] = ['a.deleted = FALSE']; const vals: any[] = []; let pi = 1;
    if (query.channelId) { conds.push(`a.channel_id = $${pi++}`); vals.push(query.channelId); }
    if (query.carrierId && query.carrierId !== 'all') { conds.push(`a.carrier_id = $${pi++}`); vals.push(query.carrierId); }
    if (query.productId) { conds.push(`a.product_id = $${pi++}`); vals.push(query.productId); }
    if (query.status && query.status !== 'all') {
      // effective (derived) statuses
      if (query.status === 'active') {
        conds.push(`a.status = 'active' AND (a.expiration_date IS NULL OR a.expiration_date >= CURRENT_DATE - INTERVAL '${EXPIRING_WINDOW_DAYS} days')`);
      } else if (query.status === 'expiring') {
        conds.push(`a.status = 'active' AND a.expiration_date < CURRENT_DATE + INTERVAL '${EXPIRING_WINDOW_DAYS} days' AND a.expiration_date >= CURRENT_DATE`);
      } else if (query.status === 'expired') {
        conds.push(`a.status = 'active' AND a.expiration_date < CURRENT_DATE`);
      } else {
        conds.push(`a.status = $${pi++}`); vals.push(query.status);
      }
    }
    if (query.q && query.q.trim()) {
      conds.push(`(p.product_name ILIKE $${pi} OR o.channel_name ILIKE $${pi})`);
      vals.push(`%${query.q.trim()}%`);
    }
    const res = await pool.query(
      `${this.LIST_SELECT} WHERE ${conds.join(' AND ')} ORDER BY a.created_at DESC`, vals);
    return res.rows.map(r => this.decorate(r));
  }

  async getAuthorizationById(authId: string) {
    const res = await pool.query(`${this.LIST_SELECT} WHERE a.auth_id = $1 AND a.deleted = FALSE`, [authId]);
    if (!res.rows.length) throw new NotFoundException(`Authorization ${authId} not found`);
    return this.decorate(res.rows[0]);
  }

  /** Pre-conditions (doc 10.1 授权前置校验): channel onboarded + product listed; states within both catalogs. */
  private async validateGrantTargets(channelId: string, productId: string, states?: string[]) {
    const chRes = await pool.query(`SELECT * FROM channel_org WHERE channel_id = $1 AND deleted = FALSE`, [channelId]);
    if (!chRes.rows.length) throw new BadRequestException('Channel does not exist');
    const channel = chRes.rows[0];
    if (channel.status !== 'active') {
      throw new BadRequestException(`Channel must be onboarded and active (current: ${channel.status})`);
    }
    const pRes = await pool.query(`SELECT * FROM insurance_product WHERE product_id = $1`, [productId]);
    if (!pRes.rows.length) throw new BadRequestException('Product does not exist');
    const product = pRes.rows[0];
    if (product.status && product.status !== 'Active') {
      throw new BadRequestException(`Product is not listable (status: ${product.status})`);
    }
    const productStates: string[] = product.available_states ?? [];
    const licensed: string[] = channel.licensed_states ?? [];
    let targetStates = (states ?? []).map(s => String(s).toUpperCase()).filter(Boolean);
    if (!targetStates.length) {
      // Default: intersection of product sellable states and channel-licensed states.
      targetStates = productStates.filter((s: string) => licensed.includes(s));
    }
    if (!targetStates.length) {
      throw new BadRequestException('No authorized states: choose states within both product availability and channel license');
    }
    const notSellable = targetStates.filter(s => !productStates.includes(s));
    if (notSellable.length) throw new BadRequestException(`States not sellable for the product: ${notSellable.join(', ')}`);
    const notLicensed = targetStates.filter(s => !licensed.includes(s));
    if (notLicensed.length) throw new BadRequestException(`Channel is not licensed in: ${notLicensed.join(', ')}`);
    return { channel, product, targetStates };
  }

  async createAuthorization(dto: CreateChannelAuthorizationDto, operator: AuditOperator) {
    const { product, targetStates } = await this.validateGrantTargets(dto.channel_id, dto.product_id, dto.authorized_states);
    const grantType = dto.grant_type || 'permanent';
    if (grantType !== 'permanent' && !dto.expiration_date) {
      throw new BadRequestException('expiration_date is required for fixed/trial grants');
    }

    const authId = newId('cpa');
    try {
      await pool.query(
        `INSERT INTO channel_product_authorization
           (auth_id, channel_id, product_id, carrier_id, line_of_business,
            authorized_states, grant_type, effective_date, expiration_date,
            status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,'active',$10)`,
        [authId, dto.channel_id, dto.product_id, product.carrier_id, product.line_of_business ?? null,
         JSON.stringify(targetStates), grantType,
         dto.effective_date || null, dto.expiration_date || null,
         operator.username || operator.userId || null]);
    } catch (e: any) {
      if (e?.code === '23505') {
        throw new ConflictException('An active authorization already exists for this channel + product (revoke it before re-granting)');
      }
      throw e;
    }

    // Default issuance permission row (quote allowed, everything else off)
    await pool.query(
      `INSERT INTO channel_issuance_permission (permission_id, auth_id, created_at, updated_at)
       VALUES ($1,$2,NOW(),NOW())`,
      [newId('cip'), authId]);

    if (dto.permissions) {
      await this.upsertPermissionRows(authId, dto.permissions, operator);
    }

    await this.audit.log({
      operator, action: 'CHANNEL_AUTH_CREATE', module: 'channel',
      targetType: 'channel_authorization', targetId: authId, success: true,
      params: {
        channel_id: dto.channel_id, product_id: dto.product_id,
        states: targetStates, grant_type: grantType,
        expiration_date: dto.expiration_date ?? null,
      },
    });
    return this.getAuthorizationById(authId);
  }

  async updateAuthorization(authId: string, dto: UpdateChannelAuthorizationDto, operator: AuditOperator) {
    await this.getAuthorizationById(authId); // 404 guard
    const current = (await pool.query(
      `SELECT * FROM channel_product_authorization WHERE auth_id = $1 AND deleted = FALSE`, [authId])).rows[0];
    if (current.status !== 'active') {
      throw new BadRequestException('Only active authorizations can be edited (renew a revoked one first)');
    }
    let states = current.authorized_states ?? [];
    if (dto.authorized_states) {
      const { targetStates } = await this.validateGrantTargets(
        current.channel_id, current.product_id, dto.authorized_states);
      states = targetStates;
    }
    const grantType = dto.grant_type ?? current.grant_type;
    const expiration = dto.expiration_date === null ? null : (dto.expiration_date ?? current.expiration_date);
    if (grantType !== 'permanent' && !expiration) {
      throw new BadRequestException('expiration_date is required for fixed/trial grants');
    }
    await pool.query(
      `UPDATE channel_product_authorization
          SET authorized_states = $2, grant_type = $3, effective_date = COALESCE($4, effective_date),
              expiration_date = $5, updated_at = NOW()
        WHERE auth_id = $1`,
      [authId, JSON.stringify(states), grantType, dto.effective_date ?? null, expiration]);
    await this.audit.log({
      operator, action: 'CHANNEL_AUTH_UPDATE', module: 'channel',
      targetType: 'channel_authorization', targetId: authId, success: true,
      params: { states, grant_type: grantType, expiration_date: expiration },
    });
    return this.getAuthorizationById(authId);
  }

  async setAuthorizationStatus(authId: string, dto: SetAuthorizationStatusDto, operator: AuditOperator) {
    await this.getAuthorizationById(authId);
    if (dto.action === 'revoke') {
      await pool.query(
        `UPDATE channel_product_authorization
            SET status = 'revoked', revoked_at = NOW(), revoke_reason = $2, updated_at = NOW()
          WHERE auth_id = $1 AND status = 'active'`,
        [authId, dto.reason ?? null]);
      await this.audit.log({
        operator, action: 'CHANNEL_AUTH_REVOKE', module: 'channel',
        targetType: 'channel_authorization', targetId: authId, success: true,
        params: { reason: dto.reason ?? null },
      });
    } else {
      const exp = dto.expiration_date || null;
      await pool.query(
        `UPDATE channel_product_authorization
            SET status = 'active', revoked_at = NULL, revoke_reason = NULL,
                expiration_date = COALESCE($2, expiration_date + INTERVAL '365 days'),
                updated_at = NOW()
          WHERE auth_id = $1 AND status = 'revoked'`,
        [authId, exp]);
      await this.audit.log({
        operator, action: 'CHANNEL_AUTH_RENEW', module: 'channel',
        targetType: 'channel_authorization', targetId: authId, success: true,
        params: { expiration_date: exp ?? 'extended-365d' },
      });
    }
    return this.getAuthorizationById(authId);
  }

  private async upsertPermissionRows(authId: string, dto: UpsertIssuancePermissionDto, operator: AuditOperator) {
    const fields: [string, any][] = [
      ['can_quote', dto.can_quote], ['can_bind', dto.can_bind], ['can_endorse', dto.can_endorse],
      ['can_renew', dto.can_renew], ['can_surrender', dto.can_surrender],
      ['can_claim_report', dto.can_claim_report], ['bind_mode', dto.bind_mode],
      ['limit_per_policy', dto.limit_per_policy], ['limit_monthly', dto.limit_monthly],
      ['limit_quarterly', dto.limit_quarterly], ['over_limit_rule', dto.over_limit_rule],
    ].filter(([, v]) => v !== undefined) as [string, any][];
    if (!fields.length) return;
    const sets = fields.map((f, i) => `${f[0]} = $${i + 4}`);
    await pool.query(
      `INSERT INTO channel_issuance_permission (permission_id, auth_id, updated_by, created_at, updated_at)
       VALUES ($1,$2,$3,NOW(),NOW())
       ON CONFLICT (auth_id) DO UPDATE SET ${sets.join(', ')}, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [newId('cip'), authId, operator.username || operator.userId || null, ...fields.map(f => f[1])]);
  }

  async upsertPermission(authId: string, dto: UpsertIssuancePermissionDto, operator: AuditOperator) {
    await this.getAuthorizationById(authId);
    await this.upsertPermissionRows(authId, dto, operator);
    // forbid binding regardless of bind switch
    if (dto.bind_mode === 'forbidden') {
      await pool.query(
        `UPDATE channel_issuance_permission SET can_bind = FALSE, updated_at = NOW() WHERE auth_id = $1`,
        [authId]);
    }
    await this.audit.log({
      operator, action: 'CHANNEL_PERM_UPSERT', module: 'channel',
      targetType: 'channel_authorization', targetId: authId, success: true,
      params: { ...dto },
    });
    return this.getAuthorizationById(authId);
  }
}
