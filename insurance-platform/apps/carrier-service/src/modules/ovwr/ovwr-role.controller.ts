/**
 * Ovwr Role Management Controller
 * 
 * RESTful API endpoints for role template management
 * Base Route: /api/ovwr/roles
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OvwrRoleService } from './services/ovwr-role.service';

/**
 * Create Role Template DTO
 */
export class CreateRoleTemplateDto {
  ovwrTemplateName: string;
  ovwrDescription?: string;
  ovwrPermissions: Array<{ ovwrPermissionId: string }>;
  ovwrApplicableRoles?: string[];
  ovwrIsSystem?: boolean;
}

/**
 * Update Role Template DTO
 */
export class UpdateRoleTemplateDto {
  ovwrTemplateName?: string;
  ovwrDescription?: string;
  ovwrPermissions?: Array<{ ovwrPermissionId: string }>;
  ovwrApplicableRoles?: string[];
}

/**
 * Apply Template DTO
 */
export class ApplyTemplateDto {
  ovwrRoleId: string;
}

@ApiTags('Ovwr Role Management')
@ApiBearerAuth()
@Controller('api/ovwr/roles')
export class OvwrRoleController {
  constructor(private readonly roleService: OvwrRoleService) {}

  @Get()
  @ApiOperation({ summary: '查询角色模板列表' })
  @ApiResponse({ status: 200, description: '返回角色模板分页列表' })
  async getTemplates(
    @Query() query: { page?: number; pageSize?: number },
  ) {
    const result = await this.roleService.getTemplates(query);
    return {
      success: true,
      message: '查询成功',
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个角色模板详情' })
  @ApiResponse({ status: 200, description: '返回指定模板详情' })
  @ApiResponse({ status: 404, description: '未找到该模板' })
  async getTemplateById(@Param('id') id: string) {
    const template = await this.roleService.getTemplateById(id);
    return {
      success: true,
      message: '查询成功',
      data: template,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建新的角色模板' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '模板创建成功' })
  @ApiResponse({ status: 400, description: '模板名称已存在' })
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(@Body() dto: CreateRoleTemplateDto) {
    const template = await this.roleService.createTemplate(dto);
    return {
      success: true,
      message: '角色模板创建成功',
      data: template,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新角色模板' })
  @ApiResponse({ status: 200, description: '模板更新成功' })
  @ApiResponse({ status: 404, description: '未找到该模板' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateRoleTemplateDto,
  ) {
    const template = await this.roleService.updateTemplate(id, dto);
    return {
      success: true,
      message: '角色模板更新成功',
      data: template,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色模板' })
  @ApiResponse({ status: 200, description: '模板删除成功' })
  @ApiResponse({ status: 404, description: '未找到该模板' })
  @ApiResponse({ status: 403, description: '系统模板不可删除' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(@Param('id') id: string) {
    await this.roleService.deleteTemplate(id);
    return {
      success: true,
      message: '角色模板删除成功',
      data: null,
    };
  }

  @Post(':id/apply')
  @ApiOperation({ summary: '应用权限模板到角色' })
  @ApiResponse({ status: 200, description: '模板应用成功' })
  @ApiResponse({ status: 404, description: '未找到该模板或角色' })
  async applyTemplateToRole(
    @Param('id') id: string,
    @Body() dto: ApplyTemplateDto,
  ) {
    const result = await this.roleService.applyTemplateToRole(id, dto.ovwrRoleId);
    return {
      success: true,
      message: '权限模板应用成功',
      data: result,
    };
  }

  @Post(':id/clone')
  @ApiOperation({ summary: '复制权限模板' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '模板复制成功' })
  @ApiResponse({ status: 403, description: '系统模板不可复制' })
  @HttpCode(HttpStatus.CREATED)
  async cloneTemplate(@Param('id') id: string, @Body() body: { newName: string }) {
    const template = await this.roleService.cloneTemplate(id, body.newName);
    return {
      success: true,
      message: '权限模板复制成功',
      data: template,
    };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: '查看模板使用统计' })
  @ApiResponse({ status: 200, description: '返回使用统计信息' })
  async getUsageStats(@Param('id') id: string) {
    const stats = await this.roleService.getUsageStats(id);
    return {
      success: true,
      data: stats,
    };
  }
}
