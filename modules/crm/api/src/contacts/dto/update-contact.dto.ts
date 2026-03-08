import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsArray,
  MaxLength,
  IsObject,
} from 'class-validator';

export class UpdateContactDto {
  @IsOptional()
  @IsEnum(['PERSON', 'ORGANIZATION'])
  type?: 'PERSON' | 'ORGANIZATION';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  jobTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  company?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  customData?: Record<string, any>;
}
