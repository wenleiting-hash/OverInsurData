/**
 * Role Controller - REST API Endpoints for Role Management
 *
 * All endpoints require JWT authentication.
 * Write operations verify admin roles.
 */

import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Req,
  HttpCode, HttpStatus,
  UseGuards, ForbiddenException, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService, CreateRoleDto, UpdateRoleDto } from './role.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Role Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/roles')
export class RoleController {
  private readonly logger = new Logger(RoleController.name);

  constructor(private readonly roleService: RoleService) {}

  private assertAdminRole(req: any, action: string): string {
    const roles: string[] = req.user?.roles || [];
    if (!roles.includes('super_admin')) {
      this.logger.warn(`Permission denied: ${req.user?.username} attempted ${action}`);
      throw new ForbiddenException(`Insufficient permissions for: ${action}`);
    }
    return req.user?.userId;
  }

  @Get()
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResponse({ status: 200, description: '返回角色列表' })
  async getRoleList() {
    return this.roleService.getRoleList();
  }

  @Get(':roleKey')
  @ApiOperation({ summary: '获取单个角色详情' })
  @ApiResponse({ status: 200, description: '返回角色详情' })
  async getRoleByKey(@Param('roleKey') roleKey: string) {
    return this.roleService.getRoleByKey(roleKey);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建新角色' })
  @ApiResponse({ status: 201, description: '角色创建成功' })
  async createRole(@Req() req: any, @Body() dto: CreateRoleDto) {
    this.assertAdminRole(req, 'createRole');
    return this.roleService.createRole(dto);
  }

  @Put(':roleKey')
  @ApiOperation({ summary: '更新角色' })
  @ApiResponse({ status: 200, description: '角色更新成功' })
  async updateRole(@Req() req: any, @Param('roleKey') roleKey: string, @Body() dto: UpdateRoleDto) {
    this.assertAdminRole(req, 'updateRole');
    return this.roleService.updateRole(roleKey, dto);
  }

  @Delete(':roleKey')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除角色' })
  @ApiResponse({ status: 200, description: '角色删除成功' })
  async deleteRole(@Req() req: any, @Param('roleKey') roleKey: string) {
    this.assertAdminRole(req, 'deleteRole');
    return this.roleService.deleteRole(roleKey);
  }
}
