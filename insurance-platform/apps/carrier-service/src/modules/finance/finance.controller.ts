import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, Req, UseGuards, Logger, ForbiddenException,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuditOperator } from '../../common/services/audit.service';
import {
  BillImportDto, StatementImportDto, StatementLineAdjustDto, StatementConfirmDto,
  MappingTemplateUpsertDto, ReconcileStartDto, DiffActionDto, DiffFollowUpDto,
  FinanceProfileUpsertDto, CommissionRateUpsertDto, BillCompleteDto,
  CommissionRateImportDto, CommissionRateTrialDto,
} from './dtos/finance.dto';

/** V1.0.15：批次解锁/作废仅主管及以上。 */
const SUPERVISOR_ROLES = new Set(['super_admin', 'ops_manager']);

@UseGuards(JwtAuthGuard)
@Controller('api/finance')
export class FinanceController {
  private readonly logger = new Logger(FinanceController.name);

  constructor(private readonly service: FinanceService) {}

  private operator(req: any): AuditOperator {
    return { userId: req.user?.userId, username: req.user?.username ?? req.user?.userId };
  }

  private requireSupervisor(req: any) {
    const roles: string[] = req.user?.roles || [];
    if (!roles.some((r) => SUPERVISOR_ROLES.has(r))) {
      throw new ForbiddenException('Supervisor role required (super_admin / ops_manager)');
    }
  }

  // ─── Stats ─────────────────────────────────────────────────────────
  @Get('stats')
  async getStats() { return this.service.getStats(); }

  // ─── Mapping templates（字面量路由在 :id 之前）──────────────────────
  @Get('mapping-templates')
  async getTemplates(@Query() q: any) { return this.service.getTemplates(q); }

  @Post('mapping-templates')
  async createTemplate(@Body() dto: MappingTemplateUpsertDto, @Req() req: any) {
    return this.service.createTemplate(dto, this.operator(req));
  }

  @Put('mapping-templates/:id')
  async updateTemplate(@Param('id') id: string, @Body() dto: MappingTemplateUpsertDto, @Req() req: any) {
    return this.service.updateTemplate(id, dto, this.operator(req));
  }

  @Delete('mapping-templates/:id')
  async deleteTemplate(@Param('id') id: string, @Req() req: any) {
    return this.service.deleteTemplate(id, this.operator(req));
  }

  // ─── Bills (V1.0.15 批次化) ────────────────────────────────────────
  @Get('bills')
  async getBills(@Query() q: any) { return this.service.getBills(q); }

  /** 导入预检：不落库，返回 有效/重复/失败 分类。 */
  @Post('bills/precheck')
  async precheckBill(@Body() dto: BillImportDto) {
    return this.service.precheckBill(dto);
  }

  @Post('bills/import')
  async importBill(@Body() dto: BillImportDto, @Req() req: any) {
    return this.service.importBill(dto, this.operator(req));
  }

  /** 批次发起试算/重新试算（五步条：试算期望值）。 */
  @Post('bills/:id/reconcile')
  async reconcileBill(@Param('id') id: string, @Req() req: any) {
    return this.service.reconcileBill(id, this.operator(req));
  }

  /** 封帐（确认对账）；存在 open/suspended 差异时 409。 */
  @Post('bills/:id/complete')
  async completeBill(@Param('id') id: string, @Body() dto: BillCompleteDto, @Req() req: any) {
    return this.service.completeBill(id, this.operator(req), dto.note);
  }

  /** 主管解锁已封帐批次。 */
  @Post('bills/:id/unlock')
  async unlockBill(@Param('id') id: string, @Req() req: any) {
    this.requireSupervisor(req);
    return this.service.unlockBill(id, this.operator(req));
  }

  /** 作废批次（软删，仅主管；已锁定批次须先解锁）。 */
  @Post('bills/:id/void')
  async voidBill(@Param('id') id: string, @Req() req: any) {
    this.requireSupervisor(req);
    return this.service.voidBill(id, this.operator(req));
  }

  /** 批量作废批次（软删，仅主管；已锁定批次自动跳过）。 */
  @Post('bills/void-batch')
  async voidBillsBatch(@Body() body: { ids: string[] }, @Req() req: any) {
    this.requireSupervisor(req);
    return this.service.batchVoidBills(body.ids ?? [], this.operator(req));
  }

  @Get('bills/:id/errors')
  async getBillErrors(@Param('id') id: string) { return this.service.getBillErrors(id); }

  @Get('bills/:id/lines')
  async getBillLines(@Param('id') id: string, @Query() q: any) {
    return this.service.getBillLines(id, q);
  }

  @Get('bills/:id')
  async getBillDetail(@Param('id') id: string) { return this.service.getBillDetail(id); }

  // ─── Our statements ────────────────────────────────────────────────
  @Get('statements')
  async getStatements(@Query() q: any) { return this.service.getStatements(q); }

  @Post('statements/import')
  async importStatement(@Body() dto: StatementImportDto, @Req() req: any) {
    return this.service.importStatement(dto, this.operator(req));
  }

  @Post('statements/:id/confirm')
  async confirmStatement(@Param('id') id: string, @Body() _dto: StatementConfirmDto, @Req() req: any) {
    return this.service.confirmStatement(id, this.operator(req));
  }

  @Get('statements/:id/lines')
  async getStatementLines(@Param('id') id: string, @Query() q: any) {
    return this.service.getStatementLines(id, q);
  }

  @Put('statements/:id/lines/:lineId')
  async adjustStatementLine(
    @Param('id') id: string, @Param('lineId') lineId: string,
    @Body() dto: StatementLineAdjustDto, @Req() req: any,
  ) {
    return this.service.adjustStatementLine(id, lineId, dto, this.operator(req));
  }

  @Get('statements/:id')
  async getStatementDetail(@Param('id') id: string) { return this.service.getStatementDetail(id); }

  // ─── Reconciliation runs ───────────────────────────────────────────
  @Post('reconciliation/start')
  async startReconciliation(@Body() dto: ReconcileStartDto, @Req() req: any) {
    return this.service.startReconciliation(dto, this.operator(req));
  }

  @Get('reconciliation/runs')
  async getRuns(@Query() q: any) { return this.service.getRuns(q); }

  @Get('reconciliation/runs/:id')
  async getRunDetail(@Param('id') id: string) { return this.service.getRunDetail(id); }

  // ─── Diffs（轻量闭环：动作 + 挂起 + 跟进 + 统计）────────────────────
  @Get('diffs/stats')
  async getDiffStats(@Query() q: any) { return this.service.getDiffStats(q); }

  @Get('diffs')
  async getDiffs(@Query() q: any) { return this.service.getDiffs(q); }

  @Patch('diffs/:id/action')
  async diffAction(@Param('id') id: string, @Body() dto: DiffActionDto, @Req() req: any) {
    return this.service.diffAction(id, dto, this.operator(req));
  }

  /** 差异行重新计算（费率已更正后重跑试算）。 */
  @Patch('diffs/:id/recalc')
  async recalcDiff(@Param('id') id: string, @Req() req: any) {
    return this.service.recalcDiff(id, this.operator(req));
  }

  @Post('diffs/:id/follow-ups')
  async addFollowUp(@Param('id') id: string, @Body() dto: DiffFollowUpDto, @Req() req: any) {
    return this.service.addDiffFollowUp(id, dto, this.operator(req));
  }

  // ─── Insurer configs（合作主数据只读 + 财务 profile 可写）──────────
  @Get('insurer-configs')
  async getInsurerConfigs() { return this.service.getInsurerConfigs(); }

  @Put('insurer-configs/:configId')
  async upsertProfile(
    @Param('configId') configId: string, @Body() dto: FinanceProfileUpsertDto, @Req() req: any,
  ) {
    return this.service.upsertProfile(configId, dto, this.operator(req));
  }

  // ─── Commission rate master data ───────────────────────────────────
  @Get('commission-rates')
  async getCommissionRates(@Query() q: any) {
    return this.service.getCommissionRates(q.carrier_id, q.dimension, q.status, q.state);
  }

  /** 批量导入预检（不落库）。 */
  @Post('commission-rates/import-precheck')
  async precheckCommissionRates(@Body() dto: CommissionRateImportDto) {
    return this.service.precheckCommissionRates(dto);
  }

  /** 批量导入确认写入。 */
  @Post('commission-rates/import')
  async importCommissionRates(@Body() dto: CommissionRateImportDto, @Req() req: any) {
    return this.service.importCommissionRates(dto, this.operator(req));
  }

  /** 试算预览（四级回退命中档位 + 模拟佣金）。 */
  @Post('commission-rates/trial')
  async trialCommissionRate(@Body() dto: CommissionRateTrialDto) {
    return this.service.trialCommissionRate(dto);
  }

  /** 版本清单（每费率键最新版本）。 */
  @Get('commission-rates/versions')
  async getRateVersions(@Query() q: any) {
    return this.service.getRateVersions(q.carrier_id);
  }

  /** 两版本对比。 */
  @Get('commission-rates/version-diff')
  async getRateVersionDiff(@Query() q: any) {
    return this.service.getRateVersionDiff(q);
  }

  @Post('commission-rates')
  async createCommissionRate(@Body() dto: CommissionRateUpsertDto, @Req() req: any) {
    return this.service.createCommissionRate(dto, this.operator(req));
  }

  @Put('commission-rates/:id')
  async updateCommissionRate(
    @Param('id') id: string, @Body() dto: Partial<CommissionRateUpsertDto>, @Req() req: any,
  ) {
    return this.service.updateCommissionRate(id, dto, this.operator(req));
  }

  /** 批量置失效佣金率（软删）。须在 :id 路由之前声明，避免 "batch" 被当作 id。 */
  @Delete('commission-rates/batch')
  async deleteCommissionRatesBatch(@Body() body: { ids: string[] }, @Req() req: any) {
    return this.service.batchDeleteCommissionRates(body.ids ?? [], this.operator(req));
  }

  @Delete('commission-rates/:id')
  async deleteCommissionRate(@Param('id') id: string, @Req() req: any) {
    return this.service.deleteCommissionRate(id, this.operator(req));
  }
}
