import * as fs from 'fs/promises';
import * as path from 'path';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { StorageAdapter, StoredFile } from '../storage.interface';

export class LocalStorageAdapter implements StorageAdapter {
  private readonly basePath: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.basePath = this.configService.get<string>(
      'storage.localPath',
      './uploads',
    );
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<StoredFile> {
    const filePath = path.join(this.basePath, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);

    const apiUrl = this.configService.get<string>('app.apiUrl');

    return {
      key,
      url: `${apiUrl}/api/v1/files/${key}`,
      size: buffer.length,
      mimeType,
    };
  }

  async download(key: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, key);
    return fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);
    await fs.unlink(filePath).catch(() => {});
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    const token = this.jwtService.sign(
      { key, type: 'file-access' },
      { expiresIn: expiresInSeconds },
    );
    const apiUrl = this.configService.get<string>('app.apiUrl');
    return `${apiUrl}/api/v1/files/${key}?token=${token}`;
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.basePath, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
