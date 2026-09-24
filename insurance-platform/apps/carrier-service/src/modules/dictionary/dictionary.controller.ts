import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { DictionaryService } from './dictionary.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DictPermissionGuard } from './dict-permission.guard';
import { AuditService } from '../../common/services/audit.service';

/**
 * 险种字典管理接口（V1.0.18，PRD §6）
 * 前缀 /api/dictionaries；除 coverage-tree 外均需 dict:manage 权限。
 */
@UseGuards(JwtAuthGuard)
@Controller('api/dictionaries')
export class DictionaryController {
  constructor(
    private readonly dictionaryService: DictionaryService,
    private readonly auditService: AuditService,
  ) {}

  private operator(req: any): string {
    return req.user?.username ?? req.user?.userId ?? 'system';
  }

  private audit(req: any, action: string, targetType: string, targetId: string, params: Record<string, unknown>) {
    this.auditService
      .log({
        operator: { userId: req.user?.userId, username: req.user?.username },
        action,
        module: 'dictionary',
        targetType,
        targetId,
        success: true,
        params,
      })
      .catch(() => {});
  }

  // ── 联动树（登录态即可，建品表单消费）─────────────────────
  @Get('coverage-tree')
  async tree() {
    const data = await this.dictionaryService.getTree();
    return { success: true, data };
  }

  // ── 业务线 ────────────────────────────────────────────────
  @Get('lines')
  async listLines(@Query('includeDisabled') includeDisabled?: string) {
    const data = await this.dictionaryService.listLines(includeDisabled === 'true');
    return { success: true, data };
  }

  @Post('lines')
  @UseGuards(DictPermissionGuard)
  async createLine(@Body() dto: any, @Req() req: any) {
    const data = await this.dictionaryService.createLine(dto, this.operator(req));
    this.audit(req, 'DICT_LINE_CREATE', 'dict_line', data.code, { ...dto });
    return { success: true, data };
  }

  @Put('lines/:code')
  @UseGuards(DictPermissionGuard)
  async updateLine(@Param('code') code: string, @Body() dto: any, @Req() req: any) {
    const data = await this.dictionaryService.updateLine(code, dto, this.operator(req));
    this.audit(req, 'DICT_LINE_UPDATE', 'dict_line', code, { ...dto });
    return { success: true, data };
  }

  @Put('lines/:code/status')
  @UseGuards(DictPermissionGuard)
  async setLineStatus(@Param('code') code: string, @Body() dto: { status?: string }, @Req() req: any) {
    const data = await this.dictionaryService.setLineStatus(code, String(dto.status ?? ''), this.operator(req));
    this.audit(req, 'DICT_LINE_STATUS', 'dict_line', code, { requested: dto.status, ...data });
    return { success: true, data };
  }

  @Delete('lines/:code')
  @UseGuards(DictPermissionGuard)
  async deleteLine(@Param('code') code: string, @Req() req: any) {
    await this.dictionaryService.deleteLine(code, this.operator(req));
    this.audit(req, 'DICT_LINE_DELETE', 'dict_line', code, {});
    return { success: true };
  }

  // ── 子险种 ────────────────────────────────────────────────
  @Get('lines/:lineCode/sub-lines')
  async listSubLines(@Param('lineCode') lineCode: string, @Query('includeDisabled') includeDisabled?: string) {
    const data = await this.dictionaryService.listSubLines(lineCode, includeDisabled === 'true');
    return { success: true, data };
  }

  @Post('lines/:lineCode/sub-lines')
  @UseGuards(DictPermissionGuard)
  async createSubLine(@Param('lineCode') lineCode: string, @Body() dto: any, @Req() req: any) {
    const data = await this.dictionaryService.createSubLine(lineCode, dto, this.operator(req));
    this.audit(req, 'DICT_SUB_LINE_CREATE', 'dict_sub_line', data.code, { lineCode, ...dto });
    return { success: true, data };
  }

  @Put('sub-lines/:id')
  @UseGuards(DictPermissionGuard)
  async updateSubLine(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    const data = await this.dictionaryService.updateSubLine(parseInt(id, 10), dto, this.operator(req));
    this.audit(req, 'DICT_SUB_LINE_UPDATE', 'dict_sub_line', String(data.code), { id, ...dto });
    return { success: true, data };
  }

  @Put('sub-lines/:id/status')
  @UseGuards(DictPermissionGuard)
  async setSubLineStatus(@Param('id') id: string, @Body() dto: { status?: string }, @Req() req: any) {
    const data = await this.dictionaryService.setSubLineStatus(parseInt(id, 10), String(dto.status ?? ''), this.operator(req));
    this.audit(req, 'DICT_SUB_LINE_STATUS', 'dict_sub_line', String(id), { requested: dto.status, ...data });
    return { success: true, data };
  }

  @Delete('sub-lines/:id')
  @UseGuards(DictPermissionGuard)
  async deleteSubLine(@Param('id') id: string, @Req() req: any) {
    await this.dictionaryService.deleteSubLine(parseInt(id, 10), this.operator(req));
    this.audit(req, 'DICT_SUB_LINE_DELETE', 'dict_sub_line', id, {});
    return { success: true };
  }

  // ── 承保范围 ──────────────────────────────────────────────
  @Get('coverages')
  async listCoverages(@Query('includeDisabled') includeDisabled?: string) {
    const data = await this.dictionaryService.listCoverages(includeDisabled === 'true');
    return { success: true, data };
  }

  @Post('coverages')
  @UseGuards(DictPermissionGuard)
  async createCoverage(@Body() dto: any, @Req() req: any) {
    const data = await this.dictionaryService.createCoverage(dto, this.operator(req));
    this.audit(req, 'DICT_COVERAGE_CREATE', 'dict_coverage', data.code, { ...dto });
    return { success: true, data };
  }

  @Put('coverages/:code')
  @UseGuards(DictPermissionGuard)
  async updateCoverage(@Param('code') code: string, @Body() dto: any, @Req() req: any) {
    const data = await this.dictionaryService.updateCoverage(code, dto, this.operator(req));
    this.audit(req, 'DICT_COVERAGE_UPDATE', 'dict_coverage', code, { ...dto });
    return { success: true, data };
  }

  @Put('coverages/:code/status')
  @UseGuards(DictPermissionGuard)
  async setCoverageStatus(@Param('code') code: string, @Body() dto: { status?: string }, @Req() req: any) {
    const data = await this.dictionaryService.setCoverageStatus(code, String(dto.status ?? ''), this.operator(req));
    this.audit(req, 'DICT_COVERAGE_STATUS', 'dict_coverage', code, { requested: dto.status, ...data });
    return { success: true, data };
  }

  @Delete('coverages/:code')
  @UseGuards(DictPermissionGuard)
  async deleteCoverage(@Param('code') code: string, @Req() req: any) {
    await this.dictionaryService.deleteCoverage(code, this.operator(req));
    this.audit(req, 'DICT_COVERAGE_DELETE', 'dict_coverage', code, {});
    return { success: true };
  }

  // ── 业务线 × 承保范围 关联（真三级联动）──────────────────
  @Get('lines/:lineCode/coverages')
  async getLineCoverages(@Param('lineCode') lineCode: string) {
    const data = await this.dictionaryService.getLineCoverages(lineCode);
    return { success: true, data };
  }

  @Put('lines/:lineCode/coverages')
  @UseGuards(DictPermissionGuard)
  async replaceLineCoverages(@Param('lineCode') lineCode: string, @Body() dto: { coverageCodes?: string[] }, @Req() req: any) {
    const data = await this.dictionaryService.replaceLineCoverages(lineCode, dto.coverageCodes ?? [], this.operator(req));
    this.audit(req, 'DICT_REL_REPLACE', 'dict_line_coverage_rel', lineCode, { coverageCodes: data.coverageCodes });
    return { success: true, data };
  }

  // ── 引用统计（删除/停用确认框）───────────────────────────
  @Get(':type/:key/usage')
  async usage(@Param('type') type: string, @Param('key') key: string, @Query('line') line?: string) {
    if (!['line', 'sub-line', 'coverage'].includes(type)) {
      return { success: false, message: 'unknown usage type' };
    }
    const data = await this.dictionaryService.usage(type as 'line' | 'sub-line' | 'coverage', key, line);
    return { success: true, data };
  }
}
