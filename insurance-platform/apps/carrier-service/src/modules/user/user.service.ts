/**
 * User Service - Business Logic for User Management
 *
 * Uses unified auth_user schema V5 columns.
 * All queries reference user_uuid as the business identifier.
 */

import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';
import { PasswordHashingService } from '../../common/services/password-hashing.service';
import { CreateUserDto, UpdateUserDto, GetUserListParams } from './dtos/user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly passwordHashingService: PasswordHashingService) {}

  /**
   * Get paginated user list with optional filters
   */
  async getUserList(params: GetUserListParams) {
    const { page = 1, pageSize = 20, search, statusFilter, roleFilter, deptFilter } = params;

    let paramIndex = 1;
    const offset = (page - 1) * pageSize;

    const whereClauses = ['u.deleted = FALSE'];
    const queryParams: any[] = [];

    if (search) {
      whereClauses.push(`(u.username ILIKE $${paramIndex} OR u.name_zh ILIKE $${paramIndex} OR u.name_en ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (statusFilter) {
      whereClauses.push(`u.status = $${paramIndex}`);
      queryParams.push(statusFilter);
      paramIndex++;
    }

    if (roleFilter) {
      whereClauses.push(`EXISTS (
        SELECT 1 FROM auth_user_role ur
        JOIN auth_role r ON ur.role_id = r.role_id
        WHERE ur.user_id = u.id AND r.role_key = $${paramIndex} AND r.deleted = FALSE
      )`);
      queryParams.push(roleFilter);
      paramIndex++;
    }

    if (deptFilter) {
      whereClauses.push(`u.dept_code = $${paramIndex}`);
      queryParams.push(deptFilter);
      paramIndex++;
    }

    // Total count
    const countSql = `SELECT COUNT(*) as total FROM auth_user u WHERE ${whereClauses.join(' AND ')}`;
    const countResult = await pool.query(countSql, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    // List query
    const listSql = `
      SELECT
        u.user_uuid as id,
        u.username,
        u.email,
        u.name_zh,
        u.name_en,
        u.phone,
        u.avatar_url,
        u.dept_code,
        d.dept_name_zh,
        d.dept_name_en,
        u.status,
        u.auth_method,
        u.mfa_enabled,
        u.last_login_at as "lastLoginAt",
        u.login_count as "loginCount",
        u.failed_login_attempts as "failedLoginAttempts",
        u.created_at as "createdAt",
        u.updated_at as "updatedAt",
        u.remark,
        ARRAY_AGG(DISTINCT r.role_key) FILTER (WHERE r.role_key IS NOT NULL) AS roles
      FROM auth_user u
      LEFT JOIN auth_department d ON u.dept_code = d.dept_code AND d.deleted = FALSE
      LEFT JOIN auth_user_role ur ON ur.user_id = u.id
      LEFT JOIN auth_role r ON ur.role_id = r.role_id AND r.deleted = FALSE
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY u.id, u.user_uuid, u.username, u.email, u.name_zh, u.name_en,
               u.phone, u.avatar_url, u.dept_code, d.dept_name_zh, d.dept_name_en,
               u.status, u.auth_method, u.mfa_enabled, u.last_login_at, u.login_count,
               u.failed_login_attempts, u.created_at, u.updated_at, u.remark
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await pool.query(listSql, [...queryParams, pageSize, offset]);

    return { data: result.rows, total, page, pageSize };
  }

  /**
   * Get single user by UUID
   */
  async getUserById(userUuid: string) {
    const result = await pool.query(`
      SELECT
        u.user_uuid as id, u.username, u.email, u.name_zh, u.name_en,
        u.phone, u.avatar_url, u.dept_code, u.status, u.auth_method,
        u.mfa_enabled, u.last_login_at, u.login_count, u.failed_login_attempts,
        u.created_at, u.updated_at, u.remark, u.created_by,
        d.dept_name_zh, d.dept_name_en,
        ARRAY_AGG(DISTINCT r.role_key) FILTER (WHERE r.role_key IS NOT NULL) AS roles
      FROM auth_user u
      LEFT JOIN auth_department d ON u.dept_code = d.dept_code AND d.deleted = FALSE
      LEFT JOIN auth_user_role ur ON ur.user_id = u.id
      LEFT JOIN auth_role r ON ur.role_id = r.role_id AND r.deleted = FALSE
      WHERE u.user_uuid = $1 AND u.deleted = FALSE
      GROUP BY u.id, u.user_uuid, u.username, u.email, u.name_zh, u.name_en,
               u.phone, u.avatar_url, u.dept_code, u.status, u.auth_method,
               u.mfa_enabled, u.last_login_at, u.login_count, u.failed_login_attempts,
               u.created_at, u.updated_at, u.remark, u.created_by,
               d.dept_name_zh, d.dept_name_en
    `, [userUuid]);

    if (result.rows.length === 0) {
      throw new NotFoundException(`User not found: ${userUuid}`);
    }

    return result.rows[0];
  }

  /**
   * Create new user with password encryption
   */
  async createUser(dto: CreateUserDto, operatorUuid?: string) {
    const { username, email, password, roleKeys = [], deptCode, name_zh, name_en, phone, avatarUrl, authMethod, remark } = dto;

    // Check username uniqueness
    const usernameCheck = await pool.query(
      'SELECT 1 FROM auth_user WHERE username = $1 AND deleted = FALSE', [username],
    );
    if (usernameCheck.rows.length > 0) {
      throw new ConflictException(`Username '${username}' already exists`);
    }

    // Check email uniqueness
    const emailCheck = await pool.query(
      'SELECT 1 FROM auth_user WHERE email = $1 AND deleted = FALSE', [email],
    );
    if (emailCheck.rows.length > 0) {
      throw new ConflictException(`Email '${email}' already exists`);
    }

    // Validate department (if provided)
    if (deptCode) {
      const deptCheck = await pool.query(
        'SELECT 1 FROM auth_department WHERE dept_code = $1 AND deleted = FALSE AND status = TRUE', [deptCode],
      );
      if (deptCheck.rows.length === 0) {
        throw new BadRequestException(`Invalid department code: ${deptCode}`);
      }
    }

    // Hash password
    const passwordHash = await this.passwordHashingService.hashPassword(password);

    // Generate UUID
    const userUuid = `u${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const insertResult = await pool.query(`
      INSERT INTO auth_user (
        user_uuid, username, email, password_hash, dept_code,
        name_zh, name_en, phone, avatar_url, auth_method,
        status, mfa_enabled, created_by, remark,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', FALSE, $11, $12, NOW(), NOW())
      RETURNING user_uuid, id
    `, [
      userUuid, username, email, passwordHash, deptCode || null,
      name_zh || 'Unknown', name_en || null, phone || null,
      avatarUrl || null, authMethod || 'local',
      operatorUuid || 'system', remark || null,
    ]);

    const { user_uuid, id: userId } = insertResult.rows[0];

    // Assign roles
    if (roleKeys && roleKeys.length > 0) {
      await pool.query(`
        INSERT INTO auth_user_role (user_id, role_id, assigned_by, assigned_at)
        SELECT $1, r.role_id, $2, NOW()
        FROM auth_role r
        WHERE r.role_key = ANY($3::text[])
          AND r.deleted = FALSE
          AND NOT EXISTS (
            SELECT 1 FROM auth_user_role ur
            WHERE ur.user_id = $1 AND ur.role_id = r.role_id
          )
      `, [userId, operatorUuid || 'system', roleKeys]);
    }

    await this.logAudit({
      userId: operatorUuid,
      action: 'CREATE',
      module: 'user',
      targetType: 'user',
      targetId: user_uuid,
      success: true,
    });

    return this.getUserById(user_uuid);
  }

  /**
   * Update user (partial update supported)
   */
  async updateUser(userUuid: string, dto: UpdateUserDto, operatorUuid?: string) {
    const user = await pool.query(
      'SELECT id, user_uuid FROM auth_user WHERE user_uuid = $1 AND deleted = FALSE', [userUuid],
    );
    if (user.rows.length === 0) {
      throw new NotFoundException(`User not found: ${userUuid}`);
    }

    const allowedFields = ['username', 'email', 'name_zh', 'name_en', 'phone', 'avatar_url', 'dept_code', 'status', 'remark'];
    const updates: string[] = ['updated_at = NOW()'];
    const queryParams: any[] = [];
    let idx = 1;

    for (const key of Object.keys(dto)) {
      if (allowedFields.includes(key)) {
        const value = (dto as any)[key];
        if (value !== undefined) {
          updates.push(`${key} = $${idx}`);
          queryParams.push(value);
          idx++;
        }
      }
    }

    if (dto.roleKeys && dto.roleKeys.length >= 0) {
      // Replace all roles
      await pool.query('DELETE FROM auth_user_role WHERE user_id = $1', [user.rows[0].id]);
      if (dto.roleKeys.length > 0) {
        await pool.query(`
          INSERT INTO auth_user_role (user_id, role_id, assigned_by, assigned_at)
          SELECT $1, r.role_id, $2, NOW()
          FROM auth_role r
          WHERE r.role_key = ANY($3::text[]) AND r.deleted = FALSE
        `, [user.rows[0].id, operatorUuid || 'system', dto.roleKeys]);
      }
    }

    queryParams.push(userUuid);
    const updateSql = `
      UPDATE auth_user SET ${updates.join(', ')}
      WHERE user_uuid = $${idx}
      RETURNING user_uuid
    `;

    const result = await pool.query(updateSql, queryParams);
    if (result.rows.length === 0) {
      throw new NotFoundException(`User not found: ${userUuid}`);
    }

    await this.logAudit({
      userId: operatorUuid,
      action: 'UPDATE',
      module: 'user',
      targetType: 'user',
      targetId: userUuid,
      success: true,
    });

    return this.getUserById(userUuid);
  }

  /**
   * Soft delete user (set deleted = TRUE)
   */
  async deleteUser(userUuid: string, operatorUuid?: string) {
    const result = await pool.query(
      `UPDATE auth_user SET deleted = TRUE, updated_at = NOW()
       WHERE user_uuid = $1 AND deleted = FALSE
       RETURNING user_uuid`,
      [userUuid],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`User not found: ${userUuid}`);
    }

    await this.logAudit({
      userId: operatorUuid,
      action: 'DELETE',
      module: 'user',
      targetType: 'user',
      targetId: userUuid,
      success: true,
    });

    return { success: true, userId: userUuid };
  }

  /**
   * Toggle user status (active/inactive/locked)
   */
  async toggleStatus(userUuid: string, newStatus: 'active' | 'inactive' | 'locked', operatorUuid?: string) {
    const result = await pool.query(`
      UPDATE auth_user
      SET status = $1::text,
          locked_until = CASE WHEN $1::text = 'locked' THEN NOW() + INTERVAL '30 minutes' ELSE NULL END,
          failed_login_attempts = CASE WHEN $1::text = 'active' THEN 0 ELSE failed_login_attempts END,
          updated_at = NOW()
      WHERE user_uuid = $2 AND deleted = FALSE
      RETURNING user_uuid, status
    `, [newStatus, userUuid]);

    if (result.rows.length === 0) {
      throw new NotFoundException(`User not found: ${userUuid}`);
    }

    await this.logAudit({
      userId: operatorUuid,
      action: 'TOGGLE_STATUS',
      module: 'user',
      targetType: 'user',
      targetId: userUuid,
      success: true,
      params: { newStatus },
    });

    return result.rows[0];
  }

  /**
   * Reset user password and disable MFA
   */
  async resetPassword(userUuid: string, newPassword: string, operatorUuid?: string) {
    const passwordHash = await this.passwordHashingService.hashPassword(newPassword);

    const result = await pool.query(`
      UPDATE auth_user
      SET password_hash = $1,
          mfa_enabled = FALSE,
          mfa_secret = NULL,
          updated_at = NOW()
      WHERE user_uuid = $2 AND deleted = FALSE
      RETURNING user_uuid
    `, [passwordHash, userUuid]);

    if (result.rows.length === 0) {
      throw new NotFoundException(`User not found: ${userUuid}`);
    }

    // Clear active sessions
    await pool.query(
      'DELETE FROM auth_refresh_token WHERE user_uuid = $1', [userUuid],
    );

    await this.logAudit({
      userId: operatorUuid,
      action: 'PASSWORD_RESET',
      module: 'user',
      targetType: 'user',
      targetId: userUuid,
      success: true,
    });

    return { success: true };
  }

  /**
   * Get department list
   */
  async getDepartments() {
    const result = await pool.query(`
      SELECT dept_id, dept_code, dept_name_zh, dept_name_en,
             parent_dept_id, dept_level, path, status
      FROM auth_department
      WHERE deleted = FALSE
      ORDER BY sort_order ASC, dept_level ASC
    `);
    return result.rows;
  }

  /**
   * Log audit operations
   */
  private async logAudit(config: {
    userId?: string;
    action: string;
    module: string;
    targetType?: string;
    targetId?: string;
    success?: boolean;
    params?: Record<string, unknown>;
  }) {
    try {
      await pool.query(`
        INSERT INTO auth_operation_log (
          log_id, user_id, action, module, target_type, target_id,
          success, request_params, created_at
        ) VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW()
        )
      `, [
        config.userId || null,
        config.action,
        config.module,
        config.targetType || null,
        config.targetId || null,
        config.success?.toString() || null,
        config.params ? JSON.stringify(config.params) : null,
      ]);
    } catch (err: unknown) {
      this.logger.warn(`Failed to log audit: ${(err as Error).message}`);
    }
  }
}
