import { Module } from '@nestjs/common';
import { IntegrationController } from './integration.controller';
import { IntegrationV1Controller } from './v1.controller';
import { IntegrationService } from './integration.service';
import { CryptoService } from '../../common/services/crypto.service';
import { IntegrationCleanupCron } from './integration-cleanup.cron';
import { DictionaryModule } from '../dictionary/dictionary.module';

@Module({
  imports: [DictionaryModule],
  controllers: [IntegrationController, IntegrationV1Controller],
  providers: [IntegrationService, CryptoService, IntegrationCleanupCron],
  exports: [IntegrationService, CryptoService],
})
export class IntegrationModule {}
