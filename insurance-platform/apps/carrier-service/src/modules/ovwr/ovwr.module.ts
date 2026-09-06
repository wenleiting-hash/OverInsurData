/**
 * Ovwr Module (Internationalization & Permission Management)
 * Combines i18n and permission services into a single module
 */

import { Module } from '@nestjs/common';
import { OvwrI18nService } from './ovwr-i18n.service';
import { OvwrI18nController } from './ovwr-i18n.controller';
import { OvwrPermissionTemplateController } from './ovwr-permission-template.controller';
import { OvwrRoleService } from './services/ovwr-role.service';
import { OvwrRoleController } from './ovwr-role.controller';

@Module({
  controllers: [
    OvwrI18nController,
    OvwrPermissionTemplateController,
    OvwrRoleController,
  ],
  providers: [OvwrI18nService, OvwrRoleService],
  exports: [OvwrI18nService, OvwrRoleService],
})
export class OvwrModule {}
