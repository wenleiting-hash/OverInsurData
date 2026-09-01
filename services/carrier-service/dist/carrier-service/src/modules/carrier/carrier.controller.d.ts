import { CarrierService } from './carrier.service';
export declare class CarrierController {
    private readonly carrierService;
    constructor(carrierService: CarrierService);
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<any>;
    create(createDto: any): Promise<any>;
}
