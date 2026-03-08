import {
  IsString,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowStateInput {
  @IsString()
  typeId!: string;

  @IsString()
  statusId!: string;

  @IsString()
  roleId!: string;

  @IsBoolean()
  allowCreate!: boolean;
}

export class SaveWorkflowDto {
  @IsString()
  workspaceId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStateInput)
  states!: WorkflowStateInput[];
}
