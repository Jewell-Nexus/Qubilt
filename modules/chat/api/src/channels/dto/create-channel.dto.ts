import { IsString, IsOptional, IsEnum, MaxLength, IsArray } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['PUBLIC', 'PRIVATE', 'DIRECT'])
  type!: 'PUBLIC' | 'PRIVATE' | 'DIRECT';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}
