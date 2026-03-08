import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TotpService } from './two-factor/totp.service';
import { TotpController } from './two-factor/totp.controller';
import { SessionsController } from './sessions.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LdapAuthStrategy } from './strategies/ldap.strategy';
import { OidcStrategy } from './strategies/oidc.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessExpiresIn'),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    TotpService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    LdapAuthStrategy,
    OidcStrategy,
  ],
  controllers: [AuthController, TotpController, SessionsController],
  exports: [AuthService, TotpService],
})
export class AuthModule {}
