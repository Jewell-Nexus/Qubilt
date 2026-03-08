import { IsString, MaxLength, IsBoolean, IsOptional } from 'class-validator';

export class CreateTypeDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(7)
  color!: string;

  @IsString()
  workspaceId!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isMilestone?: boolean;
}
