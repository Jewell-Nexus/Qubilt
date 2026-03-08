import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@kernel/auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ReactionsController {
  constructor(private reactionsService: ReactionsService) {}

  @Post('messages/:id/reactions')
  async toggle(
    @Param('id') messageId: string,
    @CurrentUser() user: any,
    @Body() body: { emoji: string },
  ) {
    const data = await this.reactionsService.toggle(messageId, user.id, body.emoji);
    return { success: true, data };
  }
}
