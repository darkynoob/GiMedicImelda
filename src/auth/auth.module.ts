import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './application/services/auth.service';
import { PasswordService } from './application/services/password.service';
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard';
import { PermissionsGuard } from './infrastructure/permissions.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: false,
        secret:
          configService.get<string>('JWT_ACCESS_SECRET') ??
          'gimedic-dev-access-secret',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_ACCESS_EXPIRES_IN') ??
            '15m') as never,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, JwtAuthGuard, PermissionsGuard],
  exports: [AuthService, PasswordService, JwtAuthGuard, PermissionsGuard, JwtModule],
})
export class AuthModule {}
