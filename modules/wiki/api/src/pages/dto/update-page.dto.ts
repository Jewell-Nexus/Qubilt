import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}
