import { IsEnum } from 'class-validator';

export enum UnfinishedStrategy {
  BACKLOG = 'backlog',
  NEW_SPRINT = 'new-sprint',
}

export class CloseSprintDto {
  @IsEnum(UnfinishedStrategy)
  unfinishedStrategy!: UnfinishedStrategy;
}
