/**
 * User Preferences Controller
 * 
 * API Endpoints:
 * - GET /api/users/preferences/current - Get current user's preferences
 * - PUT /api/users/preferences/current - Update current user's preferences
 */

import {
  Controller,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PreferencesService } from './preferences.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@ApiTags('User Preferences')
@Controller('api/users/preferences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  /**
   * Get current user's preferences
   * 
   * Retrieves the authenticated user's language, timezone, and theme settings
   */
  @Get('current')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取当前用户偏好设置', description: '获取已登录用户的语言、时区和主题偏好' })
  @ApiResponse({ status: 200, description: '成功获取偏好设置' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  async getCurrentPreferences(@Req() req: any) {
    console.log('[PrefsController] req.user:', req.user);
    const userId = req.user?.userId;
    console.log('[PrefsController] Extracted userId:', userId);
    
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    
    const preferences = await this.preferencesService.getPreferences(userId);
    
    return {
      success: true,
      message: '获取成功',
      data: preferences,
    };
  }

  /**
   * Update current user's preferences
   */
  @Put('current')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新当前用户偏好设置', description: '支持增量更新指定的偏好字段' })
  @ApiResponse({ status: 200, description: '成功更新偏好设置' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 400, description: '参数验证失败' })
  async updateCurrentPreferences(
    @Req() req: any,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const userId = req.user.userId;
    const preferences = await this.preferencesService.updatePreferences(userId, dto);
    
    return {
      success: true,
      message: '更新成功',
      data: preferences,
    };
  }
}
