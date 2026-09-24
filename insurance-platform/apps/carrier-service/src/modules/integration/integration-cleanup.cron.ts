import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { IntegrationService } from './integration.service';

/**
 * V1.0.16 T6：过期 nonce 定时清理
 *
 * 实现选型：原生 `setInterval` + NestJS 生命周期钩子，避免引入 `@nestjs/schedule`。
 * 等效语义：每 10 分钟执行一次 `cleanupExpiredNonces()`。
 *
 * 多实例部署注意：当前为单实例 in-process 定时器，多实例下每实例独立清理
 * （DB DELETE 幂等，重复执行无副作用）。
 */
@Injectable()
export class IntegrationCleanupCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IntegrationCleanupCron.name);
  private readonly intervalMs = 10 * 60 * 1000; // 10 分钟
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly integrationService: IntegrationService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      this.integrationService
        .cleanupExpiredNonces()
        .catch(err => this.logger.warn(`nonce cleanup failed: ${(err as Error).message}`));
    }, this.intervalMs);
    // timer.unref 避免阻止进程退出
    if (typeof this.timer.unref === 'function') this.timer.unref();
    this.logger.log('integration nonce cleanup cron scheduled (every 10m)');
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
