import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { LocalStrategy } from './strategies/local.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity.js';

@Module({
  imports: [
    // UsersModule,
    PassportModule,
    // TypeOrmModule.forFeature([RefreshToken]),
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // secret: config.get<string>('security.jwtAccessSecret'),
        secret: 'secret',
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // RefreshTokenService,
    // RefreshTokenCleanupTask,
    LocalStrategy,
    JwtStrategy,
    // Applies JwtAuthGuard to EVERY route in the app by default.
    // Use @Public() on a route to exempt it (register, login, refresh, etc.)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
