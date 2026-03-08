import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsArray,
  MaxLength,
  IsObject,
  ValidateIf,
} from 'class-validator';

export class CreateContactDto {
  @IsString()
  workspaceId!: string;

  @IsEnum(['PERSON', 'ORGANIZATION'])
  type!: 'PERSON' | 'ORGANIZATION';

  @ValidateIf((o) => o.type === 'PERSON')
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

  @IsString()
  ownerId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  customData?: Record<string, any>;
}
