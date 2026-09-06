/**
 * Authentication Controller
 * 
 * Handles user registration, login, logout, and password management endpoints
 */

import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  Ip,
  Req,
  UseGuards,
  Query,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService, RegisterRequestDto, LoginRequestDto } from './auth.service';
import { PasswordHashingService } from '../../common/services/password-hashing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordHashingService: PasswordHashingService,
  ) {}

  // ==================== Authentication Endpoints ====================
  
  /**
   * Register new user account
   * POST /api/auth/register
   */
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @ApiOperation({ summary: '用户注册', description: '创建新用户账户' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 409, description: '用户名或邮箱已存在' })
  async register(@Body() dto: RegisterRequestDto, @Headers() headers) {
    const result = await this.authService.register(dto);

    return {
      success: true,
      message: result.message,
      data: result.data,
    };
  }

  /**
   * User login
   * POST /api/auth/login
   */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: '用户登录', description: '使用用户名和密码获取 JWT tokens' })
  @ApiResponse({ status: 200, description: '登录成功，返回 access 和 refresh token' })
  @ApiResponse({ status: 401, description: '无效凭证' })
  async login(@Body() dto: LoginRequestDto, @Ip() ip: string, @Headers() headers) {
    console.log('[CONTROLLER] Received DTO:', JSON.stringify(dto));
    const tokens = await this.authService.login(dto);

    // TODO: Store IP and user-agent in refresh token record

    return {
      success: true,
      message: '登录成功',
      data: {
        ...tokens,
        expiresIn: 3600, // Access token expires in 1 hour
        tokenType: 'Bearer',
      },
    };
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: '用户登出', description: '使当前 refresh token 失效' })
  @ApiResponse({ status: 200, description: '登出成功' })
  async logout(@Headers('authorization') authorization: string) {
    const refreshToken = authorization?.replace('Bearer ', '');
    
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    return {
      success: true,
      message: '登出成功',
    };
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: '刷新访问令牌', description: '使用 refresh token 获取新的 access token' })
  @ApiResponse({ status: 200, description: '新 token 生成成功' })
  @ApiResponse({ status: 401, description: '无效的 refresh token' })
  async refreshAccessToken(@Body() body: { refreshToken: string }) {
    // Validate refresh token first
    const isValid = await this.authService.verifyRefreshToken(body.refreshToken);

    if (!isValid) {
      throw new Error('Invalid or expired refresh token');
    }

    // TODO: Implement token regeneration with new payload using actual JWT generation
    // For now, return new mock tokens (will be implemented with jose/jsonwebtoken)
    return {
      success: true,
      message: 'Token 刷新成功',
      data: {
        accessToken: `mock-new-access-token-${Date.now()}`,
        refreshToken: body.refreshToken, // Keep same refresh token for demo
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    };
  }

  /**
   * Change user password
   * POST /api/auth/change-password
   */
  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  @ApiOperation({ summary: '修改密码', description: '更改当前登录用户的密码' })
  @ApiResponse({ status: 200, description: '密码修改成功' })
  @ApiResponse({ status: 401, description: '当前密码不正确' })
  async changePassword(@Req() req, @Body() body: { currentPassword: string; newPassword: string }) {
    await this.authService.changePassword(req.user.userId, body.currentPassword, body.newPassword);

    return {
      success: true,
      message: '密码修改成功',
    };
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: '获取当前用户信息', description: '获取已登录用户的个人资料' })
  @ApiResponse({ status: 200, description: '用户信息' })
  async getCurrentUser(@Req() req) {
    const user = await this.authService.getUserById(req.user.userId);

    return {
      success: true,
      message: '查询成功',
      data: user,
    };
  }
}

// ==================== User Management Controller ====================

@ApiTags('User Management')
@Controller('api/users')
export class UserController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Get users list (with pagination/filters)
   * GET /api/users/list
   */
  @Get('list')
  @ApiOperation({ summary: '获取用户列表', description: '支持分页和多种筛选条件' })
  @ApiResponse({ status: 200, description: '用户列表' })
  async getUsers(@Query() query: any) {
    const users = await this.authService.getUsers(query);

    return {
      success: true,
      message: '查询成功',
      data: users.items,
      total: users.total,
      page: users.page,
      pageSize: users.pageSize,
    };
  }

  /**
   * Create new user
   * POST /api/users
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建新用户' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  async createUser(@Body() dto: any) {
    const user = await this.authService.createUser(dto);
    return {
      success: true,
      message: '创建成功',
      data: user,
    };
  }

  /**
   * Get single user by ID
   * GET /api/users/:id
   */
  @Get(':id')
  @ApiOperation({ summary: '获取单个用户', description: '根据用户 ID 查询详细信息' })
  @ApiResponse({ status: 200, description: '用户详情' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async getUserById(@Param('id') id: string) {
    const user = await this.authService.getUserById(id);

    return {
      success: true,
      message: '查询成功',
      data: user,
    };
  }

  /**
   * Update user
   * PUT /api/users/:id
   */
  @Put(':id')
  @ApiOperation({ summary: '更新用户', description: '更新用户信息' })
  @ApiResponse({ status: 200, description: '用户更新成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async updateUser(@Param('id') id: string, @Body() dto: any) {
    const user = await this.authService.updateUser(id, dto);

    return {
      success: true,
      message: '更新成功',
      data: user,
    };
  }

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除用户', description: '软删除用户（设置为 deleted=true）' })
  @ApiResponse({ status: 200, description: '用户删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async deleteUser(@Param('id') id: string) {
    await this.authService.deleteUser(id);

    return {
      success: true,
      message: '删除成功',
    };
  }

  /**
   * Reset user password
   * POST /api/users/:id/reset-password
   */
  @Post(':id/reset-password')
  @ApiOperation({ summary: '重置密码', description: '管理员为用户重置密码' })
  @ApiResponse({ status: 200, description: '密码重置成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async resetPassword(@Param('id') id: string, @Body() body: { newPassword: string }) {
    await this.authService.resetPassword(id, body.newPassword);

    return {
      success: true,
      message: '密码重置成功',
    };
  }
}
