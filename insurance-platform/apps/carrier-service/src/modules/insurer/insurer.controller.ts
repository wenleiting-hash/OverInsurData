import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, Req, UseGuards, ForbiddenException, Logger,
} from '@nestjs/common';
import { InsurerService } from './insurer.service';
import { CreateInsurerDto, UpdateInsurerDto, BatchImportInsurersDto } from './dtos/insurer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/insurers')
export class InsurerController {
  private readonly logger = new Logger(InsurerController.name);
  constructor(private readonly insurerService: InsurerService) {}

  private assertAdmin(req: any, action: string): string {
    const roles: string[] = req.user?.roles || [];
    if (!roles.some((r: string) => ['super_admin', 'ops_manager'].includes(r))) {
      throw new ForbiddenException(`Insufficient permissions for: ${action}`);
    }
    return req.user?.userId;
  }

  @Get()
  async getList(@Query() q: any) {
    return this.insurerService.getList({
      search: q.search, type: q.type, status: q.status, region: q.region, rating: q.rating,
      cooperation_status: q.cooperation_status,
      sortKey: q.sortKey, sortDir: q.sortDir,
      page: q.page ? parseInt(q.page, 10) : 1,
      size: q.size ? parseInt(q.size, 10) : 20,
    });
  }

  @Get('duplicate-check')
  async duplicateCheck() { return this.insurerService.duplicateCheck(); }

  /** Check if a NAIC code is available (for real-time validation) */
  @Get('check-naic/:code')
  async checkNaic(@Param('code') code: string, @Query('excludeId') excludeId?: string) {
    if (!/^\d{5}$/.test(code)) {
      return { valid: false, available: false, message: 'NAIC Code must be exactly 5 digits' };
    }
    const result = await this.insurerService.checkNaicAvailable(code, excludeId);
    return {
      valid: true,
      available: result.available,
      existingId: result.existingId || null,
      message: result.available
        ? 'NAIC Code is available'
        : `NAIC Code "${code}" is already in use`,
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) { return this.insurerService.getById(id); }

  @Post('batch-import')
  async batchImport(@Body() body: BatchImportInsurersDto, @Req() req: any) {
    const userId = this.assertAdmin(req, 'batch import insurers');
    return this.insurerService.batchImport(body.rows, userId);
  }

  @Post()
  async create(@Body() dto: CreateInsurerDto, @Req() req: any) {
    const userId = this.assertAdmin(req, 'create insurer');
    return this.insurerService.create(dto, userId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateInsurerDto, @Req() req: any) {
    this.assertAdmin(req, 'update insurer');
    return this.insurerService.update(id, dto);
  }

  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id') id: string, @Req() req: any) {
    this.assertAdmin(req, 'toggle insurer status');
    return this.insurerService.toggleStatus(id);
  }

  @Patch('batch-toggle')
  async batchToggle(@Body() body: { ids: string[]; status: 'active' | 'inactive' }, @Req() req: any) {
    this.assertAdmin(req, 'batch toggle insurer status');
    return this.insurerService.batchToggleStatus(body.ids, body.status);
  }

  @Delete('batch')
  async batchRemove(@Body() body: { ids: string[] }, @Req() req: any) {
    this.assertAdmin(req, 'batch delete insurers');
    return this.insurerService.batchRemove(body.ids);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    this.assertAdmin(req, 'delete insurer');
    return this.insurerService.remove(id);
  }
}
