import { Injectable, Logger } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';

/** Operator context attached to every audited mutation. */
export interface AuditOperator {
  userId?: string | null;
  username?: string | null;
}

export interface AuditLogInput {
  operator?: AuditOperator | null;
  /** Stable action code, e.g. COOP_TERMINATE / CONTRACT_STATUS. */
  action: string;
  /** Business module, e.g. 'cooperation' / 'product'. */
  module: string;
  targetType?: string | null;
  targetId?: string | null;
  success: boolean;
  /** Business parameters describing the change (stored as request_params text). */
  params?: Record<string, unknown> | null;
}

/**
 * Shared writer for auth_operation_log.
 *
 * Hard-won constraints (V1.0.10):
 * - log_id / user_id are varchar(32): a 36-char UUID with hyphens overflows and the INSERT
 *   fails silently upstream (callers only warn). Strip hyphens (32 chars) and keep the
 *   original operator object intact in extra_data for traceability.
 * - extra_data is jsonb: the bind param must be cast with `$n::jsonb`.
 * - Audit failure must never break the business transaction; warn and continue.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  async log(input: AuditLogInput): Promise<void> {
    const {
      operator = null,
      action,
      module,
      targetType = null,
      targetId = null,
      success,
      params = null,
    } = input;
    try {
      await pool.query(
        `INSERT INTO auth_operation_log
           (log_id, user_id, username, action, module, target_type, target_id, success, request_params, extra_data, created_at)
         VALUES (replace(gen_random_uuid()::text, '-', ''), $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, NOW())`,
        [
          operator?.userId ? operator.userId.replace(/-/g, '').slice(0, 32) : null,
          operator?.username ? operator.username.slice(0, 64) : null,
          action.slice(0, 128),
          module.slice(0, 32),
          targetType ? targetType.slice(0, 32) : null,
          targetId ? targetId.slice(0, 64) : null,
          success.toString().slice(0, 8),
          params ? JSON.stringify(params) : null,
          JSON.stringify({ operator: operator ?? null }),
        ],
      );
    } catch (err: unknown) {
      this.logger.warn(`Failed to log audit (${module}/${action}): ${(err as Error).message}`);
    }
  }
}
