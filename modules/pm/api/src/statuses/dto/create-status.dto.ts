import { IsString, MaxLength, IsBoolean, IsOptional } from 'class-validator';

export class CreateStatusDto {
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
  isClosed?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isReadonly?: boolean;
}
