import { IsString, MaxLength } from 'class-validator';

export class CreateBaselineDto {
  @IsString()
  @MaxLength(255)
  name!: string;
}
