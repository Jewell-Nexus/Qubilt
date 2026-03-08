import { IsString, IsOptional, MaxLength, IsDateString } from 'class-validator';

export class CreateSprintDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  versionId?: string;
}
