/**
 * Authentication Controller
 *
 * Handles user registration, login, logout, and password management endpoints.
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
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService, RegisterRequestDto, LoginRequestDto, SsoExchangeDto } from './auth.service';
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

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 409, description: '用户名或邮箱已存在' })
  async register(@Body() dto: RegisterRequestDto) {
    const result = await this.authService.register(dto);
    return { success: true, message: result.message, data: result.data };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '无效凭证' })
  @ApiResponse({ status: 403, description: '账户已停用/锁定' })
  async login(@Body() dto: LoginRequestDto, @Ip() ip: string) {
    const { accessToken, refreshToken, roles } = await this.authService.login(dto);

    // Decode user info from JWT payload
    const payload = JSON.parse(
      Buffer.from(accessToken.split('.')[1], 'base64').toString(),
    );

    return {
      success: true,
      message: '登录成功',
      data: {
        accessToken,
        refreshToken,
        expiresIn: 3600,
        tokenType: 'Bearer',
        user: {
          userId: payload.userId,
          username: payload.username,
          email: payload.email,
          roles: payload.roles || [],
          authMethod: payload.authMethod || 'local',
        },
      },
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: '用户登出' })
  async logout(@Headers('authorization') authorization: string) {
    const refreshToken = authorization?.replace('Bearer ', '');
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    return { success: true, message: '登出成功' };
  }

  /**
   * V1.0.16 T2 · SSO code 换发
   * workOS 跳转回调后，前端 /sso/callback 携 code+state 调此端点换取本系统 JWT。
   * 不挂 JwtAuthGuard；联调期 WORKOS_MOCK=1 时 mock_user 字段绕过 W1。
   */
  @HttpCode(HttpStatus.OK)
  @Post('sso/exchange')
  @ApiOperation({ summary: 'SSO code 换发本系统令牌' })
  @ApiResponse({ status: 200, description: '换发成功' })
  @ApiResponse({ status: 401, description: 'code 失效或工号未同步' })
  @ApiResponse({ status: 403, description: '账号已停用' })
  async ssoExchange(@Body() dto: SsoExchangeDto) {
    const { accessToken, refreshToken, user } = await this.authService.exchangeSsoCode(dto);
    return {
      success: true,
      message: 'SSO 登录成功',
      data: {
        accessToken,
        refreshToken,
        expiresIn: 3600,
        tokenType: 'Bearer',
        user,
      },
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: '刷新访问令牌' })
  @ApiResponse({ status: 200, description: '新 token 生成成功' })
  @ApiResponse({ status: 401, description: '无效的 refresh token' })
  async refreshAccessToken(@Body() body: { refreshToken: string }) {
    const userPayload = await this.authService.verifyRefreshToken(body.refreshToken);
    if (!userPayload) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const tokens = await this.authService.refreshAccessToken(userPayload);
    return {
      success: true,
      message: 'Token 刷新成功',
      data: { ...tokens, expiresIn: 3600, tokenType: 'Bearer' },
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '修改密码' })
  async changePassword(@Req() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
    await this.authService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
    return { success: true, message: '密码修改成功' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: '获取当前用户信息' })
  async getCurrentUser(@Req() req: any) {
    const user = await this.authService.getUserById(req.user.userId);
    return { success: true, message: '查询成功', data: user };
  }
}
