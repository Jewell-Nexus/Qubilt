import { IsString, IsOptional, IsNumber, IsBoolean, MaxLength, Min, Max } from 'class-validator';

export class CreateStageDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @IsOptional()
  @IsBoolean()
  isWon?: boolean;

  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}

export class UpdateStageDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @IsOptional()
  @IsBoolean()
  isWon?: boolean;

  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}

export class ReorderStagesDto {
  @IsString({ each: true })
  orderedIds!: string[];
}
