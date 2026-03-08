import { IsObject } from 'class-validator';

export class UpdateDatabaseSchemaDto {
  @IsObject()
  schema: any;
}
