/**
 * Ovwr Permission Template Manager Controller
 * 
 * RESTful API endpoints for permission template management
 * Base Route: /api/ovwr/permission-templates
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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OvwrRoleService } from './services/ovwr-role.service';

/**
 * Permission Template DTOs
 */
export class CreatePermissionTemplateDto {
  ovwrTemplateName: string;
  ovwrDescription?: string;
  ovwrPermissions: Array<{
    ovwrPermissionId: string;
  }>;
  ovwrApplicableRoles?: string[];
  ovwrIsSystem?: boolean;
}

export class UpdatePermissionTemplateDto {
  ovwrTemplateName?: string;
  ovwrDescription?: string;
  ovwrPermissions?: Array<{
    ovwrPermissionId: string;
  }>;
  ovwrApplicableRoles?: string[];
}

@ApiTags('Ovwr Permission Templates')
@Controller('api/ovwr/permission-templates')
export class OvwrPermissionTemplateController {
  constructor(private readonly roleService: OvwrRoleService) {}

  @Get()
  @ApiOperation({ summary: '查询权限模板列表' })
  @ApiResponse({ status: 200, description: '返回权限模板分页列表' })
  async getTemplates(@Query() query: { page?: number; pageSize?: number }) {
    return {
      success: true,
      message: '查询成功',
      data: await this.roleService.getTemplates(query),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个权限模板详情' })
  @ApiResponse({ status: 200, description: '返回权限模板详情' })
  async getTemplateById(@Param('id') id: string) {
    const template = await this.roleService.getTemplateById(id);
    return {
      success: true,
      message: '查询成功',
      data: template,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建新的权限模板' })
  @ApiResponse({ status: 201, description: '模板创建成功' })
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(@Body() dto: CreatePermissionTemplateDto) {
    const template = await this.roleService.createTemplate(dto);
    return {
      success: true,
      message: '权限模板创建成功',
      data: template,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新权限模板' })
  @ApiResponse({ status: 200, description: '模板更新成功' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionTemplateDto,
  ) {
    const template = await this.roleService.updateTemplate(id, dto);
    return {
      success: true,
      message: '权限模板更新成功',
      data: template,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除权限模板' })
  @ApiResponse({ status: 200, description: '模板删除成功' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(@Param('id') id: string) {
    await this.roleService.deleteTemplate(id);
    return {
      success: true,
      message: '权限模板删除成功',
      data: null,
    };
  }

  @Post(':id/apply')
  @ApiOperation({ summary: '应用权限模板到角色' })
  @ApiResponse({ status: 200, description: '模板应用成功' })
  async applyTemplateToRole(
    @Param('id') id: string,
    @Body() body: { roleId: string },
  ) {
    await this.roleService.applyTemplateToRole(id, body.roleId);
    return {
      success: true,
      message: '权限模板应用成功',
      data: null,
    };
  }

  @Post(':id/clone')
  @ApiOperation({ summary: '复制权限模板' })
  @ApiResponse({ status: 201, description: '模板复制成功' })
  @HttpCode(HttpStatus.CREATED)
  async cloneTemplate(
    @Param('id') id: string,
    @Body() body: { newName: string },
  ) {
    const cloned = await this.roleService.cloneTemplate(id, body.newName);
    return {
      success: true,
      message: '权限模板复制成功',
      data: cloned,
    };
  }

  @Get(':id/usage-stats')
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
