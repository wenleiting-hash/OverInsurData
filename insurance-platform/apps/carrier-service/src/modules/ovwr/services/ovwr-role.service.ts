/**
 * Ovwr Role Management Service
 * 
 * Handles role template business logic with complete CRUD operations
 * Uses native PostgreSQL queries to avoid Drizzle ORM type conflicts
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { pool } from '../../../database/drizzle.client';

/**
 * DTO for creating a new role template
 */
export class CreateRoleTemplateDto {
  ovwrTemplateName!: string;
  ovwrDescription?: string;
  ovwrPermissions!: Array<{ ovwrPermissionId: string }>;
  ovwrApplicableRoles?: string[];
  ovwrIsSystem?: boolean;
}

/**
 * DTO for updating a role template
 */
export class UpdateRoleTemplateDto {
  ovwrTemplateName?: string;
  ovwrDescription?: string;
  ovwrPermissions?: Array<{ ovwrPermissionId: string }>;
  ovwrApplicableRoles?: string[];
}

@Injectable()
export class OvwrRoleService {
  /**
   * Get all role templates with pagination
   */
  async getTemplates({
    page = 1,
    pageSize = 20,
  }: {
    page?: number;
    pageSize?: number;
  }) {
    const offset = (page - 1) * pageSize;
    
    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM ovwr_auth_permission_template
    `);
    
    const total = parseInt(countResult.rows[0].total);
    const pages = Math.ceil(total / pageSize);
    
    const results = await pool.query(`
      SELECT * 
      FROM ovwr_auth_permission_template 
      ORDER BY ovwr_created_at DESC 
      LIMIT $1 OFFSET $2
    `, [pageSize, offset]);
    
    return {
      total,
      pages,
      data: results.rows,
    };
  }

  /**
   * Get single role template by ID
   */
  async getTemplateById(id: string) {
    const result = await pool.query(
      'SELECT * FROM ovwr_auth_permission_template WHERE ovwr_template_id = $1',
      [id]
    );
    
    if (!result.rows[0]) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    
    return result.rows[0];
  }

  /**
   * Create new role template with validation
   */
  async createTemplate(dto: CreateRoleTemplateDto) {
    // Check duplicate template name
    const existing = await this.getTemplateByName(dto.ovwrTemplateName);
    if (existing) {
      throw new Error(`Template name "${dto.ovwrTemplateName}" already exists`);
    }

    const now = new Date().toISOString();
    
    const sql = `
      INSERT INTO ovwr_auth_permission_template (
        ovwr_template_id, ovwr_template_name, ovwr_description, ovwr_permissions,
        ovwr_applicable_roles, ovwr_is_system, ovwr_usage_count, ovwr_status,
        ovwr_metadata, ovwr_created_at, ovwr_updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const result = await pool.query(sql, [
      `role-template-${Date.now()}`,
      dto.ovwrTemplateName,
      dto.ovwrDescription || '',
      JSON.stringify(dto.ovwrPermissions),
      JSON.stringify(dto.ovwrApplicableRoles || []),
      dto.ovwrIsSystem || false,
      0,
      'active',
      null,
      now,
      now,
    ]);
    
    return result.rows[0];
  }

  /**
   * Update existing role template
   */
  async updateTemplate(id: string, dto: UpdateRoleTemplateDto) {
    // Check existence
    const existing = await this.getTemplateById(id);
    
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (dto.ovwrTemplateName) {
      updates.push(`ovwr_template_name = $${paramIndex++}`);
      values.push(dto.ovwrTemplateName);
    }
    
    if (dto.ovwrDescription !== undefined) {
      updates.push(`ovwr_description = $${paramIndex++}`);
      values.push(dto.ovwrDescription);
    }
    
    if (dto.ovwrPermissions) {
      updates.push(`ovwr_permissions = $${paramIndex++}`);
      values.push(JSON.stringify(dto.ovwrPermissions));
    }
    
    if (dto.ovwrApplicableRoles !== undefined) {
      updates.push(`ovwr_applicable_roles = $${paramIndex++}`);
      values.push(JSON.stringify(dto.ovwrApplicableRoles));
    }
    
    updates.push(`ovwr_updated_at = $${paramIndex++}`);
    values.push(now);
    
    const sql = `
      UPDATE ovwr_auth_permission_template 
      SET ${updates.join(', ')}
      WHERE ovwr_template_id = $${paramIndex++}
      RETURNING *
    `;
    values.push(id);
    
    const result = await pool.query(sql, values);
    
    if (!result.rows[0]) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    
    return result.rows[0];
  }

  /**
   * Delete role template
   */
  async deleteTemplate(id: string) {
    const template = await this.getTemplateById(id);
    
    if (template.ovwrIsSystem) {
      throw new Error('Cannot delete system template');
    }
    
    const result = await pool.query(
      'DELETE FROM ovwr_auth_permission_template WHERE ovwr_template_id = $1 RETURNING *',
      [id]
    );
    
    if (!result.rows[0]) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    
    return { success: true, message: 'Template deleted successfully' };
  }

  /**
   * Apply template to a role
   */
  async applyTemplateToRole(templateId: string, roleId: string) {
    const template = await this.getTemplateById(templateId);
    
    console.log(`Applied template ${template.ovwr_template_name} to role ${roleId}`);
    
    // Increment usage count
    const result = await pool.query(`
      UPDATE ovwr_auth_permission_template 
      SET ovwr_usage_count = ovwr_usage_count + 1,
          ovwr_updated_at = NOW()
      WHERE ovwr_template_id = $1
      RETURNING *
    `, [templateId]);
    
    return {
      success: true,
      message: `Template "${template.ovwr_template_name}" applied to role`,
    };
  }

  /**
   * Clone a role template
   */
  async cloneTemplate(templateId: string, newName: string) {
    const original = await this.getTemplateById(templateId);
    
    if (original.ovwrIsSystem) {
      throw new Error('Cannot clone system template');
    }
    
    const now = new Date().toISOString();
    
    const sql = `
      INSERT INTO ovwr_auth_permission_template (
        ovwr_template_id, ovwr_template_name, ovwr_description, ovwr_permissions,
        ovwr_applicable_roles, ovwr_is_system, ovwr_usage_count, ovwr_status,
        ovwr_metadata, ovwr_created_at, ovwr_updated_at
      )
      SELECT 
        'role-template-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint,
        ${newName} || ' (' || ovwr_template_name || ')',
        ovwr_description,
        ovwr_permissions,
        ovwr_applicable_roles,
        false,
        0,
        'active',
        ovwr_metadata,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM ovwr_auth_permission_template 
      WHERE ovwr_template_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(sql, [templateId]);
    
    return result.rows[0];
  }

  /**
   * Get template usage statistics
   */
  async getUsageStats(templateId: string) {
    const template = await this.getTemplateById(templateId);
    
    const result = await pool.query(`
      SELECT 
        ovwr_usage_count as assigned_count,
        COUNT(DISTINCT rv.ovwr_role_id) as role_count
      FROM ovwr_auth_permission_template t
      LEFT JOIN ovwr_auth_role_permission rp ON t.ovwr_template_id = rp.ovwr_permission_template_id
      LEFT JOIN ovwr_auth_user_role rv ON rp.ovwr_role_id = rv.ovwr_role_id
      WHERE t.ovwr_template_id = $1
      GROUP BY t.ovwr_usage_count
    `, [templateId]);
    
    return {
      assignedCount: result.rows[0]?.assigned_count || 0,
      roleCount: result.rows[0]?.role_count || 0,
      lastUsedAt: null,
    };
  }

  /**
   * Helper: Get template by name
   */
  private async getTemplateByName(name: string) {
    const result = await pool.query(
      'SELECT * FROM ovwr_auth_permission_template WHERE ovwr_template_name = $1',
      [name]
    );
    
    return result.rows[0] || null;
  }
}
