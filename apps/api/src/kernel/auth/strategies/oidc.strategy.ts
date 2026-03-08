import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OpenIDConnectStrategy } from 'passport-openidconnect';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

/**
 * OIDC authentication strategy (skeleton).
 * Full workspace OIDC config UI comes in Phase 15.
 *
 * Config from workspace settings:
 *   - oidc.issuer
 *   - oidc.clientID
 *   - oidc.clientSecret
 *   - oidc.callbackURL
 */
@Injectable()
export class OidcStrategy extends PassportStrategy(
  OpenIDConnectStrategy,
  'oidc',
) {
  private readonly logger = new Logger(OidcStrategy.name);

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    super({
      issuer: process.env.OIDC_ISSUER || 'https://accounts.example.com',
      authorizationURL:
        process.env.OIDC_AUTH_URL || 'https://accounts.example.com/authorize',
      tokenURL:
        process.env.OIDC_TOKEN_URL || 'https://accounts.example.com/token',
      userInfoURL:
        process.env.OIDC_USERINFO_URL ||
        'https://accounts.example.com/userinfo',
      clientID: process.env.OIDC_CLIENT_ID || '',
      clientSecret: process.env.OIDC_CLIENT_SECRET || '',
      callbackURL:
        process.env.OIDC_CALLBACK_URL ||
        `${configService.get<string>('app.apiUrl')}/auth/oidc/callback`,
      scope: ['openid', 'profile', 'email'],
    });
  }

  async validate(
    _issuer: string,
    profile: any,
    _context: any,
    _idToken: string,
    _accessToken: string,
    _refreshToken: string,
    done: Function,
  ) {
    try {
      const email = profile.emails?.[0]?.value || profile._json?.email;
      if (!email) {
        return done(new Error('OIDC profile has no email'), null);
      }

      const providerId = profile.id;

      // Upsert auth provider and user
      const provider = await this.prisma.userAuthProvider.upsert({
        where: {
          provider_providerUserId: {
            provider: 'oidc',
            providerUserId: providerId,
          },
        },
        update: {
          metadata: profile._json || {},
        },
        create: {
          provider: 'oidc',
          providerUserId: providerId,
          metadata: profile._json || {},
          user: {
            connectOrCreate: {
              where: { email },
              create: {
                email,
                username: email.split('@')[0],
                displayName: profile.displayName || email,
              },
            },
          },
        },
        include: { user: true },
      });

      done(null, { id: provider.user.id, email: provider.user.email });
    } catch (err) {
      done(err, null);
    }
  }
}
