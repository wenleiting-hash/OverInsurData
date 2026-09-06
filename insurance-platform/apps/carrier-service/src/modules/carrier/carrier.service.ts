import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import db, { pool } from '../../database/drizzle.client';
import { insuranceCarrier } from '../../database/schema';

@Injectable()
export class CarrierService {
  async findAll() {
    return db.select().from(insuranceCarrier);
  }

  async findById(id: string) {
    const results = await db.select().from(insuranceCarrier).where(eq(insuranceCarrier.carrierId, id));
    return results[0] || null;
  }

  async create(data: any) {
    const result = await db.insert(insuranceCarrier).values(data).returning();
    return result[0];
  }
}
