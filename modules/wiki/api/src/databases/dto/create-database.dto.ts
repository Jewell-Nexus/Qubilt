import { IsString, IsOptional, MaxLength, IsObject } from 'class-validator';

export class CreateDatabaseDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsObject()
  schema?: any;
}
