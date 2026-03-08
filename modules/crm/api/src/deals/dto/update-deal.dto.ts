import { IsString, IsOptional, IsNumber, MaxLength, IsDateString, IsObject } from 'class-validator';

export class UpdateDealDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

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

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsObject()
  customData?: Record<string, any>;
}
