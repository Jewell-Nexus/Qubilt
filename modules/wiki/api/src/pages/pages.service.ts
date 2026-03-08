import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { WikiPrismaService } from '../prisma/wiki-prisma.service';
import { EventBusService } from '@kernel/events/event-bus.service';
import { WikiEvents } from '@qubilt/module-sdk/wiki.events';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

export interface WikiPageTreeNode {
  id: string;
  title: string;
  icon: string | null;
  slug: string;
  parentId: string | null;
  position: number;
  childCount: number;
  children: WikiPageTreeNode[];
}

@Injectable()
export class PagesService {
  constructor(
    private prisma: WikiPrismaService,
    private eventBus: EventBusService,
  ) {}

  private slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      || 'untitled';
  }

  private async uniqueSlug(workspaceId: string, baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await this.prisma.wikiPage.findUnique({
        where: { workspaceId_slug: { workspaceId, slug } },
      });
      if (!existing || existing.id === excludeId) return slug;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }

  async create(dto: CreatePageDto, authorId: string) {
    const title = dto.title || 'Untitled';
    const slug = await this.uniqueSlug(dto.workspaceId, this.slugify(title));

    // Calculate nested set values
    let lft: number;
    let rgt: number;

    if (dto.parentId) {
      const parent = await this.prisma.wikiPage.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) throw new NotFoundException('Parent page not found');

      lft = parent.rgt;
      rgt = lft + 1;

      // Make room in the nested set
      await this.prisma.$executeRaw`
        UPDATE wiki_pages SET rgt = rgt + 2
        WHERE "workspaceId" = ${dto.workspaceId} AND rgt >= ${parent.rgt}
      `;
      await this.prisma.$executeRaw`
        UPDATE wiki_pages SET lft = lft + 2
        WHERE "workspaceId" = ${dto.workspaceId} AND lft > ${parent.rgt}
      `;
    } else {
      // Root node: find max rgt
      const maxRgt = await this.prisma.wikiPage.aggregate({
        where: { workspaceId: dto.workspaceId },
        _max: { rgt: true },
      });
      lft = (maxRgt._max.rgt ?? 0) + 1;
      rgt = lft + 1;
    }

    // Position among siblings
    const maxPos = await this.prisma.wikiPage.aggregate({
      where: { workspaceId: dto.workspaceId, parentId: dto.parentId ?? null },
      _max: { position: true },
    });

    // Determine initial content
    let initialContent: any = { type: 'doc', content: [] };
    if (dto.templateId) {
      const template = await this.prisma.wikiTemplate.findUnique({
        where: { id: dto.templateId },
      });
      if (template) {
        initialContent = template.content;
      }
    }

    const page = await this.prisma.wikiPage.create({
      data: {
        workspaceId: dto.workspaceId,
        projectId: dto.projectId,
        parentId: dto.parentId,
        title,
        slug,
        icon: dto.icon,
        position: (maxPos._max.position ?? -1) + 1,
        lft,
        rgt,
        authorId,
        currentVersion: {
          create: {
            content: initialContent,
            textContent: '',
            wordCount: 0,
            updatedBy: authorId,
          },
        },
        versions: {
          create: {
            content: initialContent,
            authorId,
            version: 1,
            summary: 'Initial version',
          },
        },
      },
      include: {
        currentVersion: true,
      },
    });

    this.eventBus.emit(WikiEvents.PAGE_CREATED, {
      pageId: page.id,
      workspaceId: dto.workspaceId,
      projectId: dto.projectId,
      authorId,
    });

    return page;
  }

  async findAll(workspaceId: string, projectId?: string): Promise<WikiPageTreeNode[]> {
    const where: any = { workspaceId };
    if (projectId) where.projectId = projectId;

    const pages = await this.prisma.wikiPage.findMany({
      where,
      orderBy: [{ lft: 'asc' }],
      include: {
        _count: { select: { children: true } },
      },
    });

    // Build tree from flat list
    const nodeMap = new Map<string, WikiPageTreeNode>();
    const roots: WikiPageTreeNode[] = [];

    for (const page of pages) {
      const node: WikiPageTreeNode = {
        id: page.id,
        title: page.title,
        icon: page.icon,
        slug: page.slug,
        parentId: page.parentId,
        position: page.position,
        childCount: page._count.children,
        children: [],
      };
      nodeMap.set(page.id, node);

      if (!page.parentId) {
        roots.push(node);
      } else {
        const parent = nodeMap.get(page.parentId);
        if (parent) parent.children.push(node);
      }
    }

    return roots;
  }

  async findOne(id: string) {
    const page = await this.prisma.wikiPage.findUnique({
      where: { id },
      include: {
        currentVersion: true,
        children: {
          orderBy: { position: 'asc' },
          select: { id: true, title: true, icon: true, slug: true },
        },
      },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async findBySlug(workspaceId: string, slug: string) {
    const page = await this.prisma.wikiPage.findUnique({
      where: { workspaceId_slug: { workspaceId, slug } },
      include: { currentVersion: true },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async update(id: string, dto: UpdatePageDto, userId: string) {
    const existing = await this.prisma.wikiPage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Page not found');

    const data: any = {};
    const changes: string[] = [];

    if (dto.title !== undefined && dto.title !== existing.title) {
      data.title = dto.title;
      data.slug = await this.uniqueSlug(existing.workspaceId, this.slugify(dto.title), id);
      changes.push('title');
    }
    if (dto.icon !== undefined) {
      data.icon = dto.icon;
      changes.push('icon');
    }
    if (dto.coverUrl !== undefined) {
      data.coverUrl = dto.coverUrl;
      changes.push('coverUrl');
    }
    if (dto.isLocked !== undefined) {
      data.isLocked = dto.isLocked;
      changes.push('isLocked');
    }

    const page = await this.prisma.wikiPage.update({ where: { id }, data });

    if (changes.length > 0) {
      this.eventBus.emit(WikiEvents.PAGE_UPDATED, {
        pageId: id,
        changes,
      });
    }

    return page;
  }

  async updateContent(
    id: string,
    content: any,
    textContent: string,
    wordCount: number,
    userId: string,
  ) {
    const page = await this.prisma.wikiPage.findUnique({
      where: { id },
      include: { currentVersion: true },
    });
    if (!page) throw new NotFoundException('Page not found');

    // Upsert content
    await this.prisma.wikiPageContent.upsert({
      where: { pageId: id },
      update: { content, textContent, wordCount, updatedBy: userId },
      create: { pageId: id, content, textContent, wordCount, updatedBy: userId },
    });

    // Create version entry
    const lastVersion = await this.prisma.wikiPageVersion.findFirst({
      where: { pageId: id },
      orderBy: { version: 'desc' },
    });

    await this.prisma.wikiPageVersion.create({
      data: {
        pageId: id,
        content,
        authorId: userId,
        version: (lastVersion?.version ?? 0) + 1,
      },
    });

    this.eventBus.emit(WikiEvents.PAGE_UPDATED, {
      pageId: id,
      changes: ['content'],
    });
  }

  async move(id: string, newParentId: string | null, afterId: string | null) {
    const page = await this.prisma.wikiPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');

    const width = page.rgt - page.lft + 1;

    // Use a transaction for nested set operations
    await this.prisma.$transaction(async (tx) => {
      // 1. Remove node and descendants from the tree (make lft/rgt negative temporarily)
      await tx.$executeRaw`
        UPDATE wiki_pages SET lft = -lft, rgt = -rgt
        WHERE "workspaceId" = ${page.workspaceId} AND lft >= ${page.lft} AND rgt <= ${page.rgt}
      `;

      // 2. Close the gap left by the removed subtree
      await tx.$executeRaw`
        UPDATE wiki_pages SET rgt = rgt - ${width}
        WHERE "workspaceId" = ${page.workspaceId} AND rgt > ${page.rgt} AND rgt > 0
      `;
      await tx.$executeRaw`
        UPDATE wiki_pages SET lft = lft - ${width}
        WHERE "workspaceId" = ${page.workspaceId} AND lft > ${page.rgt} AND lft > 0
      `;

      // 3. Find the new insertion point
      let insertAt: number;
      if (newParentId) {
        const newParent = await tx.wikiPage.findUnique({ where: { id: newParentId } });
        if (!newParent) throw new NotFoundException('New parent not found');
        insertAt = newParent.rgt;
      } else {
        const maxRgt = await tx.wikiPage.aggregate({
          where: { workspaceId: page.workspaceId, rgt: { gt: 0 } },
          _max: { rgt: true },
        });
        insertAt = (maxRgt._max.rgt ?? 0) + 1;
      }

      // 4. Make room at the insertion point
      await tx.$executeRaw`
        UPDATE wiki_pages SET rgt = rgt + ${width}
        WHERE "workspaceId" = ${page.workspaceId} AND rgt >= ${insertAt} AND rgt > 0
      `;
      await tx.$executeRaw`
        UPDATE wiki_pages SET lft = lft + ${width}
        WHERE "workspaceId" = ${page.workspaceId} AND lft >= ${insertAt} AND lft > 0
      `;

      // 5. Move the subtree into the new position
      const offset = insertAt - page.lft;
      await tx.$executeRaw`
        UPDATE wiki_pages SET lft = -lft + ${offset}, rgt = -rgt + ${offset}
        WHERE "workspaceId" = ${page.workspaceId} AND lft < 0
      `;

      // 6. Update parentId
      await tx.wikiPage.update({
        where: { id },
        data: { parentId: newParentId },
      });

      // 7. Update position among siblings
      if (afterId) {
        const afterPage = await tx.wikiPage.findUnique({ where: { id: afterId } });
        if (afterPage) {
          await tx.wikiPage.update({
            where: { id },
            data: { position: afterPage.position + 1 },
          });
        }
      } else {
        await tx.wikiPage.update({
          where: { id },
          data: { position: 0 },
        });
      }
    });
  }

  async delete(id: string) {
    const page = await this.prisma.wikiPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');

    const width = page.rgt - page.lft + 1;

    await this.prisma.$transaction(async (tx) => {
      // Delete all descendants and the page itself (cascade handles content/versions/databases)
      await tx.wikiPage.deleteMany({
        where: {
          workspaceId: page.workspaceId,
          lft: { gte: page.lft },
          rgt: { lte: page.rgt },
        },
      });

      // Close the gap in nested set
      await tx.$executeRaw`
        UPDATE wiki_pages SET rgt = rgt - ${width}
        WHERE "workspaceId" = ${page.workspaceId} AND rgt > ${page.rgt}
      `;
      await tx.$executeRaw`
        UPDATE wiki_pages SET lft = lft - ${width}
        WHERE "workspaceId" = ${page.workspaceId} AND lft > ${page.rgt}
      `;
    });

    this.eventBus.emit(WikiEvents.PAGE_DELETED, {
      pageId: id,
    });
  }

  async search(workspaceId: string, query: string) {
    // Use ILIKE for basic full-text search (can upgrade to pg_trgm later)
    const pages = await this.prisma.wikiPage.findMany({
      where: {
        workspaceId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          {
            currentVersion: {
              textContent: { contains: query, mode: 'insensitive' },
            },
          },
        ],
      },
      include: {
        currentVersion: {
          select: { textContent: true },
        },
      },
      take: 50,
    });
    return pages;
  }
}
