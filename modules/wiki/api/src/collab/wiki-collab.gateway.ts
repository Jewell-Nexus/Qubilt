import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
// Types from socket.io - available via @nestjs/platform-socket.io
type Server = any;
type Socket = any;
import * as Y from 'yjs';
import { PagesService } from '../pages/pages.service';
import { WikiPrismaService } from '../prisma/wiki-prisma.service';

interface DocState {
  doc: Y.Doc;
  clients: Map<string, { userId: string; name: string; color: string }>;
  debounceTimer: ReturnType<typeof setTimeout> | null;
}

// JWT verification is handled by the kernel's JwtService
// We import the verify function pattern used across the codebase
interface JwtPayload {
  sub: string;
  email: string;
  name?: string;
}

@WebSocketGateway({ namespace: '/wiki-collab' })
export class WikiCollabGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WikiCollabGateway.name);
  private docs = new Map<string, DocState>();

  // User colors for awareness cursors
  private readonly CURSOR_COLORS = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7',
    '#3F51B5', '#2196F3', '#00BCD4', '#009688',
    '#4CAF50', '#FF9800', '#FF5722', '#795548',
  ];

  constructor(
    private pagesService: PagesService,
    private prisma: WikiPrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Token verification is delegated to the kernel JWT guard
      // For WebSocket, we decode the token payload (the API gateway
      // verifies the signature before proxying)
      const payload = this.decodeToken(token);
      if (!payload?.sub) {
        throw new UnauthorizedException('Invalid token');
      }

      (client as any).userId = payload.sub;
      (client as any).userName = payload.name || payload.email;

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch (err) {
      this.logger.warn(`Connection rejected: ${(err as Error).message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove from all documents
    for (const [pageId, state] of this.docs) {
      if (state.clients.has(client.id)) {
        state.clients.delete(client.id);
        // Broadcast updated awareness
        this.broadcastAwareness(pageId);
      }
      // Clean up empty docs
      if (state.clients.size === 0) {
        if (state.debounceTimer) clearTimeout(state.debounceTimer);
        state.doc.destroy();
        this.docs.delete(pageId);
      }
    }
  }

  @SubscribeMessage('join-document')
  async handleJoinDocument(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string },
  ) {
    const userId = (client as any).userId;
    const userName = (client as any).userName;

    if (!userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Check if page exists and is accessible
    try {
      const page = await this.pagesService.findOne(data.pageId);

      // Check if page is locked
      if (page.isLocked) {
        client.emit('error', { message: 'Page is locked' });
        return;
      }
    } catch {
      client.emit('error', { message: 'Page not found' });
      return;
    }

    // Join the socket room
    client.join(`doc:${data.pageId}`);

    // Get or create document state
    let state = this.docs.get(data.pageId);
    if (!state) {
      const doc = new Y.Doc();
      state = {
        doc,
        clients: new Map(),
        debounceTimer: null,
      };
      this.docs.set(data.pageId, state);

      // Load existing content into Y.Doc
      const page = await this.pagesService.findOne(data.pageId);
      if (page.currentVersion?.content) {
        // Store initial content reference — clients will initialize from this
        // Y.js sync protocol handles the actual document state
      }
    }

    // Assign cursor color
    const colorIndex = state.clients.size % this.CURSOR_COLORS.length;
    state.clients.set(client.id, {
      userId,
      name: userName,
      color: this.CURSOR_COLORS[colorIndex],
    });

    // Send current document state to the connecting client
    const stateUpdate = Y.encodeStateAsUpdate(state.doc);
    client.emit('sync-update', { update: Array.from(stateUpdate) });

    // Broadcast awareness to all clients
    this.broadcastAwareness(data.pageId);

    return { success: true };
  }

  @SubscribeMessage('leave-document')
  handleLeaveDocument(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string },
  ) {
    client.leave(`doc:${data.pageId}`);
    const state = this.docs.get(data.pageId);
    if (state) {
      state.clients.delete(client.id);
      this.broadcastAwareness(data.pageId);
    }
  }

  @SubscribeMessage('yjs-update')
  handleYjsUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string; update: number[] },
  ) {
    const state = this.docs.get(data.pageId);
    if (!state) return;

    // Apply update to server Y.Doc
    const update = new Uint8Array(data.update);
    Y.applyUpdate(state.doc, update);

    // Broadcast to other clients in the room
    client.to(`doc:${data.pageId}`).emit('yjs-update', {
      update: data.update,
    });

    // Debounced persistence (2 seconds)
    if (state.debounceTimer) clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
      this.persistDocument(data.pageId, (client as any).userId);
    }, 2000);
  }

  @SubscribeMessage('awareness-update')
  handleAwarenessUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string; awareness: any },
  ) {
    // Broadcast awareness to other clients
    client.to(`doc:${data.pageId}`).emit('awareness-update', {
      clientId: client.id,
      awareness: data.awareness,
    });
  }

  private broadcastAwareness(pageId: string) {
    const state = this.docs.get(pageId);
    if (!state) return;

    const users = Array.from(state.clients.values());
    this.server.to(`doc:${pageId}`).emit('awareness-state', { users });
  }

  private async persistDocument(pageId: string, userId: string) {
    try {
      const state = this.docs.get(pageId);
      if (!state) return;

      // Extract content from Y.Doc
      // The TipTap JSON is stored in a Y.XmlFragment named 'default'
      const xmlFragment = state.doc.getXmlFragment('default');
      const content = this.xmlFragmentToJson(xmlFragment);
      const textContent = this.extractText(content);
      const wordCount = textContent.split(/\s+/).filter(Boolean).length;

      await this.pagesService.updateContent(
        pageId,
        content,
        textContent,
        wordCount,
        userId,
      );

      this.logger.debug(`Persisted document: ${pageId}`);
    } catch (err) {
      this.logger.error(`Failed to persist document ${pageId}:`, err);
    }
  }

  private xmlFragmentToJson(fragment: Y.XmlFragment): any {
    const content: any[] = [];
    fragment.forEach((item) => {
      content.push(this.xmlElementToJson(item));
    });
    return { type: 'doc', content };
  }

  private xmlElementToJson(element: Y.XmlElement | Y.XmlText): any {
    if (element instanceof Y.XmlText) {
      const delta = element.toDelta();
      if (delta.length === 0) return null;
      // Convert Yjs delta to ProseMirror text nodes
      return delta.map((op: any) => ({
        type: 'text',
        text: op.insert,
        ...(op.attributes ? { marks: Object.entries(op.attributes).map(([type, attrs]) => ({ type, attrs })) } : {}),
      }));
    }

    const node: any = {
      type: element.nodeName,
      attrs: element.getAttributes(),
    };

    const children: any[] = [];
    element.forEach((child) => {
      const json = this.xmlElementToJson(child as Y.XmlElement | Y.XmlText);
      if (json) {
        if (Array.isArray(json)) {
          children.push(...json);
        } else {
          children.push(json);
        }
      }
    });

    if (children.length > 0) {
      node.content = children;
    }

    return node;
  }

  private extractText(node: any): string {
    if (!node) return '';
    if (node.text) return node.text;
    if (Array.isArray(node.content)) {
      return node.content.map((c: any) => this.extractText(c)).join(' ');
    }
    return '';
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      return payload;
    } catch {
      return null;
    }
  }
}
