import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards, Logger,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/finance')
export class FinanceController {
  private readonly logger = new Logger(FinanceController.name);
  constructor(private readonly service: FinanceService) {}

  // ─── Stats ─────────────────────────────────────────────────────────
  @Get('stats')
  async getStats() { return this.service.getStats(); }

  // ─── Bills ─────────────────────────────────────────────────────────
  @Get('bills')
  async getBills(@Query() q: any) {
    return this.service.getBills({ status: q.status, search: q.search, page: q.page ? parseInt(q.page, 10) : 1, size: q.size ? parseInt(q.size, 10) : 20 });
  }

  @Post('bills/upload')
  async uploadBill(@Body() dto: any) { return this.service.uploadBill(dto); }

  @Get('bills/:id')
  async getBillDetail(@Param('id') id: string) { return this.service.getBillDetail(id); }

  @Post('bills/:id/parse')
  async parseBill(@Param('id') id: string) { return this.service.parseBill(id); }

  @Get('bills/:id/lines')
  async getBillLines(@Param('id') id: string, @Query() q: any) {
    return this.service.getBillLines(id, { page: q.page ? parseInt(q.page, 10) : 1, size: q.size ? parseInt(q.size, 10) : 50 });
  }

  // ─── Reconciliation ────────────────────────────────────────────────
  @Get('reconciliation')
  async getReconciliation(@Query() q: any) {
    return this.service.getReconciliation({ period: q.period, insurer_id: q.insurer_id });
  }

  @Post('reconciliation/batch')
  async batchReconcile(@Body() dto: any) { return this.service.batchReconcile(dto); }

  // ─── Diffs ─────────────────────────────────────────────────────────
  @Get('diffs')
  async getDiffs(@Query() q: any) {
    return this.service.getDiffs({ status: q.status, page: q.page ? parseInt(q.page, 10) : 1, size: q.size ? parseInt(q.size, 10) : 20 });
  }

  @Put('diffs/:id')
  async updateDiff(@Param('id') id: string, @Body() dto: any) { return this.service.updateDiff(id, dto); }

  @Patch('diffs/:id/action')
  async handleDiffAction(@Param('id') id: string, @Body() dto: any) { return this.service.handleDiffAction(id, dto); }

  // ─── Settlement Configs ────────────────────────────────────────────
  @Get('settlement-configs')
  async getSettlementConfigs(@Query() q: any) {
    return this.service.getSettlementConfigs({ page: q.page ? parseInt(q.page, 10) : 1, size: q.size ? parseInt(q.size, 10) : 50 });
  }

  @Post('settlement-configs')
  async createSettlementConfig(@Body() dto: any) { return this.service.createSettlementConfig(dto); }

  @Put('settlement-configs/:id')
  async updateSettlementConfig(@Param('id') id: string, @Body() dto: any) { return this.service.updateSettlementConfig(id, dto); }

  @Delete('settlement-configs/:id')
  async deleteSettlementConfig(@Param('id') id: string) { return this.service.deleteSettlementConfig(id); }

  // ─── Settlement History ────────────────────────────────────────────
  @Get('settlement-history')
  async getSettlementHistory(@Query() q: any) {
    return this.service.getSettlementHistory({ insurer_id: q.insurer_id, page: q.page ? parseInt(q.page, 10) : 1, size: q.size ? parseInt(q.size, 10) : 20 });
  }

  // ─── Premium Reconciliation ────────────────────────────────────────
  @Get('premium-reconciliation')
  async getPremiumReconciliation(@Query() q: any) {
    return this.service.getPremiumReconciliation({ period: q.period, insurer_id: q.insurer_id });
  }

  @Get('premium-records')
  async getPremiumRecords(@Query() q: any) {
    return this.service.getPremiumRecords({ period: q.period, insurer_id: q.insurer_id, page: q.page ? parseInt(q.page, 10) : 1, size: q.size ? parseInt(q.size, 10) : 20 });
  }
}
