import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<ApiResponse<any>> {
    const data = await this.authService.register(dto);
    return { success: true, data };
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.authService.login(req.user, {
      userAgent: req.headers?.['user-agent'],
      ipAddress: req.ip,
    });
    return { success: true, data };
  }

  @Public()
  @Post('2fa/verify')
  async verify2fa(
    @Body('tempToken') tempToken: string,
    @Body('token') token: string,
    @Request() req: any,
  ): Promise<ApiResponse<any>> {
    const data = await this.authService.verify2faLogin(tempToken, token, {
      userAgent: req.headers?.['user-agent'],
      ipAddress: req.ip,
    });
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Body('refreshToken') refreshToken: string): Promise<ApiResponse<any>> {
    await this.authService.logout(refreshToken);
    return { success: true, data: { message: 'Logged out' } };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@CurrentUser() user: any): Promise<ApiResponse<any>> {
    const data = await this.authService.refreshTokens(user.refreshToken);
    return { success: true, data };
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<ApiResponse<any>> {
    const data = await this.authService.verifyEmail(dto.token);
    return { success: true, data };
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ApiResponse<any>> {
    const data = await this.authService.requestPasswordReset(dto.email);
    return { success: true, data };
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<ApiResponse<any>> {
    const data = await this.authService.resetPassword(dto.token, dto.newPassword);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any): Promise<ApiResponse<any>> {
    return { success: true, data: user };
  }
}
