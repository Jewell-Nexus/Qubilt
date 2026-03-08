export interface StorageAdapter {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<StoredFile>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  exists(key: string): Promise<boolean>;
}

export interface StoredFile {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}
