/**
 * Request Tracing Middleware
 *
 * Attaches a unique request ID to every incoming request and logs
 * structured information including method, URL, status, and duration.
 *
 * Usage: Register in AppModule via `app.use(RequestTracingMiddleware)`
 * or configure in a middleware consumer.
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class RequestTracingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    // Generate unique request ID
    const requestId = crypto.randomUUID().substring(0, 8);
    const startTime = Date.now();

    // Attach to request for downstream access
    (req as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    // Log on response finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { method, originalUrl, ip } = req;
      const { statusCode } = res;

      // Determine log level based on status code
      const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';

      const message = `${method} ${originalUrl} ${statusCode} ${duration}ms [${requestId}]`;

      switch (level) {
        case 'error':
          this.logger.error(message);
          break;
        case 'warn':
          this.logger.warn(message);
          break;
        default:
          this.logger.log(message);
      }
    });

    next();
  }
}
