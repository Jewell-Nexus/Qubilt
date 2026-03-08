import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsArray,
} from 'class-validator';

export class UpdateCustomFieldDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

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
