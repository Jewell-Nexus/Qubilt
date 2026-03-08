import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { TotpService } from './two-factor/totp.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private totpService: TotpService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.hashedPassword) return null;

    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) return null;

    const { hashedPassword: _, ...result } = user;
    return result;
  }

  async login(
    user: { id: string; email: string },
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    // Check if user has 2FA enabled
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true },
    });

    if (fullUser?.twoFactorEnabled) {
      // Return a short-lived temp token instead of full access
      const tempToken = this.jwtService.sign(
        { sub: user.id, email: user.email, type: '2fa-pending' },
        { expiresIn: '5m' },
      );
      return { requiresTwoFactor: true, tempToken };
    }

    return this.issueTokens(user, meta);
  }

  async verify2faLogin(
    tempToken: string,
    totpToken: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    let decoded: { sub: string; email: string; type?: string };
    try {
      decoded = this.jwtService.verify(tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired temp token');
    }

    if (decoded.type !== '2fa-pending') {
      throw new UnauthorizedException('Invalid token type');
    }

    const valid = await this.totpService.verify(decoded.sub, totpToken);
    if (!valid) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    return this.issueTokens(
      { id: decoded.sub, email: decoded.email },
      meta,
    );
  }

  private async issueTokens(
    user: { id: string; email: string },
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') },
    );

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string) {
    await this.prisma.session.deleteMany({ where: { token: refreshToken } });
  }

  async refreshTokens(refreshToken: string) {
    let decoded: { sub: string; type?: string };
    try {
      decoded = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const session = await this.prisma.session.findUnique({
      where: { token: refreshToken },
    });
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Delete old session
    await this.prisma.session.delete({ where: { id: session.id } });

    // Issue new token pair
    return this.login({ id: user.id, email: user.email });
  }

  async register(dto: RegisterDto) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          displayName: dto.displayName,
          hashedPassword,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: `${dto.displayName}'s Workspace`,
          slug: dto.username,
          ownerId: newUser.id,
        },
      });

      // Seed default roles
      const adminRole = await tx.role.create({
        data: {
          workspaceId: workspace.id,
          name: 'admin',
          builtin: 'admin',
          position: 0,
          permissions: {
            create: [
              { permission: 'kernel.users.view' },
              { permission: 'kernel.users.manage' },
              { permission: 'kernel.roles.manage' },
              { permission: 'kernel.modules.manage' },
              { permission: 'kernel.workspace.manage' },
              { permission: 'kernel.billing.manage' },
            ],
          },
        },
      });

      await tx.role.create({
        data: {
          workspaceId: workspace.id,
          name: 'member',
          builtin: 'member',
          position: 1,
          permissions: {
            create: [{ permission: 'kernel.users.view' }],
          },
        },
      });

      await tx.role.create({
        data: {
          workspaceId: workspace.id,
          name: 'viewer',
          builtin: 'viewer',
          position: 2,
          permissions: {
            create: [{ permission: 'kernel.users.view' }],
          },
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: newUser.id,
          roleId: adminRole.id,
        },
      });

      return newUser;
    });

    return this.login({ id: user.id, email: user.email });
  }

  async verifyEmail(token: string) {
    // Token is the user ID for simplicity; in production, use a signed token
    const user = await this.prisma.user.findUnique({ where: { id: token } });
    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    return { message: 'Email verified successfully' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether email exists
      return { message: 'If that email exists, a reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Store hashed token in a session with a special prefix
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: `reset:${hashedToken}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // In production, emit event to send email with resetToken
    return { message: 'If that email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const session = await this.prisma.session.findUnique({
      where: { token: `reset:${hashedToken}` },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.userId },
        data: { hashedPassword },
      });

      // Invalidate all sessions for this user
      await tx.session.deleteMany({ where: { userId: session.userId } });
    });

    return { message: 'Password reset successfully' };
  }
}
