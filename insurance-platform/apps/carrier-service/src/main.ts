import { NestFactory } from '@nestjs/core';
import { ValidationPipe, LogLevel } from '@nestjs/common';
import * as express from 'express';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const logLevel: LogLevel[] = 
      process.env.NODE_ENV === 'development' 
        ? ['error', 'warn', 'log', 'debug'] 
        : ['error', 'warn', 'log'];

    const app = await NestFactory.create(AppModule, {
      logger: logLevel,
    });
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: false,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );
    
    app.enableCors({
      origin: true,
      credentials: true,
      exposedHeaders: ['x-total-count', 'Authorization'],
    });
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Request logging middleware (for debugging)
    app.use((req, res, next) => {
      console.log(`[MIDDLEWARE] ${req.method} ${req.url}`);
      // ⚠️ 必须调用 next() 才能继续传递请求！
      next();
    });
    
    const port = process.env.PORT || 8080;
    await app.listen(port);
    console.log('Carrier Service running on http://localhost:' + port);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
