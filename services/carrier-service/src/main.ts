import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { CarrierModule } from './modules/carrier/carrier.module';

async function bootstrap() {
  const app = await NestFactory.create(CarrierModule);
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3002',
    credentials: true,
  });

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`Carrier Service running on http://localhost:${port}`);
}

bootstrap();
