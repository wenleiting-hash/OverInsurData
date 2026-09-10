import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, Req, UseGuards, Logger,
} from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/compliance')
export class ComplianceController {
  private readonly logger = new Logger(ComplianceController.name);
  constructor(private readonly service: ComplianceService) {}

  // ─── Dashboard ─────────────────────────────────────────────────────
  @Get('dashboard')
  async getDashboard() { return this.service.getDashboard(); }

  // ─── Rules ─────────────────────────────────────────────────────────
  @Get('rules')
  async getRules(@Query() q: any) {
    return this.service.getRules({ category: q.category, page: q.page ? parseInt(q.page, 10) : 1, size: q.size ? parseInt(q.size, 10) : 50 });
  }

  @Post('rules')
  async createRule(@Body() dto: any) { return this.service.createRule(dto); }

  @Put('rules/:id')
  async updateRule(@Param('id') id: string, @Body() dto: any) { return this.service.updateRule(id, dto); }

  @Delete('rules/:id')
  async deleteRule(@Param('id') id: string) { return this.service.deleteRule(id); }

  @Patch('rules/:id/toggle')
  async toggleRule(@Param('id') id: string) { return this.service.toggleRule(id); }

  // ─── OFAC ──────────────────────────────────────────────────────────
  @Get('ofac')
  async getOFACList(@Query() q: any) {
    return this.service.getOFACList({ status: q.status, page: q.page ? parseInt(q.page, 10) : 1, size: q.size ? parseInt(q.size, 10) : 20 });
  }

  @Post('ofac/screen')
  async screenOFAC(@Body() dto: any) { return this.service.screenOFAC(dto); }

  @Put('ofac/:id/review')
  async reviewOFAC(@Param('id') id: string, @Body() dto: any) { return this.service.reviewOFAC(id, dto); }

  // ─── Interceptions ─────────────────────────────────────────────────
  @Get('interceptions')
  async getInterceptions(@Query() q: any) {
    return this.service.getInterceptions({ result: q.result, severity: q.severity, page: q.page ? parseInt(q.page, 10) : 1, size: q.size ? parseInt(q.size, 10) : 20 });
  }

  @Put('interceptions/:id/resolve')
  async resolveInterception(@Param('id') id: string, @Body() dto: any) { return this.service.resolveInterception(id, dto); }

  // ─── Licenses ──────────────────────────────────────────────────────
  @Get('licenses')
  async getLicenses(@Query() q: any) {
    return this.service.getLicenses({ state: q.state, status: q.status, page: q.page ? parseInt(q.page, 10) : 1, size: q.size ? parseInt(q.size, 10) : 20 });
  }

  @Post('licenses/verify')
  async verifyLicenses(@Body() dto: any) { return this.service.verifyLicenses(dto); }

  // ─── License Reminders ────────────────────────────────────────────
  @Get('license-reminders')
  async getLicenseReminders(@Query() q: any) {
    return this.service.getLicenseReminders({ status: q.status, page: q.page ? parseInt(q.page, 10) : 1, size: q.size ? parseInt(q.size, 10) : 20 });
  }

  // ─── Reports ───────────────────────────────────────────────────────
  @Get('reports')
  async getReports(@Query() q: any) {
    return this.service.getReports({ category: q.category, page: q.page ? parseInt(q.page, 10) : 1, size: q.size ? parseInt(q.size, 10) : 20 });
  }

  @Post('reports/generate')
  async generateReport(@Body() dto: any) { return this.service.generateReport(dto); }
}
