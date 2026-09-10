import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, Req, UseGuards, ForbiddenException, Logger,
} from '@nestjs/common';
import { CooperationService } from './cooperation.service';
import { CreateCooperationDto, UpdateCooperationDto, CreateContractDto, CreateContactDto } from './dtos/cooperation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/cooperations')
export class CooperationController {
  private readonly logger = new Logger(CooperationController.name);
  constructor(private readonly svc: CooperationService) {}

  private assertAdmin(req: any, action: string): string {
    const roles: string[] = req.user?.roles || [];
    if (!roles.some((r: string) => ['super_admin', 'ops_manager'].includes(r))) throw new ForbiddenException(`Insufficient permissions for: ${action}`);
    return req.user?.userId;
  }

  @Get()
  async getList(@Query() q: any) { return this.svc.getList({ status: q.status, carrier: q.carrier }); }

  @Get(':id')
  async getById(@Param('id') id: string) { return this.svc.getById(id); }

  @Post()
  async create(@Body() dto: CreateCooperationDto, @Req() req: any) {
    const uid = this.assertAdmin(req, 'create cooperation');
    return this.svc.create(dto, uid);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCooperationDto, @Req() req: any) {
    this.assertAdmin(req, 'update cooperation');
    return this.svc.update(id, dto);
  }

  @Patch(':id/terminate')
  async terminate(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
    this.assertAdmin(req, 'terminate cooperation');
    return this.svc.terminate(id, reason);
  }

  @Get(':id/contracts')
  async getContracts(@Param('id') id: string) { return this.svc.getContracts(id); }

  @Post(':id/contracts')
  async addContract(@Param('id') id: string, @Body() dto: CreateContractDto, @Req() req: any) {
    this.assertAdmin(req, 'add contract');
    return this.svc.createContract(dto, id);
  }

  @Get(':id/contacts')
  async getContacts(@Param('id') id: string) { return this.svc.getContacts(id); }

  @Post(':id/contacts')
  async addContact(@Param('id') id: string, @Body() dto: CreateContactDto, @Req() req: any) {
    this.assertAdmin(req, 'add contact');
    return this.svc.createContact(dto, id);
  }

  @Get(':id/settlement')
  async getSettlement(@Param('id') id: string) { return this.svc.getSettlement(id); }

  @Put(':id/settlement')
  async updateSettlement(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    this.assertAdmin(req, 'update settlement');
    return this.svc.updateSettlement(id, dto);
  }
}
