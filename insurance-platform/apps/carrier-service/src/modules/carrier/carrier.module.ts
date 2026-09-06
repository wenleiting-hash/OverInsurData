import { Module } from '@nestjs/common';
import { CarrierService } from './carrier.service';
import { CarrierController } from './carrier.controller';
import { OvwrModule } from '../ovwr/ovwr.module';

@Module({
  imports: [OvwrModule],
  providers: [CarrierService],
  controllers: [CarrierController],
})
export class CarrierModule {}
