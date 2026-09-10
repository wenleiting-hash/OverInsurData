/**
 * Role Service - Business Logic for Role Management
 *
 * Provides CRUD operations for auth_role table.
 */

import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { pool } from '../../database/drizzle.client';

// ─── DTOs ───────────────────────────────────────────────────────────

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  roleKey!: string;

  @IsString()
  @IsNotEmpty()
  roleNameZh!: string;

  @IsOptional()
  @IsString()
  roleNameEn?: string;

  @IsString()
  @IsNotEmpty()
  roleCode!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionKeys?: string[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  roleNameZh?: string;

  @IsOptional()
  @IsString()
  roleNameEn?: string;

  @IsOptional()
  @IsString()
  roleCode?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionKeys?: string[];
}

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  /**
   * Get all roles with user count and permission count
   */
  async getRoleList() {
    const result = await pool.query(`
      SELECT
        r.role_id as id,
        r.role_key,
        r.role_name_zh,
        r.role_name_en,
        r.role_code,
        r.description,
        r.permission_keys,
        r.is_system,
        r.sort_order,
        r.created_at,
        r.updated_at,
        COUNT(DISTINCT ur.user_id) AS "userCount",
        COALESCE(jsonb_array_length(r.permission_keys), 0) AS "permissionCount"
      FROM auth_role r
      LEFT JOIN auth_user_role ur ON ur.role_id = r.role_id
      WHERE r.deleted = FALSE
      GROUP BY r.role_id, r.role_key, r.role_name_zh, r.role_name_en,
               r.role_code, r.description, r.permission_keys, r.is_system,
               r.sort_order, r.created_at, r.updated_at
      ORDER BY r.sort_order ASC
    `);

    return result.rows;
  }

  /**
   * Get single role by role_key
   */
  async getRoleByKey(roleKey: string) {
    const result = await pool.query(`
      SELECT
        r.role_id as id, r.role_key, r.role_name_zh, r.role_name_en,
        r.role_code, r.description, r.permission_keys, r.is_system,
        r.sort_order, r.created_at, r.updated_at,
        COUNT(DISTINCT ur.user_id) AS "userCount"
      FROM auth_role r
      LEFT JOIN auth_user_role ur ON ur.role_id = r.role_id
      WHERE r.role_key = $1 AND r.deleted = FALSE
      GROUP BY r.role_id, r.role_key, r.role_name_zh, r.role_name_en,
               r.role_code, r.description, r.permission_keys, r.is_system,
               r.sort_order, r.created_at, r.updated_at
    `, [roleKey]);

    if (result.rows.length === 0) {
      throw new NotFoundException(`Role not found: ${roleKey}`);
    }
    return result.rows[0];
  }

  /**
   * Create new role
   */
  async createRole(dto: CreateRoleDto) {
    // Check uniqueness
    const existing = await pool.query(
      'SELECT 1 FROM auth_role WHERE role_key = $1 AND deleted = FALSE', [dto.roleKey],
    );
    if (existing.rows.length > 0) {
      throw new ConflictException(`Role key '${dto.roleKey}' already exists`);
    }

    const result = await pool.query(`
      INSERT INTO auth_role (
        role_key, role_name_zh, role_name_en, role_code,
        description, permission_keys, is_system, sort_order,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING role_id, role_key, role_name_zh, role_code
    `, [
      dto.roleKey, dto.roleNameZh, dto.roleNameEn || null,
      dto.roleCode, dto.description || null,
      JSON.stringify(dto.permissionKeys || []),
      dto.isSystem || false, dto.sortOrder || 0,
    ]);

    this.logger.log(`Role created: ${dto.roleKey}`);
    return this.getRoleByKey(dto.roleKey);
  }

  /**
   * Update role
   */
  async updateRole(roleKey: string, dto: UpdateRoleDto) {
    const role = await pool.query(
      'SELECT role_id, is_system FROM auth_role WHERE role_key = $1 AND deleted = FALSE', [roleKey],
    );
    if (role.rows.length === 0) {
      throw new NotFoundException(`Role not found: ${roleKey}`);
    }

    // Prevent editing system roles' core fields
    if (role.rows[0].is_system) {
      if (dto.roleCode !== undefined) {
        throw new ForbiddenException('Cannot change role_code of system roles');
      }
    }

    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [];
    let idx = 1;

    if (dto.roleNameZh !== undefined) { updates.push(`role_name_zh = $${idx}`); params.push(dto.roleNameZh); idx++; }
    if (dto.roleNameEn !== undefined) { updates.push(`role_name_en = $${idx}`); params.push(dto.roleNameEn); idx++; }
    if (dto.roleCode !== undefined) { updates.push(`role_code = $${idx}`); params.push(dto.roleCode); idx++; }
    if (dto.description !== undefined) { updates.push(`description = $${idx}`); params.push(dto.description); idx++; }
    if (dto.sortOrder !== undefined) { updates.push(`sort_order = $${idx}`); params.push(dto.sortOrder); idx++; }
    if (dto.permissionKeys !== undefined) { updates.push(`permission_keys = $${idx}`); params.push(JSON.stringify(dto.permissionKeys)); idx++; }

    params.push(roleKey);
    await pool.query(
      `UPDATE auth_role SET ${updates.join(', ')} WHERE role_key = $${idx}`,
      params,
    );

    return this.getRoleByKey(roleKey);
  }

  /**
   * Soft delete role (prevent system role deletion)
   */
  async deleteRole(roleKey: string) {
    const role = await pool.query(
      'SELECT role_id, is_system FROM auth_role WHERE role_key = $1 AND deleted = FALSE', [roleKey],
    );
    if (role.rows.length === 0) {
      throw new NotFoundException(`Role not found: ${roleKey}`);
    }
    if (role.rows[0].is_system) {
      throw new ForbiddenException('Cannot delete system roles');
    }

    await pool.query(
      `UPDATE auth_role SET deleted = TRUE, updated_at = NOW() WHERE role_key = $1`,
      [roleKey],
    );

    this.logger.log(`Role deleted: ${roleKey}`);
    return { success: true, roleKey };
  }
}
