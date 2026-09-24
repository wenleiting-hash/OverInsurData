import { Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  controllers: [ChannelController],
  providers: [ChannelService, JwtAuthGuard],
  exports: [ChannelService],
})
export class ChannelModule {}
