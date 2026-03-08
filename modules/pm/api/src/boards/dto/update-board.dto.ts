import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateBoardDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
