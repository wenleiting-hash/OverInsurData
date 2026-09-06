/**
 * User Management Module
 * ✅ Fixed: Removed database constructor dependency
 * Uses mock data until real DB integration is configured
 */

import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CreateUserDto, UpdateUserDto } from './dtos/user.dto';

@Module({
  imports: [], // No external dependencies needed now (mock data)
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
