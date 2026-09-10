/**
 * Authentication Service - User Registration and Login
 *
 * Handles user authentication flows including registration, login, logout, and password management.
 * Uses unified auth_user schema V5 columns (user_uuid as business key).
 */

import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { IsString, IsNotEmpty, IsEmail, IsOptional, MinLength } from 'class-validator';
import { pool } from '../../database/drizzle.client';
import { PasswordHashingService } from '../../common/services/password-hashing.service';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

// ─── Constants ──────────────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

// ─── DTOs ───────────────────────────────────────────────────────────

export class RegisterRequestDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  nameZh?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginRequestDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class TokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export class AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  // In-memory refresh token store (production should use Redis)
  private readonly refreshTokenStore = new Map<string, { userUuid: string; expiresAt: number }>();

  constructor(private readonly passwordHashingService: PasswordHashingService) {
    this.jwtSecret = process.env.JWT_SECRET || 'overinsur-jwt-secret-change-in-production';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'overinsur-refresh-secret-change-in-production';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '1h';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  /**
   * Register new user account
   */
  async register(dto: RegisterRequestDto): Promise<AuthResponse> {
    if (!dto.username || !dto.email || !dto.password) {
      throw new BadRequestException('Username, email, and password are required');
    }

    // Check if username exists
    const result = await pool.query(
      `SELECT user_uuid FROM auth_user WHERE username = $1 AND deleted = FALSE`,
      [dto.username],
    );
    if (result.rows[0]) {
      throw new ConflictException('Username already exists');
    }

    // Check if email exists
    const resultEmail = await pool.query(
      `SELECT user_uuid FROM auth_user WHERE email = $1 AND deleted = FALSE`,
      [dto.email],
    );
    if (resultEmail.rows[0]) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await this.passwordHashingService.hashPassword(dto.password);

    // Generate UUID for business key
    const userUuid = crypto.randomUUID();

    // Resolve name: prefer nameZh/nameEn, fallback to firstName/lastName
    const nameZh = dto.nameZh || `${dto.firstName || ''} ${dto.lastName || ''}`.trim() || null;
    const nameEn = dto.nameEn || null;

    const insertResult = await pool.query(`
      INSERT INTO auth_user (
        user_uuid, username, email, password_hash, name_zh, name_en,
        phone, status, auth_method, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', 'local', NOW(), NOW())
      RETURNING user_uuid, username, email, name_zh, name_en, status, created_at
    `, [
      userUuid, dto.username, dto.email, hashedPassword,
      nameZh, nameEn, dto.phone || null,
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
  async login(dto: LoginRequestDto): Promise<{ accessToken: string; refreshToken: string; roles: string[] }> {
    this.logger.log(`Login attempt for username: ${dto.username}`);

    // Find user by username (only non-deleted users)
    const userResult = await pool.query(`
      SELECT id, user_uuid, username, email, password_hash, name_zh, name_en,
             status, auth_method, failed_login_attempts, locked_until,
             dept_code, login_count
      FROM auth_user
      WHERE username = $1 AND deleted = FALSE
    `, [dto.username]);

    if (!userResult.rows[0]) {
      this.logger.warn(`Login failed: user not found - ${dto.username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = userResult.rows[0];

    // Check account status
    if (user.status === 'inactive') {
      throw new ForbiddenException('Account is deactivated. Contact administrator.');
    }
    if (user.status === 'pending') {
      throw new ForbiddenException('Account is pending activation. Verify your email first.');
    }

    // Check account lockout
    if (user.status === 'locked' || (user.locked_until && new Date(user.locked_until) > new Date())) {
      const remainingMs = user.locked_until ? new Date(user.locked_until).getTime() - Date.now() : 0;
      if (remainingMs > 0) {
        const minutes = Math.ceil(remainingMs / 60000);
        throw new ForbiddenException(`Account is locked. Try again in ${minutes} minute(s).`);
      }
      // Lock expired — unlock the account
      await pool.query(`
        UPDATE auth_user SET status = 'active', locked_until = NULL, failed_login_attempts = 0, updated_at = NOW()
        WHERE user_uuid = $1
      `, [user.user_uuid]);
    }

    // Verify password
    const isValid = await this.passwordHashingService.verifyPassword(dto.password, user.password_hash);

    if (!isValid) {
      // Increment failed login attempts
      const newAttempts = (user.failed_login_attempts || 0) + 1;
      const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;
      const lockedUntil = shouldLock
        ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
        : null;

      await pool.query(`
        UPDATE auth_user
        SET failed_login_attempts = $1,
            locked_until = $2,
            status = $3,
            updated_at = NOW()
        WHERE user_uuid = $4
      `, [
        newAttempts,
        lockedUntil,
        shouldLock ? 'locked' : user.status,
        user.user_uuid,
      ]);

      if (shouldLock) {
        this.logger.warn(`Account locked after ${newAttempts} failed attempts: ${user.username}`);
        throw new ForbiddenException(`Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`);
      }

      this.logger.warn(`Login failed: invalid password (${newAttempts}/${MAX_FAILED_ATTEMPTS}) - ${user.username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Successful login — reset failed attempts and update tracking
    await pool.query(`
      UPDATE auth_user
      SET last_login_at = NOW(),
          last_login_ip = NULL,
          login_count = login_count + 1,
          failed_login_attempts = 0,
          locked_until = NULL,
          status = 'active',
          updated_at = NOW()
      WHERE user_uuid = $1
    `, [user.user_uuid]);

    // Query real user roles from auth_user_role JOIN auth_role
    const rolesResult = await pool.query(`
      SELECT r.role_key, r.role_name_zh
      FROM auth_user_role ur
      JOIN auth_role r ON ur.role_id = r.role_id
      WHERE ur.user_id = $1 AND r.deleted = FALSE
    `, [user.id]);

    const roles = rolesResult.rows.map((r: any) => r.role_key);

    this.logger.log(`Login successful for user: ${user.username} (${user.user_uuid}), roles: [${roles.join(', ')}]`);

    // Generate JWT tokens
    const tokens = await this.generateTokens({ ...user, roles });
    return { ...tokens, roles };
  }

  /**
   * Logout user — invalidate refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as jwt.JwtPayload;
      if (decoded?.jti) {
        this.refreshTokenStore.delete(decoded.jti);
        this.logger.log(`Refresh token revoked: ${decoded.jti}`);
      }
    } catch {
      // Token already invalid or expired, nothing to revoke
    }
  }

  /**
   * Change user password
   */
  async changePassword(userUuid: string, currentPassword: string, newPassword: string): Promise<void> {
    const userResult = await pool.query(
      'SELECT * FROM auth_user WHERE user_uuid = $1 AND deleted = FALSE',
      [userUuid],
    );

    if (!userResult.rows[0]) {
      throw new UnauthorizedException('User not found');
    }

    const user = userResult.rows[0];
    const isValid = await this.passwordHashingService.verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await this.passwordHashingService.hashPassword(newPassword);

    await pool.query(`
      UPDATE auth_user
      SET password_hash = $1, updated_at = NOW()
      WHERE user_uuid = $2
    `, [hashedPassword, userUuid]);
  }

  /**
   * Generate signed JWT access and refresh tokens
   */
  private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      userId: user.user_uuid,
      username: user.username,
      email: user.email,
      roles: user.roles || [],
      authMethod: user.auth_method || 'local',
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry as any,
      algorithm: 'HS256',
    });

    const jti = crypto.randomUUID();
    const refreshToken = jwt.sign(
      { ...payload, jti },
      this.jwtRefreshSecret,
      { expiresIn: this.refreshTokenExpiry as any, algorithm: 'HS256' },
    );

    const refreshExpiryMs = this.parseExpiryToMs(this.refreshTokenExpiry);
    this.refreshTokenStore.set(jti, {
      userUuid: user.user_uuid,
      expiresAt: Date.now() + refreshExpiryMs,
    });

    return { accessToken, refreshToken };
  }

  private parseExpiryToMs(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 3600 * 1000;
    const value = parseInt(match[1], 10);
    const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * (multipliers[match[2]] || 86400000);
  }

  /**
   * Get user by UUID
   */
  async getUserById(userUuid: string): Promise<any> {
    const userResult = await pool.query(`
      SELECT u.user_uuid, u.username, u.email, u.name_zh, u.name_en,
             u.status, u.dept_code, u.auth_method, u.phone, u.avatar_url,
             d.dept_name_zh, d.dept_name_en
      FROM auth_user u
      LEFT JOIN auth_department d ON u.dept_code = d.dept_code
      WHERE u.user_uuid = $1 AND u.deleted = FALSE
    `, [userUuid]);

    if (!userResult.rows[0]) {
      return null;
    }

    // Also get roles
    const user = userResult.rows[0];
    const rolesResult = await pool.query(`
      SELECT r.role_key FROM auth_user_role ur
      JOIN auth_role r ON ur.role_id = r.role_id
      JOIN auth_user au ON ur.user_id = au.id
      WHERE au.user_uuid = $1 AND r.deleted = FALSE
    `, [userUuid]);

    return { ...user, roles: rolesResult.rows.map((r: any) => r.role_key) };
  }

  /**
   * Verify refresh token — check signature, expiry, and revocation status
   */
  async verifyRefreshToken(refreshToken: string): Promise<{ userId: string; username: string; email: string } | null> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as jwt.JwtPayload & { jti?: string };

      if (decoded.jti) {
        const stored = this.refreshTokenStore.get(decoded.jti);
        if (!stored || stored.expiresAt < Date.now()) {
          this.logger.warn(`Refresh token revoked or expired: ${decoded.jti}`);
          return null;
        }
        this.refreshTokenStore.delete(decoded.jti);
      }

      return {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
      };
    } catch {
      this.logger.warn('Refresh token verification failed');
      return null;
    }
  }

  /**
   * Generate new access token from verified refresh token user data
   */
  async refreshAccessToken(userPayload: { userId: string; username: string; email: string }): Promise<{ accessToken: string; refreshToken: string }> {
    const userResult = await pool.query(`
      SELECT id, user_uuid, username, email, status, auth_method
      FROM auth_user
      WHERE user_uuid = $1 AND status = 'active' AND deleted = FALSE
    `, [userPayload.userId]);

    if (!userResult.rows[0]) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    // Get roles
    const rolesResult = await pool.query(`
      SELECT r.role_key FROM auth_user_role ur
      JOIN auth_role r ON ur.role_id = r.role_id
      WHERE ur.user_id = $1 AND r.deleted = FALSE
    `, [userResult.rows[0].id]);

    const user = { ...userResult.rows[0], roles: rolesResult.rows.map((r: any) => r.role_key) };
    return this.generateTokens(user);
  }
}
