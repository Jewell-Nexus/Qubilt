import { IsString, IsArray, IsOptional, IsUrl } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  name!: string;

  @IsUrl()
  url!: string;

  @IsArray()
  @IsString({ each: true })
  events!: string[];

  @IsOptional()
  @IsString()
  secret?: string;
}
