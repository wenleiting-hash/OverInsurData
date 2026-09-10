import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CarrierModule } from './modules/carrier/carrier.module';
import { AuthModule } from './modules/auth/auth.module';
import { OvwrModule } from './modules/ovwr/ovwr.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { UserModule } from './modules/user/user.module';
import { DepartmentModule } from './modules/department/department.module';
import { InsurerModule } from './modules/insurer/insurer.module';
import { ProductModule } from './modules/product/product.module';
import { CooperationModule } from './modules/cooperation/cooperation.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { FinanceModule } from './modules/finance/finance.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UploadModule } from './modules/upload/upload.module';
import { RequestTracingMiddleware } from './common/middleware/request-tracing.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      ignoreEnvFile: false,
    }),
    CarrierModule,
    AuthModule,
    OvwrModule,
    PreferencesModule,
    UserModule,
    DepartmentModule,
    InsurerModule,
    ProductModule,
    CooperationModule,
    ComplianceModule,
    FinanceModule,
    AnalyticsModule,
    UploadModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply request tracing middleware globally to all routes
    consumer.apply(RequestTracingMiddleware).forRoutes('*');
  }
}
