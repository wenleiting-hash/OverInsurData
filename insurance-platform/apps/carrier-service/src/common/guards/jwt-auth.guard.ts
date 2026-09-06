/**
 * JWT Authentication Guard
 * 
 * Extends NestJS Passport JWT guard for API authentication
 * Falls back to mock token parsing if real JWT verification fails
 */

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    // If this is a mock token, skip passport-jwt signature verification and parse manually
    if (typeof token === 'string' && token.startsWith('AT-')) {
      console.log('[JwtAuthGuard] Detected mock token, parsing manually');
      // Parse Mock Token format: AT-{userId}-{timestamp}
      // Example: AT-966ea557-MTOO5ZQL -> userId = "966ea557"
      const firstDashIndex = token.indexOf('-');
      const secondDashIndex = token.indexOf('-', firstDashIndex + 1);
      
      if (firstDashIndex === -1 || secondDashIndex === -1) {
        throw new UnauthorizedException('Invalid mock token format');
      }
      
      const userId = token.substring(firstDashIndex + 1, secondDashIndex);
      
      // Set user directly on request
      request.user = {
        userId: userId,
        username: userId,
        email: `${userId}@example.com`,
        roles: [],
        permissions: [],
      };
      
      return true; // Bypass passport-jwt validation for mock tokens
    }
    
    // For real JWTs, use standard passport validation
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    // Handle any passport errors or fall back to mock token parsing
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}
