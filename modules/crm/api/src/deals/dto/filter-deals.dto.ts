import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterDealsDto {
  @IsString()
  workspaceId!: string;

  @IsOptional()
  @IsString()
  pipelineId?: string;

  @IsOptional()
  @IsString()
  stageId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsEnum(['OPEN', 'WON', 'LOST'])
  status?: 'OPEN' | 'WON' | 'LOST';

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valueMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valueMax?: number;

  @IsOptional()
  @IsDateString()
  closeDateFrom?: string;

  @IsOptional()
  @IsDateString()
  closeDateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class MoveStageDto {
  @IsString()
  targetStageId!: string;
}
