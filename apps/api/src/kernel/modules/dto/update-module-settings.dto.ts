import { IsObject } from 'class-validator';

export class UpdateModuleSettingsDto {
  @IsObject()
  settings!: Record<string, any>;
}
