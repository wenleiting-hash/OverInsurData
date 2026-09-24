import {
  Controller, Get, Post, Put, Patch, Delete, HttpCode,
  Body, Param, Query, Req, UseGuards, ForbiddenException, GoneException, Logger,
} from '@nestjs/common';
import { CooperationService } from './cooperation.service';
import {
  CreateCooperationDto, UpdateCooperationDto, TerminateCooperationDto,
  CreateContractDto, UpdateContractDto, SetContractStatusDto,
  CreateContactDto, UpdateContactDto, UpsertSettlementDto,
  RegisterRenewalDto, AddProductLinksDto, UpdateProductLinkDto,
} from './dtos/cooperation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuditOperator } from '../../common/services/audit.service';

@UseGuards(JwtAuthGuard)
@Controller('api')
export class CooperationController {
  private readonly logger = new Logger(CooperationController.name);
  constructor(private readonly svc: CooperationService) {}

  private operator(req: any, action: string): AuditOperator {
    const roles: string[] = req.user?.roles || [];
    if (!roles.some((r: string) => ['super_admin', 'ops_manager'].includes(r))) {
      throw new ForbiddenException(`Insufficient permissions for: ${action}`);
    }
    return { userId: req.user?.userId, username: req.user?.username ?? req.user?.userId };
  }

  // ── Cooperations ──

  @Get('cooperations')
  async getList(@Query() q: any) {
    return this.svc.getList({
      status: q.status, carrier: q.carrier, type: q.type, q: q.q,
      page: q.page !== undefined ? Number(q.page) : undefined,
      pageSize: q.pageSize !== undefined ? Number(q.pageSize) : undefined,
    });
  }

  // Static route must precede 'cooperations/:id', otherwise :id captures "overview".
  @Get('cooperations/overview')
  async getOverview() { return this.svc.getOverview(); }

  @Get('cooperations/:id')
  async getById(@Param('id') id: string) { return this.svc.getById(id); }

  @Post('cooperations')
  async create(@Body() dto: CreateCooperationDto, @Req() req: any) {
    return this.svc.create(dto, this.operator(req, 'create cooperation'));
  }

  @Put('cooperations/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateCooperationDto, @Req() req: any) {
    return this.svc.update(id, dto, this.operator(req, 'update cooperation'));
  }

  @Patch('cooperations/:id/terminate')
  async terminate(@Param('id') id: string, @Body() dto: TerminateCooperationDto, @Req() req: any) {
    return this.svc.terminate(id, dto, this.operator(req, 'terminate cooperation'));
  }

  // Literal 'batch' route must precede 'cooperations/:id', otherwise :id captures it.
  @Delete('cooperations/batch')
  async batchDelete(@Body() body: { ids: string[] }, @Req() req: any) {
    return this.svc.batchRemove(body.ids ?? [], this.operator(req, 'batch delete cooperations'));
  }

  // Soft delete; service enforces Negotiating/PendingSign-only (V1.0.12 rule).
  @Delete('cooperations/:id')
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.svc.delete(id, this.operator(req, 'delete cooperation'));
  }

  // ── Contracts ──

  @Get('contracts')
  async getAllContracts(@Query() q: any) {
    return this.svc.getAllContracts({ carrier: q.carrier, status: q.status, type: q.type });
  }

  @Get('cooperations/:id/contracts')
  async getContracts(@Param('id') id: string) { return this.svc.getContracts(id); }

  @Post('cooperations/:id/contracts')
  async addContract(@Param('id') id: string, @Body() dto: CreateContractDto, @Req() req: any) {
    return this.svc.createContract(dto, id, this.operator(req, 'add contract'));
  }

  @Put('cooperations/:id/contracts/:contractId')
  async updateContract(
    @Param('id') id: string, @Param('contractId') contractId: string,
    @Body() dto: UpdateContractDto, @Req() req: any,
  ) {
    return this.svc.updateContract(id, contractId, dto, this.operator(req, 'update contract'));
  }

  @Patch('cooperations/:id/contracts/:contractId/status')
  async setContractStatus(
    @Param('id') id: string, @Param('contractId') contractId: string,
    @Body() dto: SetContractStatusDto, @Req() req: any,
  ) {
    return this.svc.setContractStatus(id, contractId, dto.status, this.operator(req, 'set contract status'));
  }

  @Delete('cooperations/:id/contracts/:contractId')
  async deleteContract(
    @Param('id') id: string, @Param('contractId') contractId: string, @Req() req: any,
  ) {
    return this.svc.deleteContract(id, contractId, this.operator(req, 'delete contract'));
  }

  // ── Contacts ──

  @Get('contacts')
  async getAllContacts(@Query() q: any) {
    return this.svc.getAllContacts({ carrier: q.carrier });
  }

  @Get('cooperations/:id/contacts')
  async getContacts(@Param('id') id: string) { return this.svc.getContacts(id); }

  @Post('cooperations/:id/contacts')
  async addContact(@Param('id') id: string, @Body() dto: CreateContactDto, @Req() req: any) {
    return this.svc.createContact(dto, id, this.operator(req, 'add contact'));
  }

  @Put('contacts/:contactId')
  async updateContact(@Param('contactId') contactId: string, @Body() dto: UpdateContactDto, @Req() req: any) {
    return this.svc.updateContact(contactId, dto, this.operator(req, 'update contact'));
  }

  @Delete('contacts/:contactId')
  async deleteContact(@Param('contactId') contactId: string, @Req() req: any) {
    return this.svc.deleteContact(contactId, this.operator(req, 'delete contact'));
  }

  @Patch('contacts/:contactId/primary')
  async setPrimaryContact(@Param('contactId') contactId: string, @Req() req: any) {
    return this.svc.setPrimaryContact(contactId, this.operator(req, 'set primary contact'));
  }

  // ── Settlement ──

  @Get('settlement-configs')
  async getAllSettlementConfigs() { return this.svc.getAllSettlementConfigs(); }

  @Get('cooperations/:id/settlement')
  async getSettlement(@Param('id') id: string) { return this.svc.getSettlement(id); }

  @Put('cooperations/:id/settlement')
  async updateSettlement(@Param('id') id: string, @Body() dto: UpsertSettlementDto, @Req() req: any) {
    return this.svc.upsertSettlement(id, dto, this.operator(req, 'upsert settlement'));
  }

  // ── Renewals（V1.0.15：仅直接登记，无中间态 O6）──

  /** 续约登记时间线（某合作）。 */
  @Get('cooperations/:id/renewals')
  async getCoopRenewals(@Param('id') id: string) {
    return this.svc.getCoopRenewals(id);
  }

  /** 直接登记续约：新到期日 + 续约合同（可选）+ 备注。 */
  @Post('cooperations/:id/renewals/register')
  async registerRenewal(@Param('id') id: string, @Body() dto: RegisterRenewalDto, @Req() req: any) {
    return this.svc.registerRenewal(id, dto, this.operator(req, 'register renewal'));
  }

  // ── 合作-产品关联（V1.0.15 C2，取代产品接入申请）──

  @Get('cooperations/:id/products')
  async getProductLinks(@Param('id') id: string) {
    return this.svc.getProductLinks(id);
  }

  @Post('cooperations/:id/products')
  async addProductLinks(@Param('id') id: string, @Body() dto: AddProductLinksDto, @Req() req: any) {
    return this.svc.addProductLinks(id, dto, this.operator(req, 'add product links'));
  }

  @Delete('cooperations/:id/products/:linkId')
  async removeProductLink(@Param('id') id: string, @Param('linkId') linkId: string, @Req() req: any) {
    return this.svc.removeProductLink(id, linkId, this.operator(req, 'remove product link'));
  }

  @Patch('cooperations/:id/products/:linkId')
  async updateProductLink(
    @Param('id') id: string,
    @Param('linkId') linkId: string,
    @Body() dto: UpdateProductLinkDto,
    @Req() req: any,
  ) {
    return this.svc.updateProductLink(id, linkId, dto, this.operator(req, 'update product link'));
  }

  // ── 已下线流程（V1.0.15）：旧续约三段式 / 五步产品接入申请，统一 410 Gone ──

  @Get('renewals')
  @HttpCode(410)
  async legacyGetRenewals() {
    throw new GoneException('Global renewal list is retired; use GET /cooperations/:id/renewals');
  }

  @Post('cooperations/:id/renewals')
  @HttpCode(410)
  async legacyCreateRenewal() {
    throw new GoneException('Renewal negotiation is retired; use POST /cooperations/:id/renewals/register');
  }

  @Patch('renewals/:renewalId')
  @HttpCode(410)
  async legacyUpdateRenewal() {
    throw new GoneException('Renewal negotiation is retired; use POST /cooperations/:id/renewals/register');
  }

  @Post('renewals/:renewalId/execute')
  @HttpCode(410)
  async legacyExecuteRenewal() {
    throw new GoneException('Renewal execution is retired; use POST /cooperations/:id/renewals/register');
  }

  @Get('product-access-requests')
  @HttpCode(410)
  async legacyGetAccessRequests() {
    throw new GoneException('Product access request pipeline is retired; use GET /cooperations/:id/products');
  }

  @Post('product-access-requests')
  @HttpCode(410)
  async legacyCreateAccessRequest() {
    throw new GoneException('Product access request pipeline is retired; use POST /cooperations/:id/products');
  }

  @Patch('product-access-requests/:requestId')
  @HttpCode(410)
  async legacyUpdateAccessRequest() {
    throw new GoneException('Product access request pipeline is retired; use POST /cooperations/:id/products');
  }
}
