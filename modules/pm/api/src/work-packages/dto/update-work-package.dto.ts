import {
  IsString,
  MaxLength,
  IsOptional,
  IsDateString,
  IsNumber,
  IsInt,
} from 'class-validator';

export class UpdateWorkPackageDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subject?: string;

  @IsOptional()
  @IsString()
  typeId?: string;

  @IsOptional()
  @IsString()
  statusId?: string;

  @IsOptional()
  @IsString()
  priorityId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number | null;

  @IsOptional()
  @IsString()
  versionId?: string | null;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsInt()
  storyPoints?: number | null;

  @IsOptional()
  @IsInt()
  percentDone?: number;
}
