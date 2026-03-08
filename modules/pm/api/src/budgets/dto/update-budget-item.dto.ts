import { IsString, IsOptional, IsNumber, IsEnum, MaxLength } from 'class-validator';
import { BudgetItemTypeDto } from './create-budget-item.dto';

export class UpdateBudgetItemDto {
  @IsOptional()
  @IsEnum(BudgetItemTypeDto)
  type?: BudgetItemTypeDto;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  workPackageId?: string;
}
