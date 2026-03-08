import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  versionId?: string;
}
