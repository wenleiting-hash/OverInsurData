import { Module } from '@nestjs/common';
import { InsurerService } from './insurer.service';
import { InsurerController } from './insurer.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  controllers: [InsurerController],
  providers: [InsurerService, JwtAuthGuard],
  exports: [InsurerService],
})
export class InsurerModule {}
