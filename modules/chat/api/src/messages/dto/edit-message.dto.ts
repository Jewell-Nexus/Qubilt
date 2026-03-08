import { IsString, IsObject } from 'class-validator';

export class EditMessageDto {
  @IsObject()
  content!: any;

  @IsString()
  textContent!: string;
}
