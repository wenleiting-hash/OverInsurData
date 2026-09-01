import { insuranceCarrier } from '../../../../shared/database/schema';
export declare class CarrierService {
    findAll(): Promise<typeof insuranceCarrier.$inferSelect[]>;
    findById(id: string): Promise<typeof insuranceCarrier.$inferSelect | null>;
    create(data: Partial<typeof insuranceCarrier.$inferInsert>): Promise<typeof insuranceCarrier.$inferInsert>;
}
