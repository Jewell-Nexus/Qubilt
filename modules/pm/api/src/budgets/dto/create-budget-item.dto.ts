import { IsString, IsOptional, IsNumber, IsEnum, MaxLength } from 'class-validator';

export enum BudgetItemTypeDto {
  LABOR = 'LABOR',
  MATERIAL = 'MATERIAL',
}

export class CreateBudgetItemDto {
  @IsEnum(BudgetItemTypeDto)
  type!: BudgetItemTypeDto;

  @IsString()
  @MaxLength(255)
  description!: string;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  workPackageId?: string;
}
