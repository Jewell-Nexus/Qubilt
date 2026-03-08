import { IsString, IsOptional, IsArray } from 'class-validator';

export class BulkUpdateDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];

  @IsOptional()
  @IsString()
  statusId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @IsOptional()
  @IsString()
  priorityId?: string;

  @IsOptional()
  @IsString()
  versionId?: string | null;
}
