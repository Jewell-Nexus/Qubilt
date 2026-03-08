import { IsArray, IsString } from 'class-validator';

export class ReorderRowsDto {
  @IsArray()
  @IsString({ each: true })
  orderedIds!: string[];
}
