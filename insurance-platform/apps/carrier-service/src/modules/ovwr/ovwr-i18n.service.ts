import { Injectable, NotFoundException } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';

/**
 * I18n Service - Handles multi-language translation management
 */
@Injectable()
export class OvwrI18nService {
  /**
   * Get all translations with pagination and filters
   */
  async getTranslations({
    namespace,
    module,
    search,
    type,
    page = 1,
    pageSize = 20,
  }: {
    namespace?: string;
    module?: string;
    search?: string;
    type?: string;
    page?: number;
    pageSize?: number;
  }) {
    const offset = (page - 1) * pageSize;
    
    // Build WHERE clause safely
    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (namespace) {
      conditions.push(`ovwr_namespace = $${paramIndex++}`);
      values.push(namespace);
    }
    if (module) {
      conditions.push(`ovwr_module = $${paramIndex++}`);
      values.push(module);
    }
    if (type) {
      conditions.push(`ovwr_type = $${paramIndex++}`);
      values.push(type);
    }
    if (search) {
      conditions.push(
        `(ovwr_key ILIKE $${paramIndex++} OR ovwr_en_us ILIKE $${paramIndex++} OR ovwr_zh_cn ILIKE $${paramIndex++})`
      );
      const searchPattern = `%${search}%`;
      values.push(searchPattern, searchPattern, searchPattern);
    }
    
    const whereClause = conditions.join(' AND ');
    
    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*) as total 
      FROM ovwr_auth_i18n_translation 
      WHERE ${whereClause}
    `, values);
    
    const total = parseInt(countResult.rows[0].total);
    const pages = Math.ceil(total / pageSize);
    
    // Get paginated results
    const selectSQL = `
      SELECT * 
      FROM ovwr_auth_i18n_translation 
      WHERE ${whereClause}
      ORDER BY ovwr_created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const finalValues = [...values, pageSize, offset];
    
    const results = await pool.query(selectSQL, finalValues);
    
    return {
      total,
      pages,
      page,
      pageSize,
      data: results.rows,
    };
  }
  
  /**
   * Get a single translation by ID
   */
  async getTranslation(id: string): Promise<any> {
    const result = await pool.query(
      'SELECT * FROM ovwr_auth_i18n_translation WHERE ovwr_translation_id = $1',
      [id]
    );
    
    if (!result.rows[0]) {
      throw new NotFoundException(`Translation with ID ${id} not found`);
    }
    
    return result.rows[0];
  }
  
  /**
   * Create a new translation
   */
  async createTranslation(data: any): Promise<any> {
    const now = new Date().toISOString();
    
    const sql = `
      INSERT INTO ovwr_auth_i18n_translation (
        ovwr_translation_id, ovwr_namespace, ovwr_key, ovwr_en_us, ovwr_zh_cn,
        ovwr_type, ovwr_status, ovwr_metadata, ovwr_created_at, ovwr_updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const result = await pool.query(sql, [
      data.ovwrTranslationId || `i18n-${Date.now()}`,
      data.ovwrNamespace,
      data.ovwrKey,
      data.ovwrEnUs,
      data.ovwrZhCn || null,
      data.ovwrType || 'label',
      data.ovwrStatus || '1',
      data.ovwrMetadata || null,
      now,
      now,
    ]);
    
    return result.rows[0];
  }
  
  /**
   * Update an existing translation
   */
  async updateTranslation(id: string, data: any): Promise<any> {
    // Check existence
    await this.getTranslation(id);
    
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    const fields = [
      { key: 'ovwrNamespace', value: data.ovwrNamespace },
      { key: 'ovwrKey', value: data.ovwrKey },
      { key: 'ovwrEnUs', value: data.ovwrEnUs },
      { key: 'ovwrZhCn', value: data.ovwrZhCn },
      { key: 'ovwrType', value: data.ovwrType },
      { key: 'ovwrStatus', value: data.ovwrStatus },
      { key: 'ovwrMetadata', value: data.ovwrMetadata },
    ];
    
    fields.forEach(({ key, value }) => {
      if (value !== undefined && value !== null) {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });
    
    updates.push(`ovwr_updated_at = $${paramIndex++}`);
    values.push(now);
    
    const sql = `
      UPDATE ovwr_auth_i18n_translation 
      SET ${updates.join(', ')}
      WHERE ovwr_translation_id = $${paramIndex++}
      RETURNING *
    `;
    
    const result = await pool.query(sql, values);
    
    return result.rows[0];
  }
  
  /**
   * Delete a translation
   */
  async deleteTranslation(id: string): Promise<void> {
    const result = await pool.query(
      'DELETE FROM ovwr_auth_i18n_translation WHERE ovwr_translation_id = $1 RETURNING *',
      [id]
    );
    
    if (!result.rows[0]) {
      throw new NotFoundException(`Translation with ID ${id} not found`);
    }
  }
}
