import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get('projects/:pid/categories')
  @RequirePermissions('pm.work_packages.view')
  async findAll(@Param('pid') projectId: string) {
    const data = await this.categoriesService.findAll(projectId);
    return { success: true, data };
  }

  @Post('projects/:pid/categories')
  @RequirePermissions('pm.types.manage')
  async create(
    @Param('pid') projectId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    const data = await this.categoriesService.create(projectId, dto);
    return { success: true, data };
  }

  @Patch('categories/:id')
  @RequirePermissions('pm.types.manage')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const data = await this.categoriesService.update(id, dto);
    return { success: true, data };
  }

  @Delete('categories/:id')
  @RequirePermissions('pm.types.manage')
  async delete(@Param('id') id: string) {
    await this.categoriesService.delete(id);
    return { success: true };
  }
}
