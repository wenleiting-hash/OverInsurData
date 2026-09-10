import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, JwtAuthGuard],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
