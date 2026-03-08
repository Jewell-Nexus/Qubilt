import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import LdapStrategy from 'passport-ldapauth';
import { PrismaService } from '../../../database/prisma.service';

/**
 * LDAP authentication strategy (skeleton).
 * Full group sync will be implemented in Phase 15.
 *
 * Config is loaded from workspace settings:
 *   - ldap.serverUrl
 *   - ldap.bindDN
 *   - ldap.bindCredentials
 *   - ldap.searchBase
 *   - ldap.searchFilter
 */
@Injectable()
export class LdapAuthStrategy extends PassportStrategy(LdapStrategy, 'ldap') {
  private readonly logger = new Logger(LdapAuthStrategy.name);

  constructor(private readonly prisma: PrismaService) {
    super(
      {
        server: {
          url: process.env.LDAP_URL || 'ldap://localhost:389',
          bindDN: process.env.LDAP_BIND_DN || '',
          bindCredentials: process.env.LDAP_BIND_CREDENTIALS || '',
          searchBase: process.env.LDAP_SEARCH_BASE || 'dc=example,dc=com',
          searchFilter: process.env.LDAP_SEARCH_FILTER || '(uid={{username}})',
        },
        passReqToCallback: true,
      },
      async (req: any, ldapUser: any, done: Function) => {
        try {
          const result = await this.validate(req, ldapUser);
          done(null, result);
        } catch (err) {
          done(err, null);
        }
      },
    );
  }

  async validate(_req: any, ldapUser: any) {
    const email =
      ldapUser.mail || ldapUser.userPrincipalName || ldapUser.uid;
    if (!email) {
      throw new Error('LDAP user has no email attribute');
    }

    // Upsert auth provider
    const provider = await this.prisma.userAuthProvider.upsert({
      where: {
        provider_providerUserId: {
          provider: 'ldap',
          providerUserId: ldapUser.dn || ldapUser.uid,
        },
      },
      update: {
        metadata: ldapUser,
      },
      create: {
        provider: 'ldap',
        providerUserId: ldapUser.dn || ldapUser.uid,
        metadata: ldapUser,
        user: {
          connectOrCreate: {
            where: { email },
            create: {
              email,
              username: ldapUser.uid || email.split('@')[0],
              displayName: ldapUser.cn || ldapUser.displayName || email,
            },
          },
        },
      },
      include: { user: true },
    });

    return { id: provider.user.id, email: provider.user.email };
  }
}
