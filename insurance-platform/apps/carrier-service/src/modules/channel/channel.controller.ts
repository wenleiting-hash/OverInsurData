import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, Req, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import {
  CreateChannelAuthorizationDto, UpdateChannelAuthorizationDto,
  SetAuthorizationStatusDto, UpsertIssuancePermissionDto,
} from './dtos/channel-auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuditOperator } from '../../common/services/audit.service';

@UseGuards(JwtAuthGuard)
@Controller('api')
export class ChannelController {
  constructor(private readonly svc: ChannelService) {}

  private operator(req: any, action: string): AuditOperator {
    const roles: string[] = req.user?.roles || [];
    if (!roles.some((r: string) => ['super_admin', 'ops_manager'].includes(r))) {
      throw new ForbiddenException(`Insufficient permissions for: ${action}`);
    }
    return { userId: req.user?.userId, username: req.user?.username ?? req.user?.userId };
  }

  // ── Minimal channel master (authorization selectors) ──

  @Get('channels')
  async getChannels(@Query() q: any) {
    return this.svc.getChannels({ status: q.status, q: q.q });
  }

  // ── Channel product authorizations (doc ch.10) ──

  @Get('channel-authorizations')
  async listAuthorizations(@Query() q: any) {
    return this.svc.listAuthorizations({
      channelId: q.channelId, carrierId: q.carrierId, productId: q.productId,
      status: q.status, q: q.q,
    });
  }

  @Get('channel-authorizations/:id')
  async getAuthorization(@Param('id') id: string) {
    return this.svc.getAuthorizationById(id);
  }

  @Post('channel-authorizations')
  async createAuthorization(@Body() dto: CreateChannelAuthorizationDto, @Req() req: any) {
    return this.svc.createAuthorization(dto, this.operator(req, 'create channel authorization'));
  }

  @Put('channel-authorizations/:id')
  async updateAuthorization(
    @Param('id') id: string, @Body() dto: UpdateChannelAuthorizationDto, @Req() req: any,
  ) {
    return this.svc.updateAuthorization(id, dto, this.operator(req, 'update channel authorization'));
  }

  @Patch('channel-authorizations/:id/status')
  async setAuthorizationStatus(
    @Param('id') id: string, @Body() dto: SetAuthorizationStatusDto, @Req() req: any,
  ) {
    return this.svc.setAuthorizationStatus(id, dto, this.operator(req, 'revoke/renew channel authorization'));
  }

  // ── Issuance permissions & premium limits (doc 10.2) ──

  @Put('channel-authorizations/:id/permissions')
  async upsertPermission(
    @Param('id') id: string, @Body() dto: UpsertIssuancePermissionDto, @Req() req: any,
  ) {
    return this.svc.upsertPermission(id, dto, this.operator(req, 'configure issuance permission'));
  }
}
