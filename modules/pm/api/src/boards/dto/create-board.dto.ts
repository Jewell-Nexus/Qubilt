import { IsString, IsEnum, MaxLength } from 'class-validator';

export enum BoardTypeDto {
  MANUAL = 'MANUAL',
  STATUS = 'STATUS',
  ASSIGNEE = 'ASSIGNEE',
  VERSION = 'VERSION',
  SUBPROJECT = 'SUBPROJECT',
  PARENT_CHILD = 'PARENT_CHILD',
}

export class CreateBoardDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsEnum(BoardTypeDto)
  type!: BoardTypeDto;
}
