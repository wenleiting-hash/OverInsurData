/**
 * User Preferences Service - Business Logic Implementation
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class PreferencesService {
  /**
   * Generate preference ID (32 chars)
   */
  private generatePreferenceId(): string {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 32);
  }

  /**
   * Get user preferences by user ID
   */
  async getPreferences(userId: string): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT * FROM ovwr_user_preferences WHERE ovwr_user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        // Create default preferences if not exists
        return this.createDefaultPreferences(userId);
      }

      return result.rows[0];
    } catch (error) {
      console.error('[PreferencesService] Error fetching preferences:', error);
      throw new BadRequestException('获取用户偏好失败');
    }
  }

  /**
   * Update or create user preferences
   */
  async updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<any> {
    try {
      // Check if preferences exist
      const existing = await pool.query(
        `SELECT ovwr_preference_id FROM ovwr_user_preferences WHERE ovwr_user_id = $1`,
        [userId]
      );

      if (existing.rows.length > 0) {
        // Update existing preferences
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (dto.languageCode !== undefined) {
          updates.push(`ovwr_language_code = $${paramIndex++}`);
          values.push(dto.languageCode);
        }
        if (dto.dateFormat !== undefined) {
          updates.push(`ovwr_date_format = $${paramIndex++}`);
          values.push(dto.dateFormat);
        }
        if (dto.timeZone !== undefined) {
          updates.push(`ovwr_time_zone = $${paramIndex++}`);
          values.push(dto.timeZone);
        }
        if (dto.themeMode !== undefined) {
          updates.push(`ovwr_theme_mode = $${paramIndex++}`);
          values.push(dto.themeMode);
        }

        if (updates.length === 0) {
          return existing.rows[0]; // No updates needed
        }

        values.push(userId);
        updates.push(`ovwr_updated_at = CURRENT_TIMESTAMP`);

        const query = `
          UPDATE ovwr_user_preferences 
          SET ${updates.join(', ')}
          WHERE ovwr_user_id = $${paramIndex}
          RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows[0];
      } else {
        // Create new preferences
        return this.createDefaultPreferences(userId, dto);
      }
    } catch (error) {
      console.error('[PreferencesService] Error updating preferences:', error);
      throw new BadRequestException('更新用户偏好失败');
    }
  }

  /**
   * Create default preferences for a user
   */
  private async createDefaultPreferences(userId: string, overrides?: Partial<UpdatePreferencesDto>): Promise<any> {
    try {
      console.log(`[createDefaultPreferences] Starting with userId: ${userId}`);
      const preferenceId = this.generatePreferenceId();
      
      const defaults = {
        languageCode: overrides?.languageCode || 'en-US',
        dateFormat: overrides?.dateFormat || 'MM/DD/YYYY',
        timeZone: overrides?.timeZone || 'America/New_York',
        themeMode: overrides?.themeMode || 'light',
      };

      const insertValues = [preferenceId, userId, defaults.languageCode, defaults.dateFormat, defaults.timeZone, defaults.themeMode];
      console.log(`[createDefaultPreferences] Insert values:`, insertValues);
      
      const result = await pool.query(
        `INSERT INTO ovwr_user_preferences 
         (ovwr_preference_id, ovwr_user_id, ovwr_language_code, ovwr_date_format, ovwr_time_zone, ovwr_theme_mode)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        insertValues
      );

      console.log(`[createDefaultPreferences] Created successfully:`, result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('[PreferencesService] Error creating default preferences:', error);
      throw new BadRequestException('创建用户默认偏好失败');
    }
  }
}
