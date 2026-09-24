/**
 * Department Service - Business Logic for Department Management
 *
 * Handles tree structure, CRUD, cascade delete, and member queries.
 * Uses raw SQL via pool for complex tree operations.
 */

import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';
import { AuditService } from '../../common/services/audit.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dtos/department.dto';

@Injectable()
export class DepartmentService {
  private readonly logger = new Logger(DepartmentService.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Get full department tree with member counts
   */
  async getDepartmentTree() {
    const result = await pool.query(`
      SELECT
        d.dept_id,
        d.dept_code,
        d.dept_name_zh,
        d.dept_name_en,
        d.parent_dept_id,
        d.dept_level,
        d.path,
        d.color,
        d.description,
        d.manager_name,
        d.manager_title,
        d.manager_email,
        d.manager_phone,
        d.office_location,
        d.sort_order,
        d.status,
        d.created_at,
        d.updated_at,
        COALESCE(mc.member_count, 0)::int AS member_count,
        COALESCE(sc.sub_count, 0)::int AS sub_department_count
      FROM auth_department d
      LEFT JOIN (
        SELECT dept_code, COUNT(*) AS member_count
        FROM auth_user
        WHERE deleted = FALSE
        GROUP BY dept_code
      ) mc ON mc.dept_code = d.dept_code
      LEFT JOIN (
        SELECT parent_dept_id, COUNT(*) AS sub_count
        FROM auth_department
        WHERE deleted = FALSE
        GROUP BY parent_dept_id
      ) sc ON sc.parent_dept_id = d.dept_id
      WHERE d.deleted = FALSE
      ORDER BY d.sort_order ASC, d.dept_level ASC, d.dept_name_zh ASC
    `);

    // Build tree structure in memory
    return this.buildTree(result.rows);
  }

  /**
   * Get single department with full stats
   */
  async getDepartmentById(deptId: number) {
    const result = await pool.query(`
      SELECT
        d.dept_id,
        d.dept_code,
        d.dept_name_zh,
        d.dept_name_en,
        d.parent_dept_id,
        d.dept_level,
        d.path,
        d.color,
        d.description,
        d.manager_name,
        d.manager_title,
        d.manager_email,
        d.manager_phone,
        d.office_location,
        d.sort_order,
        d.status,
        d.created_at,
        d.updated_at,
        COALESCE(mc.member_count, 0)::int AS member_count,
        COALESCE(sc.sub_count, 0)::int AS sub_department_count
      FROM auth_department d
      LEFT JOIN (
        SELECT dept_code, COUNT(*) AS member_count
        FROM auth_user WHERE deleted = FALSE GROUP BY dept_code
      ) mc ON mc.dept_code = d.dept_code
      LEFT JOIN (
        SELECT parent_dept_id, COUNT(*) AS sub_count
        FROM auth_department WHERE deleted = FALSE GROUP BY parent_dept_id
      ) sc ON sc.parent_dept_id = d.dept_id
      WHERE d.dept_id = $1 AND d.deleted = FALSE
    `, [deptId]);

    if (result.rows.length === 0) {
      throw new NotFoundException(`Department not found: ${deptId}`);
    }

    const dept = result.rows[0];

    // Get sub-departments list
    const subResult = await pool.query(`
      SELECT d.dept_id, d.dept_code, d.dept_name_zh, d.dept_name_en, d.color,
             COALESCE(mc.member_count, 0)::int AS member_count
      FROM auth_department d
      LEFT JOIN (
        SELECT u.dept_code, COUNT(*) AS member_count
        FROM auth_user u WHERE u.deleted = FALSE GROUP BY u.dept_code
      ) mc ON mc.dept_code = d.dept_code
      WHERE d.parent_dept_id = $1 AND d.deleted = FALSE
      ORDER BY d.sort_order ASC
    `, [deptId]);

    // Get breadcrumb path (ancestor names)
    const pathNames = await this.getAncestorPath(deptId);

    return {
      ...dept,
      children: subResult.rows,
      ancestor_path: pathNames,
    };
  }

  /**
   * Create new department
   */
  async createDepartment(dto: CreateDepartmentDto, operatorUuid?: string) {
    const {
      dept_name_zh, dept_name_en, dept_code, parent_dept_id,
      color, description, manager_name, manager_title,
      manager_email, manager_phone, office_location, sort_order,
    } = dto;

    // Auto-generate dept_code from English name if not provided
    const finalCode = dept_code || this.generateDeptCode(dept_name_en || dept_name_zh);

    // Check uniqueness
    const codeCheck = await pool.query(
      'SELECT 1 FROM auth_department WHERE dept_code = $1 AND deleted = FALSE',
      [finalCode],
    );
    if (codeCheck.rows.length > 0) {
      throw new ConflictException(`Department code '${finalCode}' already exists`);
    }

    // Validate parent and compute path
    let deptLevel = 0;
    let path = `/${finalCode}`;
    if (parent_dept_id) {
      const parentResult = await pool.query(
        'SELECT dept_id, path, dept_level FROM auth_department WHERE dept_id = $1 AND deleted = FALSE',
        [parent_dept_id],
      );
      if (parentResult.rows.length === 0) {
        throw new BadRequestException(`Parent department not found: ${parent_dept_id}`);
      }
      const parent = parentResult.rows[0];
      deptLevel = parent.dept_level + 1;
      path = `${parent.path}/${finalCode}`;
    }

    const insertResult = await pool.query(`
      INSERT INTO auth_department (
        dept_code, dept_name_zh, dept_name_en, parent_dept_id,
        dept_level, path, color, description,
        manager_name, manager_title, manager_email, manager_phone,
        office_location, sort_order, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING dept_id
    `, [
      finalCode, dept_name_zh, dept_name_en || null,
      parent_dept_id || null, deptLevel, path,
      color || '#2563EB', description || null,
      manager_name || null, manager_title || null,
      manager_email || null, manager_phone || null,
      office_location || null, sort_order || 0,
    ]);

    const { dept_id } = insertResult.rows[0];

    await this.auditService.log({
      operator: { userId: operatorUuid },
      action: 'CREATE',
      module: 'department',
      targetType: 'department',
      targetId: String(dept_id),
      success: true,
    });

    return this.getDepartmentById(dept_id);
  }

  /**
   * Update department
   */
  async updateDepartment(deptId: number, dto: UpdateDepartmentDto, operatorUuid?: string) {
    const existing = await pool.query(
      'SELECT dept_id, dept_code, dept_level FROM auth_department WHERE dept_id = $1 AND deleted = FALSE',
      [deptId],
    );
    if (existing.rows.length === 0) {
      throw new NotFoundException(`Department not found: ${deptId}`);
    }

    // Circular reference check: cannot set self or descendant as parent
    if (dto.parent_dept_id !== undefined) {
      if (dto.parent_dept_id === deptId) {
        throw new BadRequestException('Cannot set department as its own parent');
      }
      if (dto.parent_dept_id !== null) {
        const descendants = await this.getDescendantIds(deptId);
        if (descendants.includes(dto.parent_dept_id)) {
          throw new BadRequestException('Cannot set a descendant as parent department');
        }
      }
    }

    const allowedFields = [
      'dept_name_zh', 'dept_name_en', 'parent_dept_id', 'color', 'description',
      'manager_name', 'manager_title', 'manager_email', 'manager_phone',
      'office_location', 'status', 'sort_order',
    ];
    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [];
    let idx = 1;

    for (const key of Object.keys(dto)) {
      if (allowedFields.includes(key)) {
        const value = (dto as any)[key];
        if (value !== undefined) {
          updates.push(`${key} = $${idx}`);
          params.push(value);
          idx++;
        }
      }
    }

    // Recompute path and level if parent changed
    if (dto.parent_dept_id !== undefined) {
      const existingDept = existing.rows[0];
      let newLevel = 0;
      let newPath = `/${existingDept.dept_code}`;
      if (dto.parent_dept_id !== null) {
        const parentResult = await pool.query(
          'SELECT path, dept_level FROM auth_department WHERE dept_id = $1 AND deleted = FALSE',
          [dto.parent_dept_id],
        );
        if (parentResult.rows.length === 0) {
          throw new BadRequestException(`Parent department not found: ${dto.parent_dept_id}`);
        }
        newLevel = parentResult.rows[0].dept_level + 1;
        newPath = `${parentResult.rows[0].path}/${existingDept.dept_code}`;
      }
      updates.push(`dept_level = $${idx}`);
      params.push(newLevel);
      idx++;
      updates.push(`path = $${idx}`);
      params.push(newPath);
      idx++;
    }

    params.push(deptId);
    const updateSql = `
      UPDATE auth_department SET ${updates.join(', ')}
      WHERE dept_id = $${idx} AND deleted = FALSE
      RETURNING dept_id
    `;

    const result = await pool.query(updateSql, params);
    if (result.rows.length === 0) {
      throw new NotFoundException(`Department not found: ${deptId}`);
    }

    await this.auditService.log({
      operator: { userId: operatorUuid },
      action: 'UPDATE',
      module: 'department',
      targetType: 'department',
      targetId: String(deptId),
      success: true,
    });

    return this.getDepartmentById(deptId);
  }

  /**
   * Cascade soft-delete department and all descendants
   */
  async deleteDepartment(deptId: number, operatorUuid?: string) {
    const existing = await pool.query(
      'SELECT dept_id, dept_code, dept_name_zh FROM auth_department WHERE dept_id = $1 AND deleted = FALSE',
      [deptId],
    );
    if (existing.rows.length === 0) {
      throw new NotFoundException(`Department not found: ${deptId}`);
    }

    const dept = existing.rows[0];
    const descendantIds = await this.getDescendantIds(deptId);
    const allIds = [deptId, ...descendantIds];

    // Cascade soft-delete
    await pool.query(
      `UPDATE auth_department SET deleted = TRUE, updated_at = NOW()
       WHERE dept_id = ANY($1::int[]) AND deleted = FALSE`,
      [allIds],
    );

    // Clear dept_code for users in deleted departments
    await pool.query(
      `UPDATE auth_user SET dept_code = NULL, updated_at = NOW()
       WHERE dept_code IN (
         SELECT dept_code FROM auth_department WHERE dept_id = ANY($1::int[])
       ) AND deleted = FALSE`,
      [allIds],
    );

    await this.auditService.log({
      operator: { userId: operatorUuid },
      action: 'DELETE',
      module: 'department',
      targetType: 'department',
      targetId: String(deptId),
      success: true,
      params: { deletedCount: allIds.length, deptName: dept.dept_name_zh },
    });

    return {
      success: true,
      deptId,
      deletedCount: allIds.length,
      subDepartmentCount: descendantIds.length,
    };
  }

  /**
   * Get department members (paginated)
   */
  async getDepartmentMembers(deptId: number, params: { page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 20 } = params;
    const offset = (page - 1) * pageSize;

    const existing = await pool.query(
      'SELECT dept_id, dept_code FROM auth_department WHERE dept_id = $1 AND deleted = FALSE',
      [deptId],
    );
    if (existing.rows.length === 0) {
      throw new NotFoundException(`Department not found: ${deptId}`);
    }

    const { dept_code } = existing.rows[0];

    const countResult = await pool.query(
      'SELECT COUNT(*)::int as total FROM auth_user WHERE dept_code = $1 AND deleted = FALSE',
      [dept_code],
    );
    const total = countResult.rows[0].total;

    const listResult = await pool.query(`
      SELECT
        u.user_uuid as id, u.username, u.email, u.name_zh, u.name_en,
        u.status,
        ARRAY_AGG(DISTINCT r.role_name_zh) FILTER (WHERE r.role_name_zh IS NOT NULL) AS roles
      FROM auth_user u
      LEFT JOIN auth_user_role ur ON ur.user_id = u.id
      LEFT JOIN auth_role r ON ur.role_id = r.role_id AND r.deleted = FALSE
      WHERE u.dept_code = $1 AND u.deleted = FALSE
      GROUP BY u.id, u.user_uuid, u.username, u.email, u.name_zh, u.name_en, u.status
      ORDER BY u.created_at DESC
      LIMIT $2 OFFSET $3
    `, [dept_code, pageSize, offset]);

    return { data: listResult.rows, total, page, pageSize };
  }

  // ─── Private helpers ─────────────────────────────────────────────

  /**
   * Build tree from flat list
   */
  private buildTree(rows: any[]): any[] {
    const map = new Map<number, any>();
    const roots: any[] = [];

    for (const row of rows) {
      map.set(row.dept_id, { ...row, children: [] });
    }

    for (const row of rows) {
      const node = map.get(row.dept_id);
      if (row.parent_dept_id && map.has(row.parent_dept_id)) {
        map.get(row.parent_dept_id).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Get ancestor path as array of { dept_id, dept_name_zh }
   */
  private async getAncestorPath(deptId: number): Promise<Array<{ dept_id: number; dept_name_zh: string }>> {
    const result = await pool.query(`
      WITH RECURSIVE ancestors AS (
        SELECT dept_id, dept_name_zh, parent_dept_id, 0 AS depth
        FROM auth_department
        WHERE dept_id = $1 AND deleted = FALSE
        UNION ALL
        SELECT d.dept_id, d.dept_name_zh, d.parent_dept_id, a.depth + 1
        FROM auth_department d
        JOIN ancestors a ON d.dept_id = a.parent_dept_id AND d.deleted = FALSE
      )
      SELECT dept_id, dept_name_zh FROM ancestors
      ORDER BY depth DESC
    `, [deptId]);

    return result.rows;
  }

  /**
   * Get all descendant department IDs (recursive)
   */
  private async getDescendantIds(deptId: number): Promise<number[]> {
    const result = await pool.query(`
      WITH RECURSIVE descendants AS (
        SELECT dept_id FROM auth_department
        WHERE parent_dept_id = $1 AND deleted = FALSE
        UNION ALL
        SELECT d.dept_id FROM auth_department d
        JOIN descendants ds ON d.parent_dept_id = ds.dept_id AND d.deleted = FALSE
      )
      SELECT dept_id FROM descendants
    `, [deptId]);

    return result.rows.map((r: any) => r.dept_id);
  }

  /**
   * Generate dept_code from name (uppercase, sanitized)
   */
  private generateDeptCode(name: string): string {
    const code = name
      .replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '')
      .toUpperCase()
      .substring(0, 32);
    // Append timestamp suffix to avoid collisions
    return `${code}_${Date.now().toString(36).slice(-4)}`;
  }

}
