import {
  IsString,
  MaxLength,
  IsOptional,
  IsDateString,
  IsNumber,
  IsInt,
} from 'class-validator';

export class CreateWorkPackageDto {
  @IsString()
  @MaxLength(500)
  subject!: string;

  @IsString()
  typeId!: string;

  @IsOptional()
  @IsString()
  statusId?: string;

  @IsOptional()
  @IsString()
  priorityId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsString()
  versionId?: string;

  @IsOptional()
  @IsInt()
  storyPoints?: number;
}
