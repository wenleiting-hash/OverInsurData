import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, JwtAuthGuard],
  exports: [FinanceService],
})
export class FinanceModule {}
