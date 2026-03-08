import { IsString, IsOptional } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  dealId?: string;
}

export class UpdateNoteDto {
  @IsString()
  content!: string;
}
