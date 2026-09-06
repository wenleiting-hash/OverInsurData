import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CarrierModule } from './modules/carrier/carrier.module';
import { AuthModule } from './modules/auth/auth.module';
import { OvwrModule } from './modules/ovwr/ovwr.module';
import { PreferencesModule } from './modules/preferences/preferences.module';

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
  ],
})
export class AppModule {}
