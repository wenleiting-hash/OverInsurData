import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, LogLevel, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppModule } from './app.module';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from './modules/upload/upload.config';

async function bootstrap() {
  try {
    const logger = new Logger('Bootstrap');
    const logLevel: LogLevel[] = 
      process.env.NODE_ENV === 'development' 
        ? ['error', 'warn', 'log', 'debug'] 
        : ['error', 'warn', 'log'];

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: logLevel,
    });

    // Serve locally-stored uploads (product compliance documents / training materials) at /uploads/<file>
    app.useStaticAssets(UPLOAD_DIR, { prefix: `${UPLOAD_URL_PREFIX}/` });
    
    // Initialize Swagger UI for API documentation
    const config = new DocumentBuilder()
      .setTitle('Carrier Service API')
      .setDescription('海外保险数字化平台 - Carrier Service RESTful API Documentation')
      .setVersion('1.0')
      .addTag('User Management', '用户管理模块 - CRUD operations')
      .addTag('Auth Module', '认证与授权')
      .addTag('Permission Templates', '权限模板管理')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    
    // Security: Strict ValidationPipe — reject unknown properties
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );
    
    // Security: CORS whitelist — only allow configured origins
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3001,http://localhost:5173')
      .split(',')
      .map(o => o.trim());
    
    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, server-to-server, health checks)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn(`Blocked CORS request from origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      exposedHeaders: ['x-total-count', 'Authorization'],
    });
    
    // Note: NestJS already includes body-parser middleware by default.
    // No need to manually add express.json() / express.urlencoded().
    
    const port = process.env.PORT || 8080;
    await app.listen(port);
    logger.log(`Carrier Service running on http://localhost:${port}`);
    logger.log(`Swagger UI available at http://localhost:${port}/api`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
