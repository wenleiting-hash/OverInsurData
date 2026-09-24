import {
  Controller, Get, Post, Body, Req, UseGuards,
} from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { IntegrationAuthGuard } from '../../common/guards/integration-auth.guard';
import { ConsultationMatchDto } from './dtos/integration.dto';

/**
 * V1.0.16 workOS 集成对外接口（S2S）
 * 全部由 IntegrationAuthGuard 校验：appKey + HMAC-SHA256 + 时间戳 + nonce + IP 白名单
 *  - I1 GET  /api/integration/v1/permission-catalog
 *  - I2 POST /api/integration/v1/users/upsert
 *  - I3 POST /api/integration/v1/consultation/match
 *  - I4 GET  /api/integration/v1/insurance-catalog   （V1.0.18 险种字典快照）
 */
@UseGuards(IntegrationAuthGuard)
@Controller('api/integration/v1')
export class IntegrationV1Controller {
  constructor(private readonly integrationService: IntegrationService) {}

  /** I1: 权限目录 */
  @Get('permission-catalog')
  async catalog() {
    const data = await this.integrationService.getPermissionCatalog();
    return { success: true, data };
  }

  /** I4: 险种字典快照（V1.0.18；结构同 coverage-tree + catalogVersion） */
  @Get('insurance-catalog')
  async insuranceCatalog() {
    const data = await this.integrationService.getCatalogSnapshot();
    return { success: true, data };
  }

  /** I2: 用户/角色同步 upsert */
  @Post('users/upsert')
  async upsert(@Body() dto: any, @Req() req: any) {
    const appKey: string = req.integrationApp?.app_key;
    const operatorId: string | undefined = req.headers['x-operator-id'];
    const data = await this.integrationService.upsertUser(dto, appKey, operatorId);
    return { success: true, data };
  }

  /** I3: 保单咨询匹配（V1.1：仅 L1 险种+州必填，其余维度可选） */
  @Post('consultation/match')
  async match(@Body() dto: ConsultationMatchDto, @Req() req: any) {
    const appKey: string = req.integrationApp?.app_key;
    const data = await this.integrationService.matchConsultation(dto, appKey);
    return { success: true, data };
  }
}
