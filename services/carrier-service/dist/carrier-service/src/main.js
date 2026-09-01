"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const carrier_module_1 = require("./modules/carrier/carrier.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(carrier_module_1.CarrierServiceModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3002',
        credentials: true,
    });
    const port = process.env.PORT || 8080;
    await app.listen(port);
    console.log(`Carrier Service running on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map