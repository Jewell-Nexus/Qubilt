import { IsString, Length } from 'class-validator';

export class Verify2faDto {
  @IsString()
  @Length(6, 8)
  token!: string;
}

export class Disable2faDto {
  @IsString()
  password!: string;
}
