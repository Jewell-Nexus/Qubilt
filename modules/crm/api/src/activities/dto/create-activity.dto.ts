import { IsString, IsOptional, IsEnum, MaxLength, IsDateString } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  workspaceId!: string;

  @IsEnum(['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'DEADLINE'])
  type!: 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'NOTE' | 'DEADLINE';

  @IsString()
  @MaxLength(500)
  subject!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  dealId?: string;

  @IsString()
  userId!: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
