/**
 * JWT Strategy for Passport Authentication
 *
 * Validates JWT tokens signed with HS256 and extracts user info including roles.
 */

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  roles?: string[];
  authMethod?: string;
}

export interface JWTPayloadWithUser extends JwtPayload {
  permissions?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly configService?: ConfigService) {
    const jwtSecret = configService?.get<string>('JWT_SECRET') || 'overinsur-jwt-secret-change-in-production';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
      algorithms: ['HS256'],
      passReqToCallback: true,
    });
  }

  async validate(_req: any, payload: JwtPayload): Promise<JWTPayloadWithUser> {
    if (!payload?.userId) {
      this.logger.warn('JWT validation failed: missing userId in payload');
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.userId,
      username: payload.username || payload.userId,
      email: payload.email || '',
      roles: payload.roles || [],
      authMethod: payload.authMethod,
      permissions: [],
    };
  }
}
