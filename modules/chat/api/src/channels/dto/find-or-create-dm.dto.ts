import { IsString } from 'class-validator';

export class FindOrCreateDmDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  targetUserId!: string;
}
