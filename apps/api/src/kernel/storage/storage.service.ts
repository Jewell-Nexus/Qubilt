import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as path from 'path';
import { PrismaService } from '../../database/prisma.service';
import { StorageAdapter, StoredFile } from './storage.interface';
import { LocalStorageAdapter } from './adapters/local.adapter';
import { S3StorageAdapter } from './adapters/s3.adapter';

@Injectable()
export class StorageService implements OnModuleInit {
  private adapter!: StorageAdapter;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const driver = this.configService.get<string>('storage.driver', 'local');

    if (driver === 's3') {
      this.adapter = new S3StorageAdapter({
        bucket: this.configService.get<string>('storage.s3.bucket', ''),
        region: this.configService.get<string>('storage.s3.region', ''),
        accessKeyId: this.configService.get<string>('storage.s3.accessKey', ''),
        secretAccessKey: this.configService.get<string>('storage.s3.secretKey', ''),
        endpoint: this.configService.get<string>('storage.s3.endpoint') || undefined,
      });
    } else {
      this.adapter = new LocalStorageAdapter(this.jwtService, this.configService);
    }
  }

  generateKey(workspaceId: string, moduleId: string, filename: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uuid = crypto.randomUUID();
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${workspaceId}/${moduleId}/${year}/${month}/${uuid}-${sanitized}`;
  }

  validateFile(
    file: Express.Multer.File,
    options: { maxBytes?: number; allowedMimes?: string[] },
  ): void {
    if (options.maxBytes && file.size > options.maxBytes) {
      throw new BadRequestException(
        `File size ${file.size} exceeds maximum ${options.maxBytes} bytes`,
      );
    }
    if (
      options.allowedMimes &&
      !options.allowedMimes.includes(file.mimetype)
    ) {
      throw new BadRequestException(
        `MIME type ${file.mimetype} is not allowed. Allowed: ${options.allowedMimes.join(', ')}`,
      );
    }
  }

  async uploadAttachment(
    workspaceId: string,
    moduleId: string,
    containerType: string,
    containerId: string,
    file: Express.Multer.File,
    uploaderId: string,
    validationOptions?: { maxBytes?: number; allowedMimes?: string[] },
  ) {
    if (validationOptions) {
      this.validateFile(file, validationOptions);
    }

    const key = this.generateKey(workspaceId, moduleId, file.originalname);
    const storedFile = await this.adapter.upload(key, file.buffer, file.mimetype);

    const attachment = await this.prisma.attachment.create({
      data: {
        workspaceId,
        moduleId,
        containerType,
        containerId,
        fileName: file.originalname,
        fileSize: storedFile.size,
        mimeType: storedFile.mimeType,
        storagePath: storedFile.key,
        uploadedById: uploaderId,
      },
    });

    return attachment;
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<StoredFile> {
    return this.adapter.upload(key, buffer, mimeType);
  }

  async download(key: string): Promise<Buffer> {
    return this.adapter.download(key);
  }

  async delete(key: string): Promise<void> {
    return this.adapter.delete(key);
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return this.adapter.getSignedUrl(key, expiresInSeconds);
  }

  async exists(key: string): Promise<boolean> {
    return this.adapter.exists(key);
  }
}
