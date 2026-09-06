import { NestFactory } from '@nestjs/core';
import { Controller, Module } from '@nestjs/common';

@Controller()
class HelloController {
  @Get()
  getHello(): string {
    return 'Hello World!';
  }
}

@Module({
  imports: [],
  controllers: [HelloController],
})
class TestAppModule {}

async function bootstrap() {
  console.log('[Test] Starting bare-bones NestJS server...');
  const app = await NestFactory.create(TestAppModule);
  await app.listen(3001);
  console.log('[✓] Test server running on port 3001');
}

bootstrap().catch(console.error);
