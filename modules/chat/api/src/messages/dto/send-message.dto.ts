import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class SendMessageDto {
  @IsString()
  channelId!: string;

  @IsObject()
  content!: any;

  @IsString()
  textContent!: string;

  @IsOptional()
  @IsString()
  threadId?: string;

  @IsOptional()
  @IsEnum(['TEXT', 'SYSTEM', 'FILE'])
  type?: 'TEXT' | 'SYSTEM' | 'FILE';
}
