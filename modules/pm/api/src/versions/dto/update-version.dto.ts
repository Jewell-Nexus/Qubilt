import { IsString, IsOptional, IsEnum, MaxLength, IsDateString } from 'class-validator';
import { VersionSharingDto } from './create-version.dto';

export class UpdateVersionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

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
