import { Module } from '@nestjs/common';
import { DictionaryController } from './dictionary.controller';
import { DictionaryService } from './dictionary.service';
import { DictPermissionGuard } from './dict-permission.guard';

@Module({
  controllers: [DictionaryController],
  providers: [DictionaryService, DictPermissionGuard],
  exports: [DictionaryService],
})
export class DictionaryModule {}
