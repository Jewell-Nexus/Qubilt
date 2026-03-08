import { IsString, MaxLength, IsBoolean, IsOptional } from 'class-validator';

export class UpdateTypeDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isMilestone?: boolean;
}
