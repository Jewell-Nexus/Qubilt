import { Injectable, NotFoundException } from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

interface GanttExportOptions {
  dateFrom?: string;
  dateTo?: string;
  groupBy?: 'type' | 'status' | 'assignee' | 'version';
  showBaseline?: string; // baseline ID
}

interface GanttWpRow {
  id: string;
  subject: string;
  startDate: string | null;
  dueDate: string | null;
  percentDone: number;
  typeName: string;
  typeColor: string;
  statusName: string;
  statusColor: string;
  assigneeId: string | null;
  group: string;
  baselineStartDate?: string | null;
  baselineDueDate?: string | null;
}

@Injectable()
export class GanttExportService {
  constructor(private prisma: PmPrismaService) {}

  async exportGanttPdf(
    projectId: string,
    options: GanttExportOptions,
  ): Promise<Buffer> {
    // Fetch work packages
    const where: any = { projectId, deletedAt: null };
    if (options.dateFrom || options.dateTo) {
      where.OR = [
        {
          startDate: {
            ...(options.dateFrom ? { gte: new Date(options.dateFrom) } : {}),
            ...(options.dateTo ? { lte: new Date(options.dateTo) } : {}),
          },
        },
        {
          dueDate: {
            ...(options.dateFrom ? { gte: new Date(options.dateFrom) } : {}),
            ...(options.dateTo ? { lte: new Date(options.dateTo) } : {}),
          },
        },
      ];
    }

    const wps = await this.prisma.pmWorkPackage.findMany({
      where,
      include: {
        type: { select: { name: true, color: true } },
        status: { select: { name: true, color: true } },
      },
      orderBy: [{ startDate: 'asc' }, { subject: 'asc' }],
    });

    // Load relations for dependency arrows
    const wpIds = wps.map((wp) => wp.id);
    const relations = await this.prisma.pmRelation.findMany({
      where: {
        fromId: { in: wpIds },
        toId: { in: wpIds },
        type: 'PRECEDES',
      },
      select: { fromId: true, toId: true },
    });

    // Load baseline if requested
    let baselineMap = new Map<string, { startDate: string | null; dueDate: string | null }>();
    if (options.showBaseline) {
      const baseline = await this.prisma.pmBaseline.findUnique({
        where: { id: options.showBaseline },
      });
      if (baseline) {
        const data = baseline.data as any[];
        for (const item of data) {
          baselineMap.set(item.id, {
            startDate: item.startDate,
            dueDate: item.dueDate,
          });
        }
      }
    }

    // Build rows
    const rows: GanttWpRow[] = wps.map((wp) => {
      let group = 'Ungrouped';
      if (options.groupBy === 'type') group = wp.type.name;
      else if (options.groupBy === 'status') group = wp.status.name;
      else if (options.groupBy === 'assignee') group = wp.assigneeId ?? 'Unassigned';
      else if (options.groupBy === 'version') group = wp.versionId ?? 'No Version';

      const baseline = baselineMap.get(wp.id);
      return {
        id: wp.id,
        subject: wp.subject,
        startDate: wp.startDate?.toISOString().split('T')[0] ?? null,
        dueDate: wp.dueDate?.toISOString().split('T')[0] ?? null,
        percentDone: wp.percentDone,
        typeName: wp.type.name,
        typeColor: wp.type.color,
        statusName: wp.status.name,
        statusColor: wp.status.color,
        assigneeId: wp.assigneeId,
        group,
        baselineStartDate: baseline?.startDate?.split('T')[0] ?? null,
        baselineDueDate: baseline?.dueDate?.split('T')[0] ?? null,
      };
    });

    // Determine date range
    const allDates = rows
      .flatMap((r) => [r.startDate, r.dueDate, r.baselineStartDate, r.baselineDueDate])
      .filter(Boolean) as string[];

    if (allDates.length === 0) {
      // No dates, return a simple "No data" PDF
      return this.renderHtmlToPdf('<html><body><h1>No work packages with dates found</h1></body></html>');
    }

    const minDate = options.dateFrom ?? allDates.sort()[0];
    const maxDate = options.dateTo ?? allDates.sort().reverse()[0];

    const html = this.buildGanttHtml(rows, relations, minDate, maxDate, options.showBaseline !== undefined);

    return this.renderHtmlToPdf(html);
  }

  private buildGanttHtml(
    rows: GanttWpRow[],
    relations: { fromId: string; toId: string }[],
    minDate: string,
    maxDate: string,
    showBaseline: boolean,
  ): string {
    const start = new Date(minDate);
    const end = new Date(maxDate);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const dayWidth = Math.max(12, Math.min(40, 1200 / totalDays));
    const chartWidth = totalDays * dayWidth;
    const rowHeight = 32;
    const headerHeight = 50;
    const labelWidth = 280;
    const totalHeight = headerHeight + rows.length * rowHeight + 20;

    // Generate month headers
    const months: { label: string; x: number; width: number }[] = [];
    let currentMonth = new Date(start);
    currentMonth.setDate(1);

    while (currentMonth <= end) {
      const monthStart = new Date(Math.max(currentMonth.getTime(), start.getTime()));
      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const monthEnd = new Date(Math.min(nextMonth.getTime() - 1, end.getTime()));

      const x = Math.max(0, (monthStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) * dayWidth;
      const width = ((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24) + 1) * dayWidth;

      months.push({
        label: currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        x,
        width,
      });

      currentMonth = nextMonth;
    }

    // Build SVG bars
    const bars = rows.map((row, index) => {
      const y = headerHeight + index * rowHeight;
      let barSvg = '';

      if (row.startDate && row.dueDate) {
        const barStart = (new Date(row.startDate).getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        const barEnd = (new Date(row.dueDate).getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
        const x = barStart * dayWidth;
        const width = Math.max(dayWidth, (barEnd - barStart) * dayWidth);

        // Baseline bar (behind, lighter)
        if (showBaseline && row.baselineStartDate && row.baselineDueDate) {
          const bStart = (new Date(row.baselineStartDate).getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
          const bEnd = (new Date(row.baselineDueDate).getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
          barSvg += `<rect x="${bStart * dayWidth}" y="${y + 4}" width="${Math.max(dayWidth, (bEnd - bStart) * dayWidth)}" height="${rowHeight - 8}" rx="3" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1"/>`;
        }

        // Progress background
        barSvg += `<rect x="${x}" y="${y + 6}" width="${width}" height="${rowHeight - 12}" rx="3" fill="${row.typeColor}40" stroke="${row.typeColor}" stroke-width="1"/>`;

        // Progress fill
        if (row.percentDone > 0) {
          const progressWidth = width * (row.percentDone / 100);
          barSvg += `<rect x="${x}" y="${y + 6}" width="${progressWidth}" height="${rowHeight - 12}" rx="3" fill="${row.typeColor}"/>`;
        }

        // Label on bar
        if (width > 40) {
          barSvg += `<text x="${x + 4}" y="${y + rowHeight / 2 + 4}" font-size="10" fill="#1e293b">${row.percentDone}%</text>`;
        }
      }

      return barSvg;
    }).join('\n');

    // Draw dependency arrows
    const wpIndexMap = new Map(rows.map((r, i) => [r.id, i]));
    const arrows = relations.map((rel) => {
      const fromIdx = wpIndexMap.get(rel.fromId);
      const toIdx = wpIndexMap.get(rel.toId);
      if (fromIdx === undefined || toIdx === undefined) return '';

      const fromRow = rows[fromIdx];
      const toRow = rows[toIdx];
      if (!fromRow.dueDate || !toRow.startDate) return '';

      const fromX = ((new Date(fromRow.dueDate).getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1) * dayWidth;
      const fromY = headerHeight + fromIdx * rowHeight + rowHeight / 2;
      const toX = ((new Date(toRow.startDate).getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) * dayWidth;
      const toY = headerHeight + toIdx * rowHeight + rowHeight / 2;

      return `<path d="M${fromX},${fromY} C${fromX + 15},${fromY} ${toX - 15},${toY} ${toX},${toY}" fill="none" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#arrowhead)"/>`;
    }).join('\n');

    // Row labels (left side table)
    const labelRows = rows.map((row, index) => {
      const y = headerHeight + index * rowHeight;
      return `
        <tr style="height:${rowHeight}px;">
          <td style="padding:2px 8px;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:${labelWidth}px;border-bottom:1px solid #f1f5f9;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${row.typeColor};margin-right:4px;"></span>
            ${this.escapeHtml(row.subject)}
          </td>
        </tr>`;
    }).join('');

    // Horizontal grid lines
    const gridLines = rows.map((_, i) => {
      const y = headerHeight + i * rowHeight + rowHeight;
      return `<line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white; }
    .container { display: flex; padding: 20px; }
    .labels { flex-shrink: 0; width: ${labelWidth}px; }
    .labels table { border-collapse: collapse; width: 100%; }
    .labels th { text-align: left; padding: 2px 8px; font-size: 11px; color: #64748b; height: ${headerHeight}px; vertical-align: bottom; border-bottom: 2px solid #e2e8f0; }
    .chart { overflow: hidden; }
    h1 { font-size: 16px; padding: 10px 20px; color: #1e293b; border-bottom: 1px solid #e2e8f0; }
    .legend { padding: 10px 20px; font-size: 10px; color: #64748b; }
  </style>
</head>
<body>
  <h1>Gantt Chart</h1>
  <div class="container">
    <div class="labels">
      <table>
        <thead><tr><th>Work Package</th></tr></thead>
        <tbody>${labelRows}</tbody>
      </table>
    </div>
    <div class="chart">
      <svg width="${chartWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#94a3b8"/>
          </marker>
        </defs>
        <!-- Month headers -->
        ${months.map((m) => `
          <rect x="${m.x}" y="0" width="${m.width}" height="${headerHeight}" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
          <text x="${m.x + m.width / 2}" y="30" text-anchor="middle" font-size="11" fill="#64748b">${m.label}</text>
        `).join('')}
        <!-- Grid lines -->
        ${gridLines}
        <!-- Bars -->
        ${bars}
        <!-- Dependency arrows -->
        ${arrows}
      </svg>
    </div>
  </div>
  ${showBaseline ? '<div class="legend"><span style="display:inline-block;width:20px;height:10px;background:#e2e8f0;border:1px solid #cbd5e1;margin-right:4px;"></span> Baseline</div>' : ''}
</body>
</html>`;
  }

  private async renderHtmlToPdf(html: string): Promise<Buffer> {
    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A3',
        landscape: true,
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
