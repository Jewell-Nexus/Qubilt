import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, Min, Max } from 'class-validator';

export class LogTimeDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  workPackageId?: string;

  @IsNumber()
  @Min(0.25)
  @Max(24)
  hours!: number;

  @IsDateString()
  spentOn!: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  activityId?: string;

  @IsOptional()
  @IsBoolean()
  billable?: boolean;
}
