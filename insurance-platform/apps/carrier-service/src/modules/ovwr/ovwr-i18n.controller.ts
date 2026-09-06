/**
 * Ovwr I18n Management Controller
 * 
 * RESTful API endpoints for multi-language translation management
 * Base Route: /api/ovwr/i18n/translations
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
import { OvwrI18nService } from './ovwr-i18n.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';

interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

interface FilterQuery {
  namespace?: string;
  module?: string;
  search?: string;
  type?: string;
}

/**
 * Translation Entry DTO
 */
export class CreateTranslationDto {
  ovwrNamespace: string;
  ovwrKey: string;
  ovwrEnUS: string;
  ovwrZhCN?: string;
  ovwrType?: 'label' | 'button' | 'placeholder' | 'toast' | 'confirm' | 'validate' | 'error-page';
  ovwrModule?: string;
  ovwrSection?: string;
}

export class UpdateTranslationDto {
  ovwrEnUS?: string;
  ovwrZhCN?: string;
  ovwrType?: string;
  ovwrModule?: string;
  ovwrSection?: string;
}

@ApiTags('Ovwr I18n Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('api/ovwr/i18n/translations')
export class OvwrI18nController {
  constructor(private readonly ovwrI18nService: OvwrI18nService) {}

  /**
   * Get all translations with pagination and filters
   * GET /api/ovwr/i18n/translations
   */
  @ApiOperation({
    summary: '查询翻译词条列表',
    description: '支持按 namespace、module、关键字搜索、type 过滤',
  })
  @ApiResponse({
    status: 200,
    description: '返回翻译词条分页列表',
    type: Object,
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 100 },
        pages: { type: 'number', example: 5 },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ovwrTranslationId: { type: 'string' },
              ovwrNamespace: { type: 'string' },
              ovwrKey: { type: 'string' },
              ovwrEnUS: { type: 'string' },
              ovwrZhCN: { type: 'string' },
              ovwrType: { type: 'string' },
              ovwrModule: { type: 'string' },
              ovwrSection: { type: 'string' },
              ovwrStatus: { type: 'string' },
              ovwrModified: { type: 'boolean' },
              ovwrCreatedAt: { type: 'string', format: 'date-time' },
              ovwrUpdatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @Get()
  async getTranslations(@Query() query: PaginationQuery & FilterQuery) {
    const { page = 1, pageSize = 20, namespace, module, search, type } = query;

    const result = await this.ovwrI18nService.getTranslations({
      namespace,
      module,
      search,
      type,
      page,
      pageSize,
    });

    return {
      success: true,
      message: '查询成功',
      data: result,
    };
  }

  /**
   * Get a single translation by ID
   * GET /api/ovwr/i18n/translations/:id
   */
  @ApiOperation({
    summary: '获取单个翻译词条',
    description: '根据翻译 ID 获取完整的翻译记录',
  })
  @ApiResponse({
    status: 200,
    description: '返回指定的翻译词条详情',
    type: Object,
  })
  @ApiResponse({ status: 404, description: '未找到该翻译词条' })
  @Get(':id')
  async getTranslation(@Param('id') id: string) {
    const translation = await this.ovwrI18nService.getTranslation(id);

    if (!translation) {
      throw new Error(`Translation with ID ${id} not found`);
    }

    return {
      success: true,
      message: '查询成功',
      data: translation,
    };
  }

  /**
   * Create a new translation entry
   * POST /api/ovwr/i18n/translations
   */
  @ApiOperation({
    summary: '新增翻译词条',
    description: '创建新的翻译词条，需指定 namespace、key、enUS 等必填字段',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '翻译词条创建成功',
    type: Object,
  })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createTranslation(@Body() dto: CreateTranslationDto) {
    const translation = await this.ovwrI18nService.createTranslation(dto);

    return {
      success: true,
      message: '翻译词条创建成功',
      data: translation,
    };
  }

  /**
   * Update an existing translation entry
   * PUT /api/ovwr/i18n/translations/:id
   */
  @ApiOperation({
    summary: '更新翻译词条',
    description: '更新已存在的翻译词条内容',
  })
  @ApiResponse({
    status: 200,
    description: '翻译词条更新成功',
    type: Object,
  })
  @ApiResponse({ status: 404, description: '未找到该翻译词条' })
  @Patch(':id')
  async updateTranslation(@Param('id') id: string, @Body() dto: UpdateTranslationDto) {
    const translation = await this.ovwrI18nService.updateTranslation(id, dto);

    return {
      success: true,
      message: '翻译词条更新成功',
      data: translation,
    };
  }

  /**
   * Delete a translation entry
   * DELETE /api/ovwr/i18n/translations/:id
   */
  @ApiOperation({
    summary: '删除翻译词条',
    description: '物理删除指定的翻译词条记录',
  })
  @ApiResponse({
    status: 200,
    description: '翻译词条删除成功',
  })
  @ApiResponse({ status: 404, description: '未找到该翻译词条' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTranslation(@Param('id') id: string) {
    await this.ovwrI18nService.deleteTranslation(id);

    return {
      success: true,
      message: '翻译词条删除成功',
      data: null,
    };
  }
}
