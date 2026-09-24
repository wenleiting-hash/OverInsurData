import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { CreateIntegrationAppDto, UpdateIntegrationAppDto } from './dtos/integration.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuditService } from '../../common/services/audit.service';

@UseGuards(JwtAuthGuard)
@Controller('api/integration/apps')
export class IntegrationController {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  async create(@Body() dto: CreateIntegrationAppDto, @Req() req: any) {
    const operator = req.user?.username ?? req.user?.userId ?? 'system';
    const app = await this.integrationService.createApp(dto, operator);
    // V1.0.16 T6：集成应用管理审计
    this.auditService
      .log({
        operator: { userId: req.user?.userId, username: req.user?.username },
        action: 'INTEGRATION_APP_CREATE',
        module: 'integration',
        targetType: 'app',
        targetId: app.app_id,
        success: true,
        params: { app_name: dto.appName, app_key: app.app_key },
      })
      .catch(() => {});
    return {
      success: true,
      message: '应用创建成功，请立即复制 appSecret（仅展示一次）',
      data: app,
    };
  }

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    const result = await this.integrationService.listApps(
      page ? parseInt(page, 10) : 1,
      size ? parseInt(size, 10) : 20,
    );
    return { success: true, data: result };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const app = await this.integrationService.getApp(id);
    return { success: true, data: app };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateIntegrationAppDto) {
    const app = await this.integrationService.updateApp(id, dto);
    return { success: true, data: app };
  }

  @Post(':id/reset-secret')
  async resetSecret(@Param('id') id: string, @Req() req: any) {
    const operator = req.user?.username ?? req.user?.userId ?? 'system';
    const result = await this.integrationService.resetSecret(id, operator);
    // V1.0.16 T6：密钥重置审计
    this.auditService
      .log({
        operator: { userId: req.user?.userId, username: req.user?.username },
        action: 'INTEGRATION_APP_RESET',
        module: 'integration',
        targetType: 'app',
        targetId: id,
        success: true,
        params: { reset_by: operator },
      })
      .catch(() => {});
    return {
      success: true,
      message: '密钥已重置，请立即复制新 appSecret（仅展示一次）',
      data: result,
    };
  }

  @Post(':id/reveal-secret')
  async revealSecret(@Param('id') id: string, @Req() req: any) {
    // V1.0.16：查看明文 appSecret（用于后续复制），不改库，记录审计
    const result = await this.integrationService.revealSecret(id);
    this.auditService
      .log({
        operator: { userId: req.user?.userId, username: req.user?.username },
        action: 'INTEGRATION_APP_SECRET_VIEW',
        module: 'integration',
        targetType: 'app',
        targetId: id,
        success: true,
        params: { app_key: result.app_key },
      })
      .catch(() => {});
    return {
      success: true,
      message: 'appSecret 明文已返回，请注意安全保存',
      data: result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.integrationService.deleteApp(id);
    // V1.0.16 T6：应用删除审计
    this.auditService
      .log({
        operator: { userId: req.user?.userId, username: req.user?.username },
        action: 'INTEGRATION_APP_DELETE',
        module: 'integration',
        targetType: 'app',
        targetId: id,
        success: true,
      })
      .catch(() => {});
    return { success: true, message: '应用已删除' };
  }
}
