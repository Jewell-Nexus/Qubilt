import { IsString, IsOptional, IsEnum, IsArray, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterContactsDto {
  @IsString()
  workspaceId!: string;

  @IsOptional()
  @IsEnum(['PERSON', 'ORGANIZATION'])
  type?: 'PERSON' | 'ORGANIZATION';

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  search?: string;

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
