/**
 * Department Controller - REST API Endpoints
 *
 * All endpoints require JWT authentication.
 * Write operations additionally verify admin roles.
 */

import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Req,
  HttpCode, HttpStatus,
  UseGuards, ForbiddenException, Logger,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto, UpdateDepartmentDto, GetDepartmentMembersParams } from './dtos/department.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Department Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/departments')
export class DepartmentController {
  private readonly logger = new Logger(DepartmentController.name);

  constructor(private readonly departmentService: DepartmentService) {}

  /**
   * Verify that the current user has at least one of the required roles.
   */
  private assertAdminRole(req: any, action: string): string {
    const roles: string[] = req.user?.roles || [];
    const adminRoles = ['super_admin', 'ops_manager'];
    const hasAdmin = roles.some((r: string) => adminRoles.includes(r));
    if (!hasAdmin) {
      this.logger.warn(`Permission denied: ${req.user?.username} attempted ${action} with roles [${roles.join(',')}]`);
      throw new ForbiddenException(`Insufficient permissions for: ${action}`);
    }
    return req.user?.userId;
  }

  @Get('tree')
  @ApiOperation({ summary: '获取部门树形结构' })
  @ApiResponse({ status: 200, description: '返回部门树' })
  async getTree() {
    return this.departmentService.getDepartmentTree();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个部门详情' })
  @ApiResponse({ status: 200, description: '返回部门详情' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.departmentService.getDepartmentById(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: '获取部门成员列表' })
  @ApiResponse({ status: 200, description: '返回部门成员' })
  async getMembers(
    @Param('id', ParseIntPipe) id: number,
    @Query() params: GetDepartmentMembersParams,
  ) {
    return this.departmentService.getDepartmentMembers(id, params);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建部门' })
  @ApiResponse({ status: 201, description: '部门创建成功' })
  async create(@Req() req: any, @Body() dto: CreateDepartmentDto) {
    const operatorUuid = this.assertAdminRole(req, 'createDepartment');
    return this.departmentService.createDepartment(dto, operatorUuid);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新部门信息' })
  @ApiResponse({ status: 200, description: '部门更新成功' })
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
  ) {
    const operatorUuid = this.assertAdminRole(req, 'updateDepartment');
    return this.departmentService.updateDepartment(id, dto, operatorUuid);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除部门（级联软删除）' })
  @ApiResponse({ status: 200, description: '部门删除成功' })
  async delete(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const operatorUuid = this.assertAdminRole(req, 'deleteDepartment');
    return this.departmentService.deleteDepartment(id, operatorUuid);
  }
}
