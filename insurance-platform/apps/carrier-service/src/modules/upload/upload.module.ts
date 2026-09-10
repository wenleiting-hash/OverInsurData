import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  controllers: [UploadController],
  providers: [JwtAuthGuard],
})
export class UploadModule {}
