import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreatePipelineDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
