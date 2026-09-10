import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordHashingService } from '../../common/services/password-hashing.service';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    PassportModule.register({ 
      defaultStrategy: 'jwt',
      session: false,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'overinsur-jwt-secret-change-in-production',
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRY') || '1h',
          algorithm: 'HS256' as const,
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    PasswordHashingService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
