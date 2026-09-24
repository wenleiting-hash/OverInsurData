import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
  Logger,
} from '@nestjs/common';
import { pool } from '../../database/drizzle.client';
import { CryptoService } from '../../common/services/crypto.service';
import { AuditService } from '../../common/services/audit.service';
import { CreateIntegrationAppDto, UpdateIntegrationAppDto, ConsultationMatchDto } from './dtos/integration.dto';
import { DictionaryService } from '../dictionary/dictionary.service';
import { COVERAGE_ALIASES, FACTOR_ALIASES, normKeys, parseKeys } from '../dictionary/coverage-aliases';
import { randomBytes, randomUUID } from 'crypto';

// ── I3 保单咨询匹配：数据字典（对齐接口文档 V1.1 第 5.5 节）──────────────
/** 11 个险种 canonical key；另兼容一期旧值 AUTO/HOME/LIFE/HEALTH/SURETY/COMMERCIAL */
const LOB_CANONICAL = ['Auto', 'Home', 'Commercial', 'Cyber', 'Life', 'Travel', 'Professional', 'D&O', 'E&O', 'Marine', 'Specialty'];
const LOB_LEGACY = new Set(['AUTO', 'HOME', 'LIFE', 'HEALTH', 'SURETY', 'COMMERCIAL']);
/** 一期旧险种大写值 → canonical 险种（HEALTH 在新 11 险种中无对应，仅保留兼容查询） */
const LEGACY_LOB_CANONICAL: Record<string, string> = {
  AUTO: 'Auto', HOME: 'Home', LIFE: 'Life', COMMERCIAL: 'Commercial', SURETY: 'Specialty',
};

// V1.0.18：子险种联动字典与承保范围别名层迁移至 dictionary 模块
// （SUB_LINE_MAP 改读 DictionaryService 进程内缓存；COVERAGE_ALIASES/FACTOR_ALIASES
//   保留为只读兜底，见 modules/dictionary/coverage-aliases.ts）。

const US_STATE_CODES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]);

const numOrNull = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : Number(v));
const toDate = (v: unknown): Date | null => {
  if (!v) return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
};
const fmtDate = (v: unknown): string | null => {
  const d = toDate(v);
  return d ? d.toISOString().slice(0, 10) : null;
};

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(
    private readonly cryptoService: CryptoService,
    private readonly auditService: AuditService,
    private readonly dictionaryService: DictionaryService,
  ) {}

  /** 生成 appKey: 前缀 + 20 位随机 base62 */
  private generateAppKey(prefix = 'wkos'): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const buf = randomBytes(20);
    let s = '';
    for (let i = 0; i < 20; i++) s += chars[buf[i] % chars.length];
    return `${prefix}_${s}`;
  }

  /** 生成 appSecret: 32 位随机 base62 */
  private generateAppSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const buf = randomBytes(32);
    let s = '';
    for (let i = 0; i < 32; i++) s += chars[buf[i] % chars.length];
    return s;
  }

  /** 创建应用：返回明文 appKey + appSecret（仅一次） */
  async createApp(dto: CreateIntegrationAppDto, operator: string) {
    const appKey = this.generateAppKey();
    const appSecret = this.generateAppSecret();
    const appSecretEnc = this.cryptoService.encrypt(appSecret);

    const result = await pool.query(
      `INSERT INTO integration_app
         (app_key, app_secret_hash, app_name, app_desc, ip_whitelist, rate_limit, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING app_id, app_key, app_name, app_desc, status, ip_whitelist, rate_limit, created_at`,
      [appKey, appSecretEnc, dto.appName, dto.appDesc ?? null, dto.ipWhitelist ?? null, dto.rateLimit ?? 60, operator],
    );
    const row = result.rows[0];
    return {
      ...row,
      app_secret: appSecret, // 明文，仅本次返回
    };
  }

  /** 列表 */
  async listApps(page = 1, size = 20) {
    const offset = (page - 1) * size;
    const countResult = await pool.query(`SELECT count(*) FROM integration_app`);
    const total = parseInt(countResult.rows[0].count, 10);
    const result = await pool.query(
      `SELECT app_id, app_key, app_name, app_desc, status, ip_whitelist, rate_limit, created_by, created_at, updated_at, last_called_at
         FROM integration_app ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [size, offset],
    );
    return { items: result.rows, total, page, size };
  }

  /** 详情 */
  async getApp(appId: string) {
    const result = await pool.query(
      `SELECT app_id, app_key, app_name, app_desc, status, ip_whitelist, rate_limit, created_by, created_at, updated_at, last_called_at
         FROM integration_app WHERE app_id = $1`,
      [appId],
    );
    if (result.rows.length === 0) throw new NotFoundException('应用不存在');
    return result.rows[0];
  }

  /** 更新 */
  async updateApp(appId: string, dto: UpdateIntegrationAppDto) {
    await this.getApp(appId);
    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(dto)) {
      if (v === undefined) continue;
      const col = k.replace(/([A-Z])/g, '_$1').toLowerCase();
      sets.push(`${col} = $${i}`);
      values.push(v);
      i++;
    }
    if (sets.length === 0) return this.getApp(appId);
    sets.push(`updated_at = NOW()`);
    values.push(appId);
    const result = await pool.query(
      `UPDATE integration_app SET ${sets.join(', ')} WHERE app_id = $${i} RETURNING app_id, app_key, app_name, app_desc, status, ip_whitelist, rate_limit, created_at, updated_at`,
      values,
    );
    return result.rows[0];
  }

  /** 重置密钥：简单模式，新密钥立即生效，旧密钥失效 */
  async resetSecret(appId: string, operator: string) {
    await this.getApp(appId);
    const appSecret = this.generateAppSecret();
    const appSecretEnc = this.cryptoService.encrypt(appSecret);
    const result = await pool.query(
      `UPDATE integration_app SET app_secret_hash = $1, updated_at = NOW() WHERE app_id = $2
         RETURNING app_id, app_key, app_name, updated_at`,
      [appSecretEnc, appId],
    );
    return { ...result.rows[0], app_secret: appSecret, reset_by: operator };
  }

  /**
   * 查看明文 appSecret（V1.0.16：补"后续可复制"能力）
   * - 仅返回明文，不改库
   * - 调用方需记录审计日志（INTEGRATION_APP_SECRET_VIEW）
   * - 限已配置 JwtAuthGuard 的管理路由使用，不可对外暴露
   */
  async revealSecret(appId: string) {
    const result = await pool.query(
      `SELECT app_id, app_key, app_name, app_secret_hash, status FROM integration_app WHERE app_id = $1`,
      [appId],
    );
    if (result.rows.length === 0) throw new NotFoundException('应用不存在');
    const row = result.rows[0];
    const plainSecret = this.cryptoService.decrypt(row.app_secret_hash);
    return {
      app_id: row.app_id,
      app_key: row.app_key,
      app_name: row.app_name,
      status: row.status,
      app_secret: plainSecret,
    };
  }

  /** 删除 */
  async deleteApp(appId: string) {
    const result = await pool.query(`DELETE FROM integration_app WHERE app_id = $1 RETURNING app_id`, [appId]);
    if (result.rows.length === 0) throw new NotFoundException('应用不存在');
    return { success: true };
  }

  /** 根据 appKey 查询（鉴权守卫用，含加密的 secret） */
  async getAppByKey(appKey: string) {
    const result = await pool.query(
      `SELECT app_id, app_key, app_secret_hash, app_name, status, ip_whitelist, rate_limit
         FROM integration_app WHERE app_key = $1`,
      [appKey],
    );
    return result.rows[0] || null;
  }

  /** 解密 appSecret（鉴权守卫计算 HMAC 用） */
  decryptAppSecret(encrypted: string): string {
    return this.cryptoService.decrypt(encrypted);
  }

  /** 记录 nonce（防重放），返回 false 表示已存在 */
  async recordNonce(nonce: string, appKey: string, ttlSeconds = 600): Promise<boolean> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    try {
      await pool.query(
        `INSERT INTO integration_nonce (nonce, app_key, expires_at) VALUES ($1, $2, $3)`,
        [nonce, appKey, expiresAt],
      );
      return true;
    } catch {
      return false;
    }
  }

  /** 更新最后调用时间 */
  async touchLastCalled(appKey: string) {
    await pool.query(`UPDATE integration_app SET last_called_at = NOW() WHERE app_key = $1`, [appKey]);
  }

  /** 清理过期 nonce（可定时调用） */
  async cleanupExpiredNonces() {
    await pool.query(`DELETE FROM integration_nonce WHERE expires_at < NOW()`);
  }

  // ─────────────────────────────────────────────────────────────
  //  I1 / I2 / I3 业务接口（V1.0.16 T3+T4+T5）
  // ─────────────────────────────────────────────────────────────

  /**
   * I1: 权限目录
   * 按 subsystem_key 分组聚合 auth_role。
   * 输出：{ version, generated_at, subsystems: [{ subsystem_key, roles: [...] }] }
   */
  async getPermissionCatalog() {
    const result = await pool.query(
      `SELECT role_key, role_name_zh, role_name_en, description, permission_keys, subsystem_key
         FROM auth_role
         WHERE deleted = FALSE
         ORDER BY subsystem_key, sort_order`,
    );

    const bySubsystem = new Map<string, any[]>();
    for (const row of result.rows) {
      const key: string = row.subsystem_key;
      if (!bySubsystem.has(key)) bySubsystem.set(key, []);
      bySubsystem.get(key)!.push({
        role_key: row.role_key,
        name_zh: row.role_name_zh,
        name_en: row.role_name_en,
        description_zh: row.description,
        description_en: row.description,
        permissions: Array.isArray(row.permission_keys) ? row.permission_keys : [],
      });
    }

    return {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      subsystems: Array.from(bySubsystem.entries()).map(([subsystem_key, roles]) => ({
        subsystem_key,
        roles,
      })),
    };
  }

  /**
   * I4: 险种字典快照（V1.0.18）
   * 结构同管理端 coverage-tree（version + lines + allCoverages），额外含 catalogVersion。
   * 供联调模拟器与外部调用方做前置校验；字典写操作后由 DictionaryService 缓存失效自然更新。
   */
  async getCatalogSnapshot() {
    const snap = await this.dictionaryService.getSnapshot();
    const tree = await this.dictionaryService.getTree();
    return {
      catalogVersion: snap.version,
      version: tree.version,
      lines: tree.lines,
      allCoverages: tree.allCoverages,
    };
  }

  /**
   * I2: 用户/角色同步 upsert by external_id
   * 事务内完成：角色校验 → 本地账号冲突保护 → SSO 账号冲突保护 → 部门名→code → upsert → 角色整体替换
   */
  async upsertUser(dto: any, appKey: string, operatorId?: string) {
    const client = await pool.connect();
    let syncAction = 'updated';
    let userUuid = '';
    try {
      await client.query('BEGIN');

      // 1. 校验 roles: (role_key, subsystem_key) 二元组
      const requestedRoles: Array<{ subsystem_key: string; role_key: string }> =
        Array.isArray(dto.roles) ? dto.roles : [];
      if (requestedRoles.length === 0) {
        throw new BadRequestException({ code: 'UNKNOWN_ROLE', invalid_roles: [] });
      }
      const roleInClause = requestedRoles
        .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
        .join(', ');
      const roleParams = requestedRoles.flatMap(r => [r.role_key, r.subsystem_key]);
      const roleResult = await client.query(
        `SELECT role_key, subsystem_key FROM auth_role
           WHERE (role_key, subsystem_key) IN (${roleInClause})
             AND deleted = FALSE`,
        roleParams,
      );
      const foundRoles = new Set(
        roleResult.rows.map((r: any) => `${r.role_key}|${r.subsystem_key}`),
      );
      const invalidRoles = requestedRoles.filter(
        r => !foundRoles.has(`${r.role_key}|${r.subsystem_key}`),
      );
      if (invalidRoles.length > 0) {
        throw new BadRequestException({ code: 'UNKNOWN_ROLE', invalid_roles: invalidRoles });
      }

      // 2a. 本地账号冲突保护（username/email 命中 local 账号）
      const localConflict = await client.query(
        `SELECT id FROM auth_user
           WHERE (username = $1 OR email = $2)
             AND auth_method = 'local' AND deleted = FALSE`,
        [dto.username, dto.email],
      );
      if (localConflict.rows.length > 0) {
        throw new ConflictException({ code: 'USER_CONFLICT_LOCAL' });
      }
      // 2b. SSO 账号间冲突：同 username/email 但不同 external_id
      const ssoConflict = await client.query(
        `SELECT id FROM auth_user
           WHERE (username = $1 OR email = $2)
             AND auth_method = 'sso' AND sso_provider = 'workos'
             AND external_id <> $3 AND deleted = FALSE`,
        [dto.username, dto.email, dto.external_id],
      );
      if (ssoConflict.rows.length > 0) {
        throw new ConflictException({ code: 'USERNAME_OR_EMAIL_EXISTS' });
      }

      // 3. department 名 → dept_code
      let deptCode: string | null = null;
      if (dto.department) {
        const deptResult = await client.query(
          `SELECT dept_code FROM auth_department
             WHERE (dept_name_zh = $1 OR dept_name_en = $1)
               AND deleted = FALSE
             LIMIT 1`,
          [dto.department],
        );
        if (deptResult.rows.length > 0) deptCode = deptResult.rows[0].dept_code;
      }

      // 4. upsert by external_id + sso_provider=workos
      const status = dto.status === 'disabled' ? 'inactive' : 'active';
      const existing = await client.query(
        `SELECT id, user_uuid FROM auth_user
           WHERE external_id = $1 AND sso_provider = 'workos' AND deleted = FALSE`,
        [dto.external_id],
      );
      let userId: number;
      if (existing.rows.length > 0) {
        const r = existing.rows[0];
        userId = r.id;
        userUuid = r.user_uuid;
        await client.query(
          `UPDATE auth_user
             SET name_zh = $1, name_en = $2, email = $3, dept_code = $4,
                 status = $5, updated_at = NOW()
           WHERE id = $6`,
          [
            dto.name_zh ?? null,
            dto.name_en ?? null,
            dto.email,
            deptCode,
            status,
            userId,
          ],
        );
        syncAction = 'updated';
      } else {
        userUuid = randomUUID();
        const insertResult = await client.query(
          `INSERT INTO auth_user
             (user_uuid, username, email, password_hash, name_zh, name_en,
              dept_code, auth_method, sso_provider, external_id, status)
           VALUES ($1, $2, $3, NULL, $4, $5, $6, 'sso', 'workos', $7, $8)
           RETURNING id`,
          [
            userUuid,
            dto.username,
            dto.email,
            dto.name_zh ?? null,
            dto.name_en ?? null,
            deptCode,
            dto.external_id,
            status,
          ],
        );
        userId = insertResult.rows[0].id;
        syncAction = 'created';
      }

      // 5. 角色整体替换（用已校验过的二元组重新查 role_id）
      await client.query(`DELETE FROM auth_user_role WHERE user_id = $1`, [userId]);
      const inClause = requestedRoles
        .map((_, i) => `($${i * 2 + 3}, $${i * 2 + 4})`)
        .join(', ');
      await client.query(
        `INSERT INTO auth_user_role (user_id, role_id, assigned_by, assigned_at)
           SELECT $1, role_id, $2, NOW()
           FROM auth_role
           WHERE (role_key, subsystem_key) IN (${inClause})`,
        [userId, appKey, ...requestedRoles.flatMap(r => [r.role_key, r.subsystem_key])],
      );

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    // 7. 审计（不阻塞主链路）
    this.auditService
      .log({
        operator: { userId: appKey, username: operatorId ?? undefined },
        action: 'INTEGRATION_USER_UPSERT',
        module: 'integration',
        targetType: 'user',
        targetId: dto.external_id,
        success: true,
        params: {
          external_id: dto.external_id,
          username: dto.username,
          email: dto.email,
          roles: dto.roles,
          status: dto.status,
          sync_action: syncAction,
        },
      })
      .catch(err => {
        this.logger.warn(`upsertUser audit failed: ${(err as Error).message}`);
      });

    return {
      external_id: dto.external_id,
      user_uuid: userUuid,
      sync_action: syncAction,
    };
  }

  /**
   * I3: 保单咨询匹配（V1.1，对齐接口文档第 5 节）
   * 必填策略：仅 line_of_business + state（L1）；其余维度可选，缺失＝不限制，风险字段缺失＝unknown。
   * 流程：基础资格 SQL 候选（合作 Signed/Active + 在售 + 险种 + 可选 code/keyword）
   *       → JS 逐维度评估九维度 + risk_profile，收集未命中原因码
   *       → 输出 insurers/products（含 evaluation）/underwriting_points/rejected_products。
   */
  async matchConsultation(dto: ConsultationMatchDto, appKey: string) {
    const start = Date.now();

    // ── L1 必填基础条件 + 归一化 ──────────────────────────
    const lobUpper = String(dto.line_of_business || '').trim().toUpperCase();
    const canonicalByUpper = new Map(LOB_CANONICAL.map(l => [l.toUpperCase(), l]));
    const canonicalLob = canonicalByUpper.get(lobUpper) ?? LEGACY_LOB_CANONICAL[lobUpper] ?? null;
    if (!canonicalLob && !LOB_LEGACY.has(lobUpper)) {
      throw new BadRequestException({ code: 'INVALID_LINE_OF_BUSINESS' });
    }
    const lobMatch = canonicalLob ? canonicalLob.toUpperCase() : lobUpper;

    const state = String(dto.state || '').trim().toUpperCase();
    if (!US_STATE_CODES.has(state)) {
      throw new BadRequestException({ code: 'INVALID_STATE' });
    }

    // ② 子险种必须属于所选险种（联动字典缓存；旧险种 HEALTH 无字典时跳过，交由产品匹配）
    const subLineInput = dto.sub_line?.trim();
    const dict = await this.dictionaryService.getSnapshot();
    const subLineDict = canonicalLob ? dict.subLineMap[canonicalLob] ?? null : null;
    if (subLineInput && subLineDict
      && !subLineDict.some(s => s.toLowerCase() === subLineInput.toLowerCase())) {
      throw new BadRequestException({
        code: 'INVALID_SUB_LINE_FOR_LOB',
        line_of_business: canonicalLob,
        sub_line: subLineInput,
        allowed_sub_lines: subLineDict,
      });
    }

    if (dto.product_code && dto.keyword) {
      throw new BadRequestException({ code: 'PRODUCT_CODE_AND_KEYWORD_MUTEX' });
    }
    if (dto.target_premium != null && dto.premium_budget) {
      throw new BadRequestException({ code: 'TARGET_BUDGET_MUTEX' });
    }
    const budget = dto.premium_budget;
    if (budget && budget.min != null && budget.max != null && Number(budget.min) > Number(budget.max)) {
      throw new BadRequestException({ code: 'INVALID_PREMIUM_RANGE' });
    }

    // ── 枚举数组校验（大小写不敏感）──────────────────────
    const checkEnumArray = (vals: string[] | undefined, allowed: Set<string>, code: string) => {
      if (!vals) return;
      for (const v of vals) {
        if (!allowed.has(String(v).trim().toUpperCase())) {
          throw new BadRequestException({ code, invalid: v });
        }
      }
    };
    checkEnumArray(dto.product_types, new Set(['INDIVIDUAL', 'GROUP', 'VOLUNTARYBENEFITS']), 'INVALID_PRODUCT_TYPE');
    checkEnumArray(dto.underwriting_modes, new Set(['AUTO', 'MANUAL', 'MGA']), 'INVALID_UW_MODE');
    checkEnumArray(dto.rate_types, new Set(['FLAT', 'TIERED', 'USAGEBASED']), 'INVALID_RATE_TYPE');
    checkEnumArray(dto.renewal_types, new Set(['GUARANTEED', 'CONDITIONAL', 'NONRENEWABLE']), 'INVALID_RENEWAL_TYPE');
    if (dto.policy_term_years != null && dto.policy_term_years > 100) {
      throw new BadRequestException({ code: 'INVALID_POLICY_TERM' });
    }

    const risk = dto.risk_profile ?? {};
    if (risk.credit_status && !['good', 'fair', 'poor'].includes(risk.credit_status)) {
      throw new BadRequestException({ code: 'INVALID_RISK_PROFILE', field: 'credit_status' });
    }
    if (risk.vehicle_usage && !['personal', 'business', 'rideshare'].includes(risk.vehicle_usage)) {
      throw new BadRequestException({ code: 'INVALID_RISK_PROFILE', field: 'vehicle_usage' });
    }

    // 拟保生效日（不传＝今天）
    let effectiveDate: Date;
    if (dto.policy_effective_date) {
      const d = dto.policy_effective_date;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || isNaN(new Date(`${d}T00:00:00Z`).getTime())) {
        throw new BadRequestException({ code: 'INVALID_POLICY_EFFECTIVE_DATE' });
      }
      effectiveDate = new Date(`${d}T00:00:00Z`);
    } else {
      effectiveDate = new Date();
      effectiveDate.setUTCHours(0, 0, 0, 0);
    }

    // ── 承保范围/费率因子：校验 + 归一化（AND 语义）──────
    const needCoverages = parseKeys(dto.coverages, COVERAGE_ALIASES, 'INVALID_COVERAGES');
    const needFactors = parseKeys(dto.rate_factors, FACTOR_ALIASES, 'INVALID_RATE_FACTORS');

    // V1.0.18：业务线适用性校验（字典关联驱动）。
    // lineCoverageMap 无该线键 = 未配置关联 → 跳过线级校验；有键（含空数组）→ 严格校验。
    if (canonicalLob && needCoverages.length > 0 && Array.isArray(dict.lineCoverageMap[canonicalLob])) {
      const allowedCov = dict.lineCoverageMap[canonicalLob];
      const invalidCoverages = needCoverages.filter(k => !allowedCov.includes(k));
      if (invalidCoverages.length > 0) {
        throw new BadRequestException({
          code: 'INVALID_COVERAGES_FOR_LOB',
          line_of_business: canonicalLob,
          invalid_coverages: invalidCoverages,
          allowed_coverages: allowedCov,
        });
      }
    }

    // 预解析其余可选条件
    const needTypes = dto.product_types?.map(s => s.trim().toUpperCase()) ?? null;
    const needSubLine = dto.sub_line?.trim().toLowerCase() ?? null;
    const needModes = dto.underwriting_modes?.map(s => s.trim().toUpperCase()) ?? null;
    const needRateTypes = dto.rate_types?.map(s => s.trim().toUpperCase()) ?? null;
    const needRenewals = dto.renewal_types?.map(s => s.trim().toUpperCase()) ?? null;
    const needTermYears = dto.policy_term_years ?? null;
    const wantInstant = dto.instant_decision_required === true;
    const hasPremium = dto.target_premium != null || !!budget;
    const includeRejected = dto.include_rejected === true;

    // ── 候选拉取：仅基础资格（合作/在售/险种），其余维度在 JS 中评估以产出未命中原因 ──
    const params: any[] = [lobMatch, state];
    let codeWhere = '';
    if (dto.product_code) {
      codeWhere += ` AND p.product_code = $${params.length + 1}`;
      params.push(dto.product_code);
    }
    if (dto.keyword) {
      const idx = params.length + 1;
      codeWhere += ` AND (p.product_name ILIKE $${idx} OR p.short_name ILIKE $${idx})`;
      params.push(`%${dto.keyword}%`);
    }

    const result = await pool.query(
      `SELECT
         c.carrier_id, c.naic_code, c.carrier_name, c.carrier_name_short,
         c.website, c.carrier_type AS admitted, c.am_best_rating AS rating,
         c.coop_status, c.contract_expiry, c.lines,
         p.product_id, p.product_code, p.product_name, p.short_name,
         p.available_states, p.effective_date, p.expiration_date, p.product_type,
         p.line_of_business, p.sub_line, p.coverages,
         p.underwriting_mode, p.max_policy_limit, p.rate_type, p.base_rate,
         p.min_premium, p.max_premium, p.rate_factors,
         p.age_min, p.age_max, p.exclude_dui, p.refer_high_value, p.refer_threshold,
         p.blacklist_conditions, p.renewal_type, p.policy_term_years, p.status,
         p.description, p.description_en,
         pt.status AS partnership_status, pt.notes, pt.notes_en,
         ps.status AS state_sale_status
       FROM insurance_product p
       JOIN insurance_carrier c ON c.carrier_id = p.carrier_id AND c.deleted = FALSE
       JOIN carrier_partnership pt
         ON pt.carrier_id = c.carrier_id AND pt.status IN ('Signed', 'Active') AND pt.deleted = FALSE
       LEFT JOIN product_state ps
         ON ps.product_id = p.product_id AND ps.state_code = $2
       WHERE p.deleted = FALSE
         AND c.coop_status = 'active' AND (c.contract_expiry >= CURRENT_DATE OR c.contract_expiry IS NULL)
         AND p.is_active = TRUE AND p.status = 'Active'
         AND UPPER(p.line_of_business) = $1
         ${codeWhere}`,
      params,
    );

    const lang = String(dto.lang || '');
    const pickZh = (zh: any, _en: any) => zh;
    const pickEn = (_zh: any, en: any) => en ?? _zh;
    const pickField = lang === 'zh-CN' ? pickZh : lang === 'en-US' ? pickEn : (zh: any, en: any) => (en ?? zh);

    const insurerMap = new Map<string, any>();
    const products: any[] = [];
    const underwritingPoints: any[] = [];
    const rejectedProducts: any[] = [];

    /** 对单个候选产品逐维度评估，返回未命中原因 + evaluation */
    const evaluate = (row: any) => {
      const reasons: { code: string; detail: string }[] = [];
      const addReason = (code: string, detail = '') => {
        if (!reasons.some(r => r.code === code)) reasons.push({ code, detail });
      };

      // ⑧ 可售州：available_states 为准，product_state.suspended 为额外硬拦截
      const states: string[] = Array.isArray(row.available_states) ? row.available_states : [];
      if (!states.map(s => String(s).toUpperCase()).includes(state)) {
        addReason('STATE_NOT_AVAILABLE', `${state} not in available_states`);
      }
      if (row.state_sale_status === 'suspended') {
        addReason('STATE_SUSPENDED', `${state} is suspended`);
      }

      // 产品有效期（以拟保生效日判断）
      const eff = toDate(row.effective_date);
      const exp = toDate(row.expiration_date);
      if ((eff && eff > effectiveDate) || (exp && exp < effectiveDate)) {
        addReason('PRODUCT_EXPIRED', `policy date ${effectiveDate.toISOString().slice(0, 10)} outside product validity`);
      }

      // ① 产品类型
      if (needTypes && (!row.product_type || !needTypes.includes(String(row.product_type).toUpperCase()))) {
        addReason('PRODUCT_TYPE_MISMATCH', row.product_type ?? 'null');
      }
      // ② 子险种
      if (needSubLine && String(row.sub_line ?? '').trim().toLowerCase() !== needSubLine) {
        addReason('SUB_LINE_MISMATCH', row.sub_line ?? 'null');
      }
      // ③ 承保范围（AND）
      const pCov = normKeys(row.coverages, COVERAGE_ALIASES);
      const missingCov = needCoverages.filter(k => !pCov.includes(k));
      if (missingCov.length) addReason('COVERAGE_MISSING', missingCov.join(','));
      // ④ 费率因子（AND：产品因子集合须覆盖传入集合）
      const pFac = normKeys(row.rate_factors, FACTOR_ALIASES);
      const missingFac = needFactors.filter(k => !pFac.includes(k));
      if (missingFac.length) addReason('RATE_FACTOR_UNSUPPORTED', missingFac.join(','));

      // ⑥ 核保模式
      const mode = String(row.underwriting_mode ?? '').trim();
      const modeUpper = mode.toUpperCase();
      const manualUw = modeUpper === 'MANUAL' || modeUpper === 'MGA';
      if (needModes && !needModes.includes(modeUpper)) addReason('UW_MODE_MISMATCH', mode || 'null');
      // 费率模式
      const rateType = String(row.rate_type ?? '').trim().toUpperCase();
      if (needRateTypes && !needRateTypes.includes(rateType)) addReason('RATE_TYPE_MISMATCH', row.rate_type ?? 'null');
      // 续保类型
      const renewal = String(row.renewal_type ?? '').trim().toUpperCase();
      if (needRenewals && !needRenewals.includes(renewal)) addReason('RENEWAL_TYPE_MISMATCH', row.renewal_type ?? 'null');
      // 最长保险期间：产品允许的最长期间（policy_term_years）须 ≥ 客户期望期间
      let termSufficient: boolean | null = null;
      if (needTermYears !== null) {
        const maxTerm = row.policy_term_years != null ? Number(row.policy_term_years) : null;
        termSufficient = maxTerm !== null && maxTerm >= needTermYears;
        if (!termSufficient) addReason('POLICY_TERM_TOO_LONG', `need ${needTermYears}y, product max ${maxTerm}y`);
      }

      // ⑨ 保费区间
      let premiumInRange: boolean | null = null;
      if (dto.target_premium != null) {
        const minP = numOrNull(row.min_premium);
        const maxP = numOrNull(row.max_premium);
        premiumInRange = (minP === null || dto.target_premium >= minP) && (maxP === null || dto.target_premium <= maxP);
        if (!premiumInRange) addReason('PREMIUM_OUT_OF_RANGE', `target ${dto.target_premium} not in [${minP}, ${maxP}]`);
      } else if (budget) {
        const minP = numOrNull(row.min_premium);
        const maxP = numOrNull(row.max_premium);
        const bMin = budget.min != null ? Number(budget.min) : null;
        const bMax = budget.max != null ? Number(budget.max) : null;
        premiumInRange = (maxP === null || bMin === null || bMin <= maxP) && (minP === null || bMax === null || bMax >= minP);
        if (!premiumInRange) addReason('PREMIUM_OUT_OF_RANGE', `budget [${bMin}, ${bMax}] vs product [${minP}, ${maxP}]`);
      }

      // ⑥ 最高保额
      let limitSufficient: boolean | null = null;
      if (dto.required_policy_limit != null) {
        const maxLimit = numOrNull(row.max_policy_limit);
        limitSufficient = maxLimit === null || maxLimit >= dto.required_policy_limit;
        if (!limitSufficient) addReason('POLICY_LIMIT_EXCEEDED', `need ${dto.required_policy_limit}, product max ${maxLimit}`);
      }

      // ⑤ 年龄范围
      if (risk.age != null) {
        const ageMin = row.age_min != null ? Number(row.age_min) : null;
        const ageMax = row.age_max != null ? Number(row.age_max) : null;
        if ((ageMin !== null && risk.age < ageMin) || (ageMax !== null && risk.age > ageMax)) {
          addReason('AGE_OUT_OF_RANGE', `age ${risk.age} outside [${ageMin}, ${ageMax}]`);
        }
      }
      // ⑦ DUI / 黑名单（硬排除）
      if (risk.dui_history === true && row.exclude_dui === true) addReason('DUI_EXCLUDED');
      const bl: string[] = Array.isArray(row.blacklist_conditions) ? row.blacklist_conditions.map((b: unknown) => String(b).toLowerCase()) : [];
      if (risk.credit_status === 'poor' && bl.includes('poorcredit')) addReason('CREDIT_BLACKLISTED');
      if (risk.fraud_history === true && bl.includes('fraudhistory')) addReason('FRAUD_BLACKLISTED');
      if (risk.misrepresentation_history === true && bl.includes('mispresentation')) addReason('MISREPRESENTATION_BLACKLISTED');

      // 高价值标的转人工（软标记；instant_decision_required=true 时升级硬排除）
      const valueKnown = risk.vehicle_value != null;
      const referral = row.refer_high_value === true
        && row.refer_threshold != null
        && valueKnown
        && Number(risk.vehicle_value) > Number(row.refer_threshold);
      if (wantInstant && manualUw) addReason('UW_MODE_MISMATCH', 'instant decision requires Auto mode');
      if (wantInstant && referral) addReason('INSTANT_DECISION_UNAVAILABLE', 'high value referral required');

      // 未提供 vehicle_value 时可即时性不可判定 → null（unknown，不得当作符合）
      const instantDecision = modeUpper !== 'AUTO' ? false : (valueKnown ? !referral : null);

      return {
        reasons,
        evaluation: {
          eligible: reasons.length === 0,
          manual_underwriting: manualUw,
          instant_decision: instantDecision,
          referral_required: valueKnown ? referral : null,
          referral_reasons: referral ? ['high_value_referral'] : [],
          premium_in_range: premiumInRange,
          limit_sufficient: limitSufficient,
          term_sufficient: termSufficient,
        },
      };
    };

    /** 组装产品响应对象（全九维度） */
    const buildProduct = (row: any, evaluation: any) => ({
      product_id: row.product_id,
      product_code: row.product_code,
      product_name: pickField(row.product_name, row.short_name || row.product_name),
      short_name: row.short_name ?? null,
      carrier_id: row.carrier_id,
      product_type: row.product_type ?? null,
      line_of_business: row.line_of_business,
      sub_line: row.sub_line ?? null,
      coverages: normKeys(row.coverages, COVERAGE_ALIASES),
      rate_type: row.rate_type ?? null,
      rate_factors: normKeys(row.rate_factors, FACTOR_ALIASES),
      base_rate: numOrNull(row.base_rate),
      min_premium: numOrNull(row.min_premium),
      max_premium: numOrNull(row.max_premium),
      currency: 'USD',
      age_min: row.age_min ?? null,
      age_max: row.age_max ?? null,
      underwriting_mode: row.underwriting_mode ?? null,
      max_policy_limit: numOrNull(row.max_policy_limit),
      exclude_dui: row.exclude_dui === true,
      refer_high_value: row.refer_high_value === true,
      refer_threshold: numOrNull(row.refer_threshold),
      blacklist_conditions: Array.isArray(row.blacklist_conditions) ? row.blacklist_conditions : [],
      renewal_type: row.renewal_type ?? null,
      policy_term_years: row.policy_term_years ?? null,
      available_states: Array.isArray(row.available_states) ? row.available_states : [],
      effective_date: fmtDate(row.effective_date),
      expiration_date: fmtDate(row.expiration_date),
      status: row.status,
      partnership_status: row.partnership_status,
      notes: pickField(row.notes, row.notes_en),
      evaluation,
    });

    for (const row of result.rows) {
      const { reasons, evaluation } = evaluate(row);

      if (reasons.length === 0) {
        if (!insurerMap.has(row.carrier_id)) {
          insurerMap.set(row.carrier_id, {
            carrier_id: row.carrier_id,
            naic_code: row.naic_code,
            carrier_name: row.carrier_name_short || row.carrier_name,
            carrier_name_short: row.carrier_name_short,
            website: row.website,
            admitted: row.admitted,
            rating: row.rating,
            coop_status: row.coop_status,
            partnership_status: row.partnership_status,
            contract_expiry: row.contract_expiry ? new Date(row.contract_expiry).toISOString().slice(0, 10) : null,
            lines: row.lines,
          });
        }
        products.push(buildProduct(row, evaluation));

        // 机器可读核保要点（保留 V1.0 输出格式）
        const points: string[] = [];
        if (row.underwriting_mode) points.push(`underwriting_mode=${row.underwriting_mode}`);
        if (row.max_policy_limit) points.push(`max_policy_limit=${row.max_policy_limit}`);
        if (row.age_min != null || row.age_max != null) points.push(`age=${row.age_min ?? ''}-${row.age_max ?? ''}`);
        if (row.exclude_dui) points.push('exclude_dui=true');
        if (row.refer_high_value) points.push(`refer_high_value@${row.refer_threshold ?? ''}`);
        if (Array.isArray(row.blacklist_conditions) && row.blacklist_conditions.length > 0) {
          points.push(`blacklist=${row.blacklist_conditions.join(',')}`);
        }
        if (points.length === 0) {
          const fallbackDesc = pickField(row.description, row.description_en);
          if (fallbackDesc) points.push(String(fallbackDesc));
        }
        if (points.length > 0) {
          underwritingPoints.push({ product_id: row.product_id, product_code: row.product_code, points });
        }
      } else if (includeRejected) {
        rejectedProducts.push({
          product_id: row.product_id,
          product_code: row.product_code,
          product_name: pickField(row.product_name, row.short_name || row.product_name),
          carrier_id: row.carrier_id,
          reject_reasons: reasons,
        });
      }
    }

    // 指定 product_code 时的 404 语义
    if (dto.product_code && products.length === 0 && (!includeRejected || rejectedProducts.length === 0)) {
      const exists = await pool.query(
        `SELECT 1 FROM insurance_product WHERE product_code = $1 LIMIT 1`,
        [dto.product_code],
      );
      throw new NotFoundException({
        code: exists.rowCount ? 'PRODUCT_NOT_AUTHORIZED' : 'PRODUCT_NOT_FOUND',
      });
    }

    // 归一化过滤条件回显（仅回显传入项）
    const queryEcho: Record<string, unknown> = {
      line_of_business: lobMatch,
      state,
    };
    for (const k of [
      'product_types', 'sub_line', 'coverages', 'rate_factors', 'underwriting_modes', 'rate_types',
      'renewal_types', 'policy_term_years', 'target_premium', 'premium_budget', 'required_policy_limit',
      'policy_effective_date', 'instant_decision_required', 'risk_profile', 'product_code', 'keyword', 'lang',
    ] as const) {
      if (dto[k] !== undefined && dto[k] !== null) queryEcho[k] = dto[k];
    }
    if (needCoverages.length) queryEcho.coverages = needCoverages;
    if (needFactors.length) queryEcho.rate_factors = needFactors;

    const durationMs = Date.now() - start;
    this.auditService
      .log({
        operator: { userId: appKey },
        action: 'INTEGRATION_CONSULTATION_MATCH',
        module: 'integration',
        targetType: 'consultation',
        targetId: null,
        success: true,
        params: { ...dto, hit_count: products.length, rejected_count: rejectedProducts.length, duration_ms: durationMs },
      })
      .catch(err => {
        this.logger.warn(`matchConsultation audit failed: ${(err as Error).message}`);
      });

    return {
      query: queryEcho,
      match_summary: {
        carrier_count: insurerMap.size,
        product_count: products.length,
        rejected_count: rejectedProducts.length,
      },
      insurers: Array.from(insurerMap.values()),
      products,
      underwriting_points: underwritingPoints,
      rejected_products: rejectedProducts,
    };
  }
}
