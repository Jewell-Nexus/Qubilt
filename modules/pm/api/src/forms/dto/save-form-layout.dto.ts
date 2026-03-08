import {
  IsString,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum FormFieldType {
  BUILTIN = 'builtin',
  CUSTOM = 'custom',
}

export class FormFieldDto {
  @IsString()
  id!: string;

  @IsString()
  label!: string;

  @IsEnum(FormFieldType)
  fieldType!: FormFieldType;

  @IsOptional()
  @IsString()
  builtinKey?: string;

  @IsOptional()
  @IsString()
  customFieldId?: string;

  @IsBoolean()
  required!: boolean;

  @IsInt()
  position!: number;

  @IsBoolean()
  visible!: boolean;
}

export class FormGroupDto {
  @IsString()
  id!: string;

  @IsString()
  label!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields!: FormFieldDto[];
}

export class SaveFormLayoutDto {
  @IsString()
  workspaceId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormGroupDto)
  groups!: FormGroupDto[];
}
