/**
 * User Controller - REST API Endpoints
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, GetUserListParams } from './dtos/user.dto';

@ApiTags('User Management')
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get user list with pagination
   */
  @Get('list')
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({ status: 200, description: '返回用户列表' })
  async getUserList(@Query() params: GetUserListParams) {
    return this.userService.getUserList(params);
  }

  /**
   * Create new user
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建新用户' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  async createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  /**
   * Get single user by ID
   */
  @Get(':id')
  @ApiOperation({ summary: '获取单个用户详情' })
  @ApiResponse({ status: 200, description: '返回用户详情' })
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  /**
   * Update existing user
   */
  @Put(':id')
  @ApiOperation({ summary: '更新用户信息' })
  @ApiResponse({ status: 200, description: '用户更新成功' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(id, dto);
  }

  /**
   * Delete user
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除用户' })
  @ApiResponse({ status: 204, description: '用户删除成功' })
  async deleteUser(@Param('id') id: string) {
    await this.userService.deleteUser(id);
  }
}
