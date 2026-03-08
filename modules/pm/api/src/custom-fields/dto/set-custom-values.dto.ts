import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CustomValueInput {
  @IsString()
  customFieldId!: string;

  @IsString()
  value!: string;
}

export class SetCustomValuesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomValueInput)
  values!: CustomValueInput[];
}
