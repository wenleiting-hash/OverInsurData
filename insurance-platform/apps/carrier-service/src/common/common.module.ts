import { Global, Module } from '@nestjs/common';
import { AuditService } from './services/audit.service';

/** Global cross-cutting services (audit logging). */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class CommonModule {}
