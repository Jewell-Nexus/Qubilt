import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';

const INDEX_NAME = 'chat_messages';

export interface ChatMessageDocument {
  id: string;
  workspaceId: string;
  channelId: string;
  userId: string;
  authorName: string;
  textContent: string;
  createdAt: string;
}

@Injectable()
export class ChatIndexerService implements OnModuleInit {
  private readonly logger = new Logger(ChatIndexerService.name);
  private client: MeiliSearch | null = null;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const host = this.config.get<string>('meilisearch.host');
    const apiKey = this.config.get<string>('meilisearch.apiKey');

    if (!host) {
      this.logger.warn('Meilisearch not configured — search indexing disabled');
      return;
    }

    this.client = new MeiliSearch({ host, apiKey });
    await this.setupIndex();
  }

  get enabled(): boolean {
    return this.client !== null;
  }

  async setupIndex(): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.createIndex(INDEX_NAME, { primaryKey: 'id' });
    } catch {
      // Index may already exist
    }

    const index = this.client.index(INDEX_NAME);
    await index.updateSettings({
      searchableAttributes: ['textContent', 'authorName'],
      filterableAttributes: ['workspaceId', 'channelId', 'userId'],
      sortableAttributes: ['createdAt'],
    });

    this.logger.log('Meilisearch chat_messages index configured');
  }

  async indexMessage(doc: ChatMessageDocument): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.index(INDEX_NAME).addDocuments([doc]);
    } catch (err) {
      this.logger.error('Failed to index message', err);
    }
  }

  async deleteMessage(id: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.index(INDEX_NAME).deleteDocument(id);
    } catch (err) {
      this.logger.error('Failed to delete indexed message', err);
    }
  }

  async search(
    workspaceId: string,
    query: string,
    channelId?: string,
  ): Promise<ChatMessageDocument[]> {
    if (!this.client) return [];

    const filter: string[] = [`workspaceId = "${workspaceId}"`];
    if (channelId) {
      filter.push(`channelId = "${channelId}"`);
    }

    const result = await this.client.index(INDEX_NAME).search<ChatMessageDocument>(query, {
      filter: filter.join(' AND '),
      sort: ['createdAt:desc'],
      limit: 50,
    });

    return result.hits;
  }
}
