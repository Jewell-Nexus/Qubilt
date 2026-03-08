import { IsString, IsOptional, IsEnum, MaxLength, IsDateString } from 'class-validator';

export class UpdateActivityDto {
  @IsOptional()
  @IsEnum(['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'DEADLINE'])
  type?: 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'NOTE' | 'DEADLINE';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  subject?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
