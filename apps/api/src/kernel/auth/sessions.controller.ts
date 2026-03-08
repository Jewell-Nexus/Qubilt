import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('auth/sessions')
export class SessionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listSessions(
    @CurrentUser() user: { userId: string },
    @Request() req: any,
  ): Promise<ApiResponse<any>> {
    const currentToken = req.headers.authorization?.replace('Bearer ', '');
    const sessions = await this.prisma.session.findMany({
      where: {
        userId: user.userId,
        expiresAt: { gt: new Date() },
        token: { not: { startsWith: 'reset:' } },
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        token: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      current: s.token === currentToken,
    }));

    return { success: true, data };
  }

  @Delete(':id')
  async revokeSession(
    @CurrentUser() user: { userId: string },
    @Param('id') sessionId: string,
  ): Promise<ApiResponse<any>> {
    await this.prisma.session.deleteMany({
      where: { id: sessionId, userId: user.userId },
    });
    return { success: true, data: { message: 'Session revoked' } };
  }

  @Delete()
  async revokeAllOther(
    @CurrentUser() user: { userId: string },
    @Request() req: any,
  ): Promise<ApiResponse<any>> {
    const currentToken = req.headers.authorization?.replace('Bearer ', '');

    // Keep the current session, revoke all others
    await this.prisma.session.deleteMany({
      where: {
        userId: user.userId,
        token: { not: currentToken },
      },
    });

    return { success: true, data: { message: 'All other sessions revoked' } };
  }
}
