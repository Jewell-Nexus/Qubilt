import { PrismaClient } from '../node_modules/.prisma/crm-client';

const prisma = new PrismaClient();

interface SeedConfig {
  workspaceId: string;
}

export async function seedCrmDefaults(config: SeedConfig) {
  const { workspaceId } = config;

  console.log('Seeding CRM defaults...');

  // Create default pipeline if none exists
  const existing = await prisma.crmPipeline.findFirst({
    where: { workspaceId },
  });

  if (!existing) {
    await prisma.crmPipeline.create({
      data: {
        workspaceId,
        name: 'Sales Pipeline',
        description: 'Default sales pipeline',
        isDefault: true,
        stages: {
          create: [
            { name: 'New Lead', probability: 10, color: '#6366F1', position: 0 },
            { name: 'Qualified', probability: 25, color: '#3B82F6', position: 1 },
            { name: 'Proposal', probability: 50, color: '#F59E0B', position: 2 },
            { name: 'Negotiation', probability: 75, color: '#F97316', position: 3 },
            { name: 'Closed Won', probability: 100, color: '#10B981', position: 4, isWon: true, isClosed: true },
            { name: 'Closed Lost', probability: 0, color: '#EF4444', position: 5, isClosed: true },
          ],
        },
      },
    });
  }

  console.log('CRM seed complete.');
  console.log('  Pipeline: Sales Pipeline (6 default stages)');
}

// Run standalone
async function main() {
  const workspaceId = process.argv[2];
  if (!workspaceId) {
    console.error('Usage: tsx crm.seed.ts <workspaceId>');
    console.error('  Provide the workspace ID from the kernel seed.');
    process.exit(1);
  }

  await seedCrmDefaults({ workspaceId });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
