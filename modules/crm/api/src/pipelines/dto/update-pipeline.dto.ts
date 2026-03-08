import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdatePipelineDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
