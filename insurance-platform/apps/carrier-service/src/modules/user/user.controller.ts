/**
 * User Controller - REST API Endpoints
 *
 * All endpoints require JWT authentication.
 * Write operations additionally verify admin roles.
 */

import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Req,
  HttpCode, HttpStatus,
  UseGuards, ForbiddenException, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, GetUserListParams, ResetPasswordDto, ToggleStatusDto } from './dtos/user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

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

  @Get('list')
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({ status: 200, description: '返回用户列表' })
  async getUserList(@Query() params: GetUserListParams) {
    return this.userService.getUserList(params);
  }

  @Get('departments')
  @ApiOperation({ summary: '获取部门列表' })
  @ApiResponse({ status: 200, description: '返回部门列表' })
  async getDepartments() {
    return this.userService.getDepartments();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建新用户' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  async createUser(@Req() req: any, @Body() dto: CreateUserDto) {
    const operatorUuid = this.assertAdminRole(req, 'createUser');
    return this.userService.createUser(dto, operatorUuid);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个用户详情' })
  @ApiResponse({ status: 200, description: '返回用户详情' })
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户信息' })
  @ApiResponse({ status: 200, description: '用户更新成功' })
  async updateUser(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    const operatorUuid = this.assertAdminRole(req, 'updateUser');
    return this.userService.updateUser(id, dto, operatorUuid);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除用户' })
  @ApiResponse({ status: 200, description: '用户删除成功' })
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    const operatorUuid = this.assertAdminRole(req, 'deleteUser');
    return this.userService.deleteUser(id, operatorUuid);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重置用户密码' })
  @ApiResponse({ status: 200, description: '密码重置成功' })
  async resetPassword(@Req() req: any, @Param('id') id: string, @Body() body: ResetPasswordDto) {
    const operatorUuid = this.assertAdminRole(req, 'resetPassword');
    return this.userService.resetPassword(id, body.newPassword, operatorUuid);
  }

  @Post(':id/toggle-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '切换用户状态' })
  @ApiResponse({ status: 200, description: '状态切换成功' })
  async toggleStatus(@Req() req: any, @Param('id') id: string, @Body() body: ToggleStatusDto) {
    const operatorUuid = this.assertAdminRole(req, 'toggleStatus');
    return this.userService.toggleStatus(id, body.status, operatorUuid);
  }
}
