/**
 * Structured Logger Utility
 *
 * Provides consistent logging with sensitive data masking.
 * Use as a replacement for raw console.log across all services.
 *
 * Usage:
 *   import { AppLogger } from '../../common/utils/app-logger';
 *   const logger = new AppLogger(MyService.name);
 *   logger.log('User logged in', { userId: '123' });
 */

import { Logger } from '@nestjs/common';

/** Fields that should be automatically masked in log output */
const SENSITIVE_FIELDS = new Set([
  'password',
  'password_hash',
  'passwordHash',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'token',
  'secret',
  'mfa_secret',
  'creditCard',
  'ssn',
]);

export class AppLogger {
  private readonly logger: Logger;

  constructor(context: string) {
    this.logger = new Logger(context);
  }

  log(message: string, meta?: Record<string, unknown>): void {
    this.logger.log(this.format(message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(this.format(message, meta));
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(this.format(message, meta));
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(this.format(message, meta));
  }

  /**
   * Format log message with optional metadata (auto-masks sensitive fields)
   */
  private format(message: string, meta?: Record<string, unknown>): string {
    if (!meta) return message;
    const sanitized = this.sanitize(meta);
    return `${message} ${JSON.stringify(sanitized)}`;
  }

  /**
   * Deep-sanitize an object, replacing sensitive field values with '[REDACTED]'
   */
  private sanitize(obj: Record<string, unknown>, depth = 0): Record<string, unknown> {
    if (depth > 3) return { '[max depth]' : '...' };
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_FIELDS.has(key)) {
        result[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.sanitize(value as Record<string, unknown>, depth + 1);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}
