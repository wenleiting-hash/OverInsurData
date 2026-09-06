import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CarrierService } from './carrier.service';

@Controller('carriers')
export class CarrierController {
  constructor(private readonly carrierService: CarrierService) {}

  @Get()
  async findAll() {
    return this.carrierService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.carrierService.findById(id);
  }

  @Post()
  async create(@Body() createDto: any) {
    return this.carrierService.create(createDto);
  }
}
