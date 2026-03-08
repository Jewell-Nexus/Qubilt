import { IsString, IsOptional, MaxLength, IsObject } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsString()
  @MaxLength(100)
  category!: string;

  @IsObject()
  content!: any;
}
