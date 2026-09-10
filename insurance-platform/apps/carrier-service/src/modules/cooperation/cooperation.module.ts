import { Module } from '@nestjs/common';
import { CooperationService } from './cooperation.service';
import { CooperationController } from './cooperation.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  controllers: [CooperationController],
  providers: [CooperationService, JwtAuthGuard],
  exports: [CooperationService],
})
export class CooperationModule {}
