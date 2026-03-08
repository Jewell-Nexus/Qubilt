import { IsString, IsOptional, IsNumber, MaxLength, IsDateString, IsObject } from 'class-validator';

export class CreateDealDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  pipelineId!: string;

  @IsString()
  contactId!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @IsString()
  ownerId!: string;

  @IsOptional()
  @IsObject()
  customData?: Record<string, any>;
}
