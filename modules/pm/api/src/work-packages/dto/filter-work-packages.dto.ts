import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterWorkPackagesDto {
  @IsOptional()
  @IsString()
  statusId?: string;

  @IsOptional()
  @IsString()
  typeId?: string;

  @IsOptional()
  @IsString()
  priorityId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  versionId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  overdue?: boolean;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  queryId?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
