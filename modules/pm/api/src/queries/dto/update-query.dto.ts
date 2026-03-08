import { IsString, IsOptional, IsBoolean, IsArray, MaxLength } from 'class-validator';

export class UpdateQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsArray()
  filters?: any[];

  @IsOptional()
  @IsArray()
  sortBy?: any[];

  @IsOptional()
  @IsString()
  groupBy?: string;

  @IsOptional()
  @IsArray()
  columns?: string[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  displayType?: string;
}
