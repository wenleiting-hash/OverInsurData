/**
 * JWT Authentication Guard
 * 
 * Uses standard passport-jwt validation for all requests.
 * Mock token bypass has been removed for security.
 */

import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.warn(`Authentication failed: ${info?.message || err?.message || 'unknown'}`);
      throw err || new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}
