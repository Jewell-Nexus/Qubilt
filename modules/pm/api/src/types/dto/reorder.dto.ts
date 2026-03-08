import { IsString, IsArray } from 'class-validator';

export class ReorderDto {
  @IsString()
  workspaceId!: string;

  @IsArray()
  @IsString({ each: true })
  orderedIds!: string[];
}
