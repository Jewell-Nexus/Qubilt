import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreatePageDto {
  @IsString()
  workspaceId!: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string = 'Untitled';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsString()
  templateId?: string;
}
