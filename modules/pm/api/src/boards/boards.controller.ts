import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm')
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  @Get('projects/:pid/boards')
  @RequirePermissions('pm.work_packages.view')
  async findAll(@Param('pid') projectId: string) {
    const data = await this.boardsService.findAll(projectId);
    return { success: true, data };
  }

  @Post('projects/:pid/boards')
  @RequirePermissions('pm.boards.manage')
  async create(
    @Param('pid') projectId: string,
    @Body() dto: CreateBoardDto,
  ) {
    const data = await this.boardsService.create(projectId, dto);
    return { success: true, data };
  }

  @Get('boards/:id')
  @RequirePermissions('pm.work_packages.view')
  async findOne(@Param('id') id: string) {
    const data = await this.boardsService.findOne(id);
    return { success: true, data };
  }

  @Patch('boards/:id')
  @RequirePermissions('pm.boards.manage')
  async update(@Param('id') id: string, @Body() dto: UpdateBoardDto) {
    const data = await this.boardsService.update(id, dto);
    return { success: true, data };
  }

  @Delete('boards/:id')
  @RequirePermissions('pm.boards.manage')
  async delete(@Param('id') id: string) {
    await this.boardsService.delete(id);
    return { success: true };
  }

  @Patch('board-columns/:id')
  @RequirePermissions('pm.boards.manage')
  async updateColumn(@Param('id') id: string, @Body() dto: UpdateColumnDto) {
    const data = await this.boardsService.updateColumn(id, dto);
    return { success: true, data };
  }

  @Post('boards/:id/columns/reorder')
  @RequirePermissions('pm.boards.manage')
  async reorderColumns(
    @Param('id') boardId: string,
    @Body() dto: ReorderColumnsDto,
  ) {
    await this.boardsService.reorderColumns(boardId, dto.orderedIds);
    return { success: true };
  }

  @Post('board-cards/:id/move')
  @RequirePermissions('pm.work_packages.edit')
  async moveCard(
    @Param('id') cardId: string,
    @Body() dto: MoveCardDto,
    @Req() req: any,
  ) {
    await this.boardsService.moveCard(cardId, dto, req.user.id);
    return { success: true };
  }
}
