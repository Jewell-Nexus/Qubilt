import { IsString, MaxLength, IsBoolean, IsOptional } from 'class-validator';

export class UpdateStatusDto {
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
  isClosed?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isReadonly?: boolean;
}
