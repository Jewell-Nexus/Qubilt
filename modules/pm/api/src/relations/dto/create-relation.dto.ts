import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';

export enum RelationType {
  RELATES = 'RELATES',
  DUPLICATES = 'DUPLICATES',
  DUPLICATED_BY = 'DUPLICATED_BY',
  BLOCKS = 'BLOCKS',
  BLOCKED_BY = 'BLOCKED_BY',
  PRECEDES = 'PRECEDES',
  FOLLOWS = 'FOLLOWS',
  INCLUDES = 'INCLUDES',
  PART_OF = 'PART_OF',
  REQUIRES = 'REQUIRES',
  REQUIRED_BY = 'REQUIRED_BY',
}

// Mirror map: when creating a relation of type X, also create the reverse
export const MIRROR_MAP: Partial<Record<RelationType, RelationType>> = {
  [RelationType.BLOCKS]: RelationType.BLOCKED_BY,
  [RelationType.BLOCKED_BY]: RelationType.BLOCKS,
  [RelationType.PRECEDES]: RelationType.FOLLOWS,
  [RelationType.FOLLOWS]: RelationType.PRECEDES,
  [RelationType.DUPLICATES]: RelationType.DUPLICATED_BY,
  [RelationType.DUPLICATED_BY]: RelationType.DUPLICATES,
  [RelationType.INCLUDES]: RelationType.PART_OF,
  [RelationType.PART_OF]: RelationType.INCLUDES,
  [RelationType.REQUIRES]: RelationType.REQUIRED_BY,
  [RelationType.REQUIRED_BY]: RelationType.REQUIRES,
};

export class CreateRelationDto {
  @IsString()
  toId!: string;

  @IsEnum(RelationType)
  type!: RelationType;

  @IsOptional()
  @IsInt()
  delay?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
