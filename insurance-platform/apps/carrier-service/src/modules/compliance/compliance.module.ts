import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  controllers: [ComplianceController],
  providers: [ComplianceService, JwtAuthGuard],
  exports: [ComplianceService],
})
export class ComplianceModule {}
