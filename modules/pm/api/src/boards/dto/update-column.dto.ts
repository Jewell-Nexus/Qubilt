import { IsString, IsOptional, MaxLength, IsObject } from 'class-validator';

export class UpdateColumnDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsObject()
  query?: Record<string, any>;
}
