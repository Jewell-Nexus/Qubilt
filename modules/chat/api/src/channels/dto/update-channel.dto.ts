import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isReadonly?: boolean;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
