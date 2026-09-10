/**
 * User Management Module
 *
 * Registers UserService, RoleService, and their controllers.
 */

import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { RoleService } from './role.service';
import { UserController } from './user.controller';
import { RoleController } from './role.controller';
import { PasswordHashingService } from '../../common/services/password-hashing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [],
  controllers: [UserController, RoleController],
  providers: [UserService, RoleService, PasswordHashingService, JwtAuthGuard],
  exports: [UserService, RoleService, PasswordHashingService],
})
export class UserModule {}
