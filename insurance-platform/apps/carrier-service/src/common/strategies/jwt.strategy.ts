/**
 * JWT Strategy for Passport Authentication
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
}

export interface JWTPayloadWithUser extends JwtPayload {
  roles?: string[];
  permissions?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private jwtSecret: string;

  constructor(private readonly configService?: ConfigService) {
    const jwtSecret = configService?.get<string>('JWT_SECRET') || 'overinsur-secret-key-change-in-production';
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
      algorithms: ['HS256'],
      passReqToCallback: true,
    });
    
    this.jwtSecret = jwtSecret;
  }

  async validate(req: any, payload: JwtPayload): Promise<JWTPayloadWithUser> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (typeof token === 'string' && token.startsWith('AT-')) {
      const firstDashIndex = token.indexOf('-');
      const secondDashIndex = token.indexOf('-', firstDashIndex + 1);
      
      if (firstDashIndex === -1 || secondDashIndex === -1) {
        throw new UnauthorizedException('Invalid mock token format');
      }
      
      const userId = token.substring(firstDashIndex + 1, secondDashIndex);
      
      return {
        userId: userId,
        username: userId,
        email: userId + '@example.com',
        roles: [],
        permissions: [],
      };
    }
    
    return {
      userId: payload.userId,
      username: payload.username || payload.userId,
      email: payload.email || payload.userId + '@example.com',
      roles: [],
      permissions: [],
    };
  }
}
