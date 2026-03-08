import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { SaveWorkflowDto } from './dto/save-workflow.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm/workflows')
export class WorkflowsController {
  constructor(private workflowsService: WorkflowsService) {}

  @Get()
  async getWorkflow(@Query('workspaceId') workspaceId: string) {
    const data = await this.workflowsService.getWorkflow(workspaceId);
    return { success: true, data };
  }

  @Put()
  @RequirePermissions('pm.types.manage')
  async saveWorkflow(@Body() dto: SaveWorkflowDto) {
    await this.workflowsService.saveWorkflowStates(
      dto.workspaceId,
      dto.states,
    );
    return { success: true };
  }
}
