import { Injectable, NotFoundException } from '@nestjs/common';
import { WikiPrismaService } from '../prisma/wiki-prisma.service';

interface PageDiff {
  added: number;
  removed: number;
  changed: boolean;
}

@Injectable()
export class VersionsService {
  constructor(private prisma: WikiPrismaService) {}

  async findVersions(pageId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.wikiPageVersion.findMany({
        where: { pageId },
        orderBy: { version: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.wikiPageVersion.count({ where: { pageId } }),
    ]);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getVersion(versionId: string) {
    const version = await this.prisma.wikiPageVersion.findUnique({
      where: { id: versionId },
    });
    if (!version) throw new NotFoundException('Version not found');
    return version;
  }

  async restore(versionId: string, userId: string) {
    const version = await this.prisma.wikiPageVersion.findUnique({
      where: { id: versionId },
    });
    if (!version) throw new NotFoundException('Version not found');

    // Get the latest version number
    const lastVersion = await this.prisma.wikiPageVersion.findFirst({
      where: { pageId: version.pageId },
      orderBy: { version: 'desc' },
    });

    await this.prisma.$transaction([
      // Update current content
      this.prisma.wikiPageContent.upsert({
        where: { pageId: version.pageId },
        update: {
          content: version.content as any,
          textContent: '',
          wordCount: 0,
          updatedBy: userId,
        },
        create: {
          pageId: version.pageId,
          content: version.content as any,
          textContent: '',
          wordCount: 0,
          updatedBy: userId,
        },
      }),
      // Record the restore as a new version
      this.prisma.wikiPageVersion.create({
        data: {
          pageId: version.pageId,
          content: version.content as any,
          authorId: userId,
          version: (lastVersion?.version ?? 0) + 1,
          summary: `Restored from version ${version.version}`,
        },
      }),
    ]);
  }

  async diff(versionAId: string, versionBId: string): Promise<PageDiff> {
    const [a, b] = await Promise.all([
      this.prisma.wikiPageVersion.findUnique({ where: { id: versionAId } }),
      this.prisma.wikiPageVersion.findUnique({ where: { id: versionBId } }),
    ]);
    if (!a || !b) throw new NotFoundException('Version not found');

    const contentA = a.content as any;
    const contentB = b.content as any;

    const nodesA = this.flattenNodes(contentA);
    const nodesB = this.flattenNodes(contentB);

    const textsA = new Set(nodesA.map((n) => JSON.stringify(n)));
    const textsB = new Set(nodesB.map((n) => JSON.stringify(n)));

    let added = 0;
    let removed = 0;

    for (const t of textsB) {
      if (!textsA.has(t)) added++;
    }
    for (const t of textsA) {
      if (!textsB.has(t)) removed++;
    }

    return { added, removed, changed: added > 0 || removed > 0 };
  }

  private flattenNodes(node: any): any[] {
    if (!node) return [];
    const nodes: any[] = [];
    if (node.type) {
      nodes.push({ type: node.type, text: node.text, marks: node.marks });
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        nodes.push(...this.flattenNodes(child));
      }
    }
    return nodes;
  }
}
