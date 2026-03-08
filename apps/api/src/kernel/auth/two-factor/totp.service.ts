import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class TotpService {
  constructor(private readonly prisma: PrismaService) {}

  async generateSecret(userId: string) {
    const secret = speakeasy.generateSecret({
      name: 'Qubilt',
      issuer: 'Qubilt',
    });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate 8 backup codes
    const plainBackupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex'),
    );
    const hashedBackupCodes = await Promise.all(
      plainBackupCodes.map((code) => bcrypt.hash(code, 10)),
    );

    // Store secret and backup codes but do NOT enable 2FA yet
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
        backupCodes: hashedBackupCodes,
      },
    });

    return {
      secret: secret.base32,
      qrCodeDataUrl,
      backupCodes: plainBackupCodes,
    };
  }

  async enable(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) {
      throw new BadRequestException('2FA setup not initiated');
    }

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!valid) {
      throw new UnauthorizedException('Invalid TOTP token');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  async verify(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) return false;

    // Check TOTP token
    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (valid) return true;

    // Check backup codes
    for (let i = 0; i < user.backupCodes.length; i++) {
      const match = await bcrypt.compare(token, user.backupCodes[i]);
      if (match) {
        // Remove used backup code
        const updatedCodes = [...user.backupCodes];
        updatedCodes.splice(i, 1);
        await this.prisma.user.update({
          where: { id: userId },
          data: { backupCodes: updatedCodes },
        });
        return true;
      }
    }

    return false;
  }

  async disable(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.hashedPassword) {
      throw new BadRequestException('Cannot verify password');
    }

    const passwordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: [],
      },
    });
  }
}
