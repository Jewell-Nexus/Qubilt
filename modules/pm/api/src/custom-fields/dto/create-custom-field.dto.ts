import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsArray,
} from 'class-validator';

export enum CustomFieldFormat {
  STRING = 'STRING',
  TEXT = 'TEXT',
  INTEGER = 'INTEGER',
  FLOAT = 'FLOAT',
  BOOL = 'BOOL',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  LIST = 'LIST',
  MULTI_LIST = 'MULTI_LIST',
  USER = 'USER',
  VERSION = 'VERSION',
  HIERARCHY = 'HIERARCHY',
}

export class CreateCustomFieldDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsEnum(CustomFieldFormat)
  fieldFormat!: CustomFieldFormat;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isFilter?: boolean;

  @IsOptional()
  @IsBoolean()
  searchable?: boolean;

  @IsOptional()
  @IsString()
  defaultValue?: string;

  @IsOptional()
  @IsArray()
  possibleValues?: string[];
}
