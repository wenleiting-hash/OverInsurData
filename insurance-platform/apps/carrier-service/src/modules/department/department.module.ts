/**
 * Department Management Module
 *
 * Registers DepartmentService and DepartmentController.
 */

import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [],
  controllers: [DepartmentController],
  providers: [DepartmentService, JwtAuthGuard],
  exports: [DepartmentService],
})
export class DepartmentModule {}
