import { PrismaClient } from '../node_modules/.prisma/pm-client';

const prisma = new PrismaClient();

interface SeedConfig {
  workspaceId: string;
}

export async function seedPmDefaults(config: SeedConfig) {
  const { workspaceId } = config;

  console.log('Seeding PM defaults...');

  // ─── Types ─────────────────────────────────────────────────────
  const typeData = [
    { name: 'Task', color: '#3B82F6', isDefault: true, isMilestone: false },
    { name: 'Bug', color: '#EF4444', isDefault: false, isMilestone: false },
    { name: 'Feature', color: '#10B981', isDefault: false, isMilestone: false },
    { name: 'Epic', color: '#8B5CF6', isDefault: false, isMilestone: false },
    { name: 'Story', color: '#F59E0B', isDefault: false, isMilestone: false },
    { name: 'Milestone', color: '#6366F1', isDefault: false, isMilestone: true },
  ];

  for (let i = 0; i < typeData.length; i++) {
    const t = typeData[i];
    await prisma.pmType.upsert({
      where: { workspaceId_name: { workspaceId, name: t.name } },
      update: {},
      create: { workspaceId, ...t, position: i },
    });
  }

  // ─── Statuses ──────────────────────────────────────────────────
  const statusData = [
    { name: 'New', color: '#6B7280', isDefault: true, isClosed: false },
    { name: 'In Progress', color: '#3B82F6', isDefault: false, isClosed: false },
    { name: 'In Review', color: '#F59E0B', isDefault: false, isClosed: false },
    { name: 'Done', color: '#10B981', isDefault: false, isClosed: true },
    { name: 'Closed', color: '#6366F1', isDefault: false, isClosed: true },
    { name: 'Rejected', color: '#EF4444', isDefault: false, isClosed: true },
  ];

  for (let i = 0; i < statusData.length; i++) {
    const s = statusData[i];
    await prisma.pmStatus.upsert({
      where: { workspaceId_name: { workspaceId, name: s.name } },
      update: {},
      create: { workspaceId, ...s, position: i },
    });
  }

  // ─── Priorities ────────────────────────────────────────────────
  const priorityData = [
    { name: 'Immediate', color: '#DC2626' },
    { name: 'High', color: '#F97316' },
    { name: 'Normal', color: '#3B82F6', isDefault: true },
    { name: 'Low', color: '#6B7280' },
  ];

  for (let i = 0; i < priorityData.length; i++) {
    const p = priorityData[i];
    await prisma.pmPriority.upsert({
      where: { workspaceId_name: { workspaceId, name: p.name } },
      update: {},
      create: {
        workspaceId,
        name: p.name,
        color: p.color,
        isDefault: (p as any).isDefault ?? false,
        position: i,
      },
    });
  }

  // ─── Time Activities ───────────────────────────────────────────
  const activityNames = [
    'Development',
    'Design',
    'Testing',
    'Meetings',
    'Documentation',
  ];

  for (const name of activityNames) {
    const existing = await prisma.pmTimeActivity.findFirst({
      where: { workspaceId, name },
    });
    if (!existing) {
      await prisma.pmTimeActivity.create({
        data: {
          workspaceId,
          name,
          isDefault: name === 'Development',
        },
      });
    }
  }

  console.log('PM seed complete.');
  console.log('  Types: Task, Bug, Feature, Epic, Story, Milestone');
  console.log('  Statuses: New, In Progress, In Review, Done, Closed, Rejected');
  console.log('  Priorities: Immediate, High, Normal, Low');
  console.log('  Activities: Development, Design, Testing, Meetings, Documentation');
}

// Run standalone
async function main() {
  // Read workspaceId from command line arg or find first workspace
  const workspaceId = process.argv[2];
  if (!workspaceId) {
    console.error('Usage: tsx pm.seed.ts <workspaceId>');
    console.error('  Provide the workspace ID from the kernel seed.');
    process.exit(1);
  }

  await seedPmDefaults({ workspaceId });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
