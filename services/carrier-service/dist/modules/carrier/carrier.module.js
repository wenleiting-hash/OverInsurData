"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarrierModule = void 0;
const common_1 = require("@nestjs/common");
const carrier_service_1 = require("./carrier.service");
const carrier_controller_1 = require("./carrier.controller");
let CarrierModule = class CarrierModule {
};
exports.CarrierModule = CarrierModule;
exports.CarrierModule = CarrierModule = __decorate([
    (0, common_1.Module)({
        providers: [carrier_service_1.CarrierService],
        controllers: [carrier_controller_1.CarrierController],
    })
], CarrierModule);
//# sourceMappingURL=carrier.module.js.map