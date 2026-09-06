import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController, UserController } from './auth.controller';
import { PasswordHashingService } from '../../common/services/password-hashing.service';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    // Enable Passport for JWT authentication with mock token support
    PassportModule.register({ 
      defaultStrategy: 'jwt',
      session: false,
    }),
  ],
  providers: [
    AuthService,
    PasswordHashingService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  controllers: [AuthController, UserController],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
