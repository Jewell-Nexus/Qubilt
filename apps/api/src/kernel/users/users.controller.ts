import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(
    @CurrentUser() user: { userId: string },
  ): Promise<ApiResponse<any>> {
    const data = await this.usersService.findById(user.userId);
    return { success: true, data };
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateUserDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.usersService.update(user.userId, dto);
    return { success: true, data };
  }

  @Patch('me/password')
  async updatePassword(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdatePasswordDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.usersService.updatePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
    return { success: true, data };
  }
}
