import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TotpService } from './totp.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('auth/2fa')
export class TotpController {
  constructor(private readonly totpService: TotpService) {}

  @Post('setup')
  async setup(
    @CurrentUser() user: { userId: string },
  ): Promise<ApiResponse<any>> {
    const data = await this.totpService.generateSecret(user.userId);
    return { success: true, data };
  }

  @Post('enable')
  async enable(
    @CurrentUser() user: { userId: string },
    @Body('token') token: string,
  ): Promise<ApiResponse<any>> {
    await this.totpService.enable(user.userId, token);
    return { success: true, data: { message: '2FA enabled' } };
  }

  @Post('disable')
  async disable(
    @CurrentUser() user: { userId: string },
    @Body('password') password: string,
  ): Promise<ApiResponse<any>> {
    await this.totpService.disable(user.userId, password);
    return { success: true, data: { message: '2FA disabled' } };
  }

  @Post('verify')
  async verify(
    @CurrentUser() user: { userId: string },
    @Body('token') token: string,
  ): Promise<ApiResponse<any>> {
    const valid = await this.totpService.verify(user.userId, token);
    if (!valid) {
      return { success: false, error: 'Invalid token' };
    }
    return { success: true, data: { message: 'Token verified' } };
  }
}
