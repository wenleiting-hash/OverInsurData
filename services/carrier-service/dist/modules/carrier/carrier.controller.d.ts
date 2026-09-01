import { CarrierService } from './carrier.service';
export declare class CarrierController {
    private readonly carrierService;
    constructor(carrierService: CarrierService);
    findAll(): Promise<{
        carrierId: string;
        carrierName: string;
        naicCode: string;
        type: string | null;
        rating: string | null;
        status: string | null;
        contactInfo: {
            address?: string;
            phone?: string;
            email?: string;
        } | null;
        settlementConfig: {
            currency?: string;
            paymentTermDays?: number;
        } | null;
        createdAt: Date | null;
        updatedAt: Date | null;
    }[]>;
    findOne(id: string): Promise<{
        carrierId: string;
        carrierName: string;
        naicCode: string;
        type: string | null;
        rating: string | null;
        status: string | null;
        contactInfo: {
            address?: string;
            phone?: string;
            email?: string;
        } | null;
        settlementConfig: {
            currency?: string;
            paymentTermDays?: number;
        } | null;
        createdAt: Date | null;
        updatedAt: Date | null;
    }>;
    create(createDto: any): Promise<{
        carrierId: string;
        carrierName: string;
        naicCode: string;
        type: string | null;
        rating: string | null;
        status: string | null;
        contactInfo: {
            address?: string;
            phone?: string;
            email?: string;
        } | null;
        settlementConfig: {
            currency?: string;
            paymentTermDays?: number;
        } | null;
        createdAt: Date | null;
        updatedAt: Date | null;
    }>;
}
