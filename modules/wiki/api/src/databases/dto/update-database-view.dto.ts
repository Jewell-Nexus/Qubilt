import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

enum DatabaseView {
  TABLE = 'TABLE',
  BOARD = 'BOARD',
  GALLERY = 'GALLERY',
  CALENDAR = 'CALENDAR',
  LIST = 'LIST',
}

export class UpdateDatabaseViewDto {
  @IsOptional()
  @IsEnum(DatabaseView)
  viewType?: DatabaseView;

  @IsOptional()
  @IsArray()
  filters?: any[];

  @IsOptional()
  @IsArray()
  sortBy?: any[];

  @IsOptional()
  @IsString()
  groupBy?: string;
}
