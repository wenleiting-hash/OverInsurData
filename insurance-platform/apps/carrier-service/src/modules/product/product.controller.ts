import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, Req, UseGuards, ForbiddenException, Logger,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductDetailService } from './product-detail.service';
import { CreateProductDto, UpdateProductDto } from './dtos/product.dto';
import { CreateUnderwritingRuleDto, CreateTrainingMaterialDto, UpdateUnderwritingRuleDto, SetRuleStatusDto, SetMaterialStatusDto, CreateRatePlanDto, UpdateRatePlanDto } from './dtos/product-detail.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);
  constructor(
    private readonly productService: ProductService,
    private readonly productDetailService: ProductDetailService,
  ) {}

  private assertAdmin(req: any, action: string): string {
    const roles: string[] = req.user?.roles || [];
    if (!roles.some((r: string) => ['super_admin', 'ops_manager'].includes(r))) throw new ForbiddenException(`Insufficient permissions for: ${action}`);
    return req.user?.userId;
  }

  @Get()
  async getList(@Query() q: any) {
    return this.productService.getList({
      search: q.search, insurer: q.insurer, line: q.line, status: q.status,
      sortKey: q.sortKey, sortDir: q.sortDir,
      page: q.page ? parseInt(q.page, 10) : 1, size: q.size ? parseInt(q.size, 10) : 20,
    });
  }

  /** Check if a product code is available (real-time validation while the form is being filled).
   *  MUST be declared before @Get(':id') — otherwise "check-code" is routed as a product id. */
  @Get('check-code/:code')
  async checkCode(@Param('code') code: string, @Query('excludeId') excludeId?: string) {
    const trimmed = (code || '').trim();
    if (!trimmed) return { valid: false, available: false, message: 'Product code is required' };
    const result = await this.productService.checkCodeAvailable(trimmed, excludeId);
    return {
      valid: true,
      available: result.available,
      existingId: result.existingId || null,
      message: result.available ? 'Product code is available' : `Product code "${trimmed}" is already in use`,
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) { return this.productService.getById(id); }

  // ── Read-only sub-resources backing the 5 ProductDetail tabs (no assertAdmin: view-only) ──
  @Get(':id/rate-plans')
  async getRatePlans(@Param('id') id: string) { return this.productDetailService.getRatePlans(id); }

  @Get(':id/states')
  async getStates(@Param('id') id: string) { return this.productDetailService.getStates(id); }

  @Get(':id/underwriting-rules')
  async getUnderwritingRules(@Param('id') id: string) { return this.productDetailService.getUnderwritingRules(id); }

  @Get(':id/training-materials')
  async getTrainingMaterials(@Param('id') id: string) { return this.productDetailService.getTrainingMaterials(id); }

  @Get(':id/performance')
  async getPerformance(@Param('id') id: string) { return this.productDetailService.getPerformance(id); }

  // ── Write sub-resources (admin only). modified_by / uploaded_by come from the JWT, never the body ──
  @Post(':id/underwriting-rules')
  async createUnderwritingRule(@Param('id') id: string, @Body() dto: CreateUnderwritingRuleDto, @Req() req: any) {
    this.assertAdmin(req, 'create underwriting rule');
    return this.productDetailService.createUnderwritingRule(id, dto, req.user?.username ?? req.user?.userId);
  }

  @Post(':id/training-materials')
  async createTrainingMaterial(@Param('id') id: string, @Body() dto: CreateTrainingMaterialDto, @Req() req: any) {
    this.assertAdmin(req, 'create training material');
    return this.productDetailService.createTrainingMaterial(id, dto, req.user?.username ?? req.user?.userId);
  }

  @Post(':id/rate-plans')
  async createRatePlan(@Param('id') id: string, @Body() dto: CreateRatePlanDto, @Req() req: any) {
    this.assertAdmin(req, 'create rate plan');
    return this.productDetailService.createRatePlan(id, dto);
  }

  @Patch(':id/rate-plans/:planId')
  async updateRatePlan(
    @Param('id') id: string, @Param('planId') planId: string,
    @Body() dto: UpdateRatePlanDto, @Req() req: any,
  ) {
    this.assertAdmin(req, 'update rate plan');
    return this.productDetailService.updateRatePlan(id, planId, dto);
  }

  @Patch(':id/underwriting-rules/:ruleId')
  async updateUnderwritingRule(
    @Param('id') id: string, @Param('ruleId') ruleId: string,
    @Body() dto: UpdateUnderwritingRuleDto, @Req() req: any,
  ) {
    this.assertAdmin(req, 'update underwriting rule');
    return this.productDetailService.updateUnderwritingRule(id, ruleId, dto, req.user?.username ?? req.user?.userId);
  }

  @Patch(':id/underwriting-rules/:ruleId/status')
  async setRuleStatus(
    @Param('id') id: string, @Param('ruleId') ruleId: string,
    @Body() dto: SetRuleStatusDto, @Req() req: any,
  ) {
    this.assertAdmin(req, 'change underwriting rule status');
    return this.productDetailService.setRuleStatus(id, ruleId, dto.status, req.user?.username ?? req.user?.userId);
  }

  @Patch(':id/training-materials/:materialId/status')
  async setMaterialStatus(
    @Param('id') id: string, @Param('materialId') materialId: string,
    @Body() dto: SetMaterialStatusDto, @Req() req: any,
  ) {
    this.assertAdmin(req, 'change training material status');
    return this.productDetailService.setMaterialStatus(id, materialId, dto.status);
  }

  @Delete(':id/rate-plans/:planId')
  async deleteRatePlan(@Param('id') id: string, @Param('planId') planId: string, @Req() req: any) {
    this.assertAdmin(req, 'delete rate plan');
    return this.productDetailService.deleteRatePlan(id, planId);
  }

  @Delete(':id/underwriting-rules/:ruleId')
  async deleteUnderwritingRule(@Param('id') id: string, @Param('ruleId') ruleId: string, @Req() req: any) {
    this.assertAdmin(req, 'delete underwriting rule');
    return this.productDetailService.deleteRule(id, ruleId);
  }

  @Delete(':id/training-materials/:materialId')
  async deleteTrainingMaterial(@Param('id') id: string, @Param('materialId') materialId: string, @Req() req: any) {
    this.assertAdmin(req, 'delete training material');
    return this.productDetailService.deleteMaterial(id, materialId);
  }

  @Post()
  async create(@Body() dto: CreateProductDto, @Req() req: any) {
    const uid = this.assertAdmin(req, 'create product');
    return this.productService.create(dto, uid);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Req() req: any) {
    this.assertAdmin(req, 'update product');
    return this.productService.update(id, dto);
  }

  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id') id: string, @Req() req: any) {
    this.assertAdmin(req, 'toggle product status');
    return this.productService.toggleStatus(id);
  }

  @Patch('batch-toggle')
  async batchToggle(@Body() body: { ids: string[]; status: string }, @Req() req: any) {
    this.assertAdmin(req, 'batch toggle product status');
    return this.productService.batchToggleStatus(body.ids, body.status);
  }

  @Delete('batch')
  async batchRemove(@Body() body: { ids: string[] }, @Req() req: any) {
    this.assertAdmin(req, 'batch delete products');
    return this.productService.batchRemove(body.ids);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    this.assertAdmin(req, 'delete product');
    return this.productService.remove(id);
  }
}
