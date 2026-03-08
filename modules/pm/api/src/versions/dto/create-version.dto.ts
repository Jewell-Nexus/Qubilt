import { IsString, IsOptional, IsEnum, MaxLength, IsDateString } from 'class-validator';

export enum VersionSharingDto {
  NONE = 'NONE',
  DESCENDANTS = 'DESCENDANTS',
  HIERARCHY = 'HIERARCHY',
  TREE = 'TREE',
  SYSTEM = 'SYSTEM',
}

export class CreateVersionDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(VersionSharingDto)
  sharing?: VersionSharingDto;

  @IsOptional()
  @IsString()
  wikiPageId?: string;
}
