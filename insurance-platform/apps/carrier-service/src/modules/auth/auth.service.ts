/**
 * Authentication Service - User Registration and Login
 * 
 * Handles user authentication flows including registration, login, logout, and password management
 */

import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';
import { PasswordHashingService } from '../../common/services/password-hashing.service';
import * as crypto from 'crypto';

/**
 * Auth request data for registration/login
 */
export class RegisterRequestDto {
  username!: string;
  email!: string;
  password!: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/**
 * Login request DTO
 */
export class LoginRequestDto {
  username!: string;
  password!: string;
}

/**
 * JWT tokens response
 */
export class TokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

/**
 * Auth response DTO
 */
export class AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable()
export class AuthService {
  constructor(private readonly passwordHashingService: PasswordHashingService) {}

  /**
   * Register new user account
   */
  async register(dto: RegisterRequestDto): Promise<AuthResponse> {
    // Validate input
    if (!dto.username || !dto.email || !dto.password) {
      throw new BadRequestException('Username, email, and password are required');
    }

    // Check if username exists (public.schema table)
    const result = await pool.query(
      `SELECT user_id FROM auth_user WHERE username = $1`,
      [dto.username]
    );

    if (result.rows[0]) {
      throw new ConflictException('Username already exists');
    }

    // Check if email exists
    const resultEmail = await pool.query(
      `SELECT user_id FROM auth_user WHERE email = $1`,
      [dto.email]
    );

    if (resultEmail.rows[0]) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await this.passwordHashingService.hashPassword(dto.password);

    // Generate UUID for user_id field
    const userId = crypto.randomUUID();

    // Insert user (actual table structure)
    const now = new Date();
    
    const insertResult = await pool.query(`
      INSERT INTO auth_user (
        user_id, username, email, password_hash, real_name, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, '1', $6, $7)
      RETURNING user_id, username, email, real_name as name, status, created_at
    `, [
      userId,
      dto.username,
      dto.email,
      hashedPassword,
      `${dto.firstName || ''} ${dto.lastName || ''}`.trim() || null,
      now,
      now,
    ]);

    return {
      success: true,
      message: 'Registration successful',
      data: insertResult.rows[0],
    };
  }

  /**
   * Authenticate user and generate tokens
   */
  async login(dto: LoginRequestDto): Promise<{ accessToken: string; refreshToken: string }> {
    console.log('[LOGIN] Received login request for username:', dto.username);
    
    try {
      // Find user by username - actual table structure in public schema
      const userResult = await pool.query(`
        SELECT * FROM auth_user 
        WHERE username = $1 AND status = '1'
      `, [dto.username]);

      if (!userResult.rows[0]) {
        console.log('[LOGIN] User not found or inactive');
        throw new UnauthorizedException('Invalid credentials');
      }

      const user = userResult.rows[0];
      console.log('[LOGIN] Found user:', user.username, 'password_hash:', user.password_hash ? 'exists (60 chars)' : 'NULL!');
      console.log('[LOGIN] Full user object:', JSON.stringify(user));

      // Verify password
      const isValid = await this.passwordHashingService.verifyPassword(dto.password, user.password_hash);
      console.log('[LOGIN] Password validation result:', isValid);

      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Update last login time on successful login
      await pool.query(`
        UPDATE auth_user 
        SET last_login_at = NOW(),
            status = '1'
        WHERE user_id = $1
      `, [user.user_id]);

      // Generate tokens (mock implementation - will be enhanced with actual JWT generation)
      const tokens = await this.generateTokens(user);

      return tokens;
    } catch (error) {
      console.error('[LOGIN] ERROR:', error);
      throw error;
    }
  }

  /**
   * Logout user (currently simplified - no token revocation needed)
   */
  async logout(refreshToken: string): Promise<void> {
    // Simplified implementation - client-side token removal is sufficient
    return Promise.resolve();
  }

  /**
   * Change user password
   */
  async changePassword(user_id: string, currentPassword: string, newPassword: string): Promise<void> {
    const userResult = await pool.query('SELECT * FROM auth_user WHERE user_id = $1', [user_id]);

    if (!userResult.rows[0]) {
      throw new UnauthorizedException('User not found');
    }

    const user = userResult.rows[0];

    // Verify current password
    const isValid = await this.passwordHashingService.verifyPassword(currentPassword, user.password_hash);

    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await this.passwordHashingService.hashPassword(newPassword);

    await pool.query(`
      UPDATE auth_user 
      SET password_hash = $1,
          updated_at = NOW()
      WHERE user_id = $2
    `, [hashedPassword, user_id]);
  }

  /**
   * Generate access and refresh tokens (mock implementation)
   */
  private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    // TODO: Implement real JWT token generation using jose or jsonwebtoken package
    
    // Mock implementation for demonstration
    // Use the full user_id from actual table structure
    const userId = user.user_id || user.username || '00000000-0000-0000-0000-000000000000';
    const timestamp = Date.now().toString(36).toUpperCase().slice(-8); // Base36, shorter than decimal
    const accessToken = `AT-${userId}-${timestamp}`.slice(0, 100);
    const refreshToken = `RT-${userId}-${timestamp}`.slice(0, 100);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Hash refresh token before storing (similar to how passwords are stored)
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Get user by ID
   */
  async getUserById(user_id: string): Promise<any> {
    const userResult = await pool.query(
      'SELECT user_id, username, email, real_name as name, status, dept_code FROM auth_user WHERE user_id = $1',
      [user_id]
    );

    return userResult.rows[0];
  }

  /**
   * Verify refresh token (simplified - currently not using refresh tokens)
   */
  async verifyRefreshToken(refreshToken: string): Promise<boolean> {
    // Currently not implementing refresh token logic
    return true;
  }

  // ==================== User Management Methods ====================

  /**
   * Get users list with pagination and filters
   */
  async getUsers({
    page = 1,
    pageSize = 20,
    search,
    deptFilter,
    statusFilter,
    roleFilter
  }: {
    page?: number;
    pageSize?: number;
    search?: string;
    deptFilter?: string;
    statusFilter?: string;
    roleFilter?: string;
  }): Promise<any> {
    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClauses.push(`(username ILIKE $${paramIndex} OR real_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (statusFilter) {
      whereClauses.push(`status = $${paramIndex}`);
      params.push(statusFilter);
      paramIndex++;
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Get total count first
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM auth_user${whereClause ? ` ${whereClause}` : ''}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated users
    const offset = (page - 1) * pageSize;
    const usersResult = await pool.query(`
      SELECT 
        user_id,
        username,
        email,
        real_name as name,
        phone,
        avatar_url as avatarUrl,
        status,
        last_login_at,
        created_at,
        updated_at
      FROM auth_user
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, pageSize, offset]);

    // Get roles for each user
    const usersWithRoles = await Promise.all(
      usersResult.rows.map(async (user) => {
        const rolesResult = await pool.query(`
          SELECT ar.role_code,
                 ar.role_name_zh
          FROM auth_user_role aur
          JOIN auth_role ar ON aur.role_id = ar.role_id
          WHERE aur.user_id = $1
        `, [user.user_id]);

        // Convert database status ('1'=active, '0'=inactive, etc.) to frontend format
        let frontendStatus: 'active' | 'inactive' | 'locked' | 'pending' = 'active';
        if (user.status === '0') frontendStatus = 'inactive';
        else if (user.status === '2') frontendStatus = 'locked';
        else if (user.status === '3') frontendStatus = 'pending';
        else frontendStatus = 'active'; // default for '1'

        return {
          ...user,
          id: user.user_id,
          roles: rolesResult.rows.map(r => r.role_code),
          authMethod: 'local',
          nameEn: null,
          status: frontendStatus, // Use frontend-compatible status
        };
      })
    );

    return {
      items: usersWithRoles,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * Create new user
   */
  async createUser(userData: any): Promise<any> {
    // Check if username exists
    const usernameCheck = await pool.query(
      'SELECT user_id FROM auth_user WHERE username = $1',
      [userData.username]
    );

    if (usernameCheck.rows[0]) {
      throw new ConflictException('Username already exists');
    }

    // Check if email exists
    const emailCheck = await pool.query(
      'SELECT user_id FROM auth_user WHERE email = $1',
      [userData.email]
    );

    if (emailCheck.rows[0]) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await this.passwordHashingService.hashPassword(userData.password);

    // Generate UUID for user_id
    const userId = crypto.randomUUID();

    // Insert user
    const now = new Date();
    const insertResult = await pool.query(`
      INSERT INTO auth_user (
        user_id, username, email, password_hash, real_name, phone,
        dept_code, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9)
      RETURNING user_id, username, email, real_name as name, phone, dept_code, status, created_at
    `, [
      userId,
      userData.username,
      userData.email,
      hashedPassword,
      userData.name || userData.realName || null,
      userData.phone || null,
      userData.deptCode || 'tech',
      now,
      now
    ]);

    // Assign roles if provided
    if (userData.roles && userData.roles.length > 0) {
      for (const roleId of userData.roles) {
        await pool.query(`
          INSERT INTO auth_user_role (user_id, role_id, assigned_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT DO NOTHING
        `, [userId, roleId]);
      }
    }

    return insertResult.rows[0];
  }

  /**
   * Update user
   */
  async updateUser(userId: string, userData: any): Promise<any> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (userData.name !== undefined) {
      updates.push(`real_name = $${paramIndex++}`);
      params.push(userData.name);
    }

    if (userData.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      params.push(userData.email);
    }

    if (userData.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      params.push(userData.phone);
    }

    if (userData.deptCode !== undefined) {
      updates.push(`dept_code = $${paramIndex++}`);
      params.push(userData.deptCode);
    }

    if (userData.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(userData.status);
    }

    if (updates.length === 0) {
      return await this.getUserById(userId);
    }

    updates.push(`updated_at = $${paramIndex++}`);
    params.push(new Date());
    params.push(userId);

    await pool.query(`
      UPDATE auth_user 
      SET ${updates.join(', ')}
      WHERE user_id = $${paramIndex}
    `, params);

    return await this.getUserById(userId);
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    await pool.query(
      `UPDATE auth_user SET deleted = TRUE, updated_at = NOW() WHERE user_id = $1`,
      [userId]
    );
  }

  /**
   * Reset user password
   */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.passwordHashingService.hashPassword(newPassword);

    await pool.query(`
      UPDATE auth_user 
      SET password_hash = $1, mfa_enabled = FALSE, updated_at = NOW()
      WHERE user_id = $2
    `, [hashedPassword, userId]);
  }
}
