import { Injectable, NotFoundException } from '@nestjs/common';
import { WikiPrismaService } from '../prisma/wiki-prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private prisma: WikiPrismaService) {}

  async findAll(workspaceId: string) {
    return this.prisma.wikiTemplate.findMany({
      where: {
        OR: [
          { workspaceId },
          { isBuiltIn: true },
        ],
      },
      orderBy: [{ isBuiltIn: 'desc' }, { name: 'asc' }],
    });
  }

  async create(dto: CreateTemplateDto) {
    return this.prisma.wikiTemplate.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        content: dto.content,
        category: dto.category,
      },
    });
  }

  async delete(id: string) {
    const template = await this.prisma.wikiTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException('Template not found');
    await this.prisma.wikiTemplate.delete({ where: { id } });
  }

  async applyTemplate(templateId: string, pageId: string, authorId: string) {
    const template = await this.prisma.wikiTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) throw new NotFoundException('Template not found');

    const page = await this.prisma.wikiPage.findUnique({
      where: { id: pageId },
    });
    if (!page) throw new NotFoundException('Page not found');

    // Get latest version number
    const lastVersion = await this.prisma.wikiPageVersion.findFirst({
      where: { pageId },
      orderBy: { version: 'desc' },
    });

    await this.prisma.$transaction([
      this.prisma.wikiPageContent.upsert({
        where: { pageId },
        update: {
          content: template.content as any,
          textContent: '',
          wordCount: 0,
          updatedBy: authorId,
        },
        create: {
          pageId,
          content: template.content as any,
          textContent: '',
          wordCount: 0,
          updatedBy: authorId,
        },
      }),
      this.prisma.wikiPageVersion.create({
        data: {
          pageId,
          content: template.content as any,
          authorId,
          version: (lastVersion?.version ?? 0) + 1,
          summary: `Applied template: ${template.name}`,
        },
      }),
    ]);
  }
}
