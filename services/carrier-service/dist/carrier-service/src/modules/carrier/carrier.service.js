"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarrierService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_client_1 = require("../../../../shared/database/drizzle.client");
const schema_1 = require("../../../../shared/database/schema");
let CarrierService = class CarrierService {
    async findAll() {
        return drizzle_client_1.db.select().from(schema_1.insuranceCarrier);
    }
    async findById(id) {
        return drizzle_client_1.db.query.insuranceCarrier.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.insuranceCarrier.carrierId, id),
        });
    }
    async create(data) {
        const result = await drizzle_client_1.db.insert(schema_1.insuranceCarrier).values(data).returning();
        return result[0];
    }
};
exports.CarrierService = CarrierService;
exports.CarrierService = CarrierService = __decorate([
    (0, common_1.Injectable)()
], CarrierService);
//# sourceMappingURL=carrier.service.js.map