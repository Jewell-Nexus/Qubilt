import { IsString, IsOptional } from 'class-validator';

export class MovePageDto {
  @IsOptional()
  @IsString()
  newParentId?: string | null;

  @IsOptional()
  @IsString()
  afterId?: string | null;
}
