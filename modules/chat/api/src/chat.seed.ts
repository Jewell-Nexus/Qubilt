import { PrismaClient } from '../node_modules/.prisma/chat-client';

const prisma = new PrismaClient();

interface SeedConfig {
  workspaceId: string;
}

export async function seedChatDefaults(config: SeedConfig) {
  const { workspaceId } = config;

  console.log('Seeding Chat defaults...');

  // Create a default #general channel if it doesn't exist
  const existing = await prisma.chatChannel.findFirst({
    where: { workspaceId, name: 'general', type: 'PUBLIC' },
  });

  if (!existing) {
    await prisma.chatChannel.create({
      data: {
        workspaceId,
        name: 'general',
        description: 'General discussion for the workspace',
        type: 'PUBLIC',
        icon: '💬',
        createdBy: 'system',
      },
    });
  }

  // Create a #random channel
  const existingRandom = await prisma.chatChannel.findFirst({
    where: { workspaceId, name: 'random', type: 'PUBLIC' },
  });

  if (!existingRandom) {
    await prisma.chatChannel.create({
      data: {
        workspaceId,
        name: 'random',
        description: 'Non-work banter and water cooler conversation',
        type: 'PUBLIC',
        icon: '🎲',
        createdBy: 'system',
      },
    });
  }

  console.log('Chat seed complete.');
  console.log('  Channels: #general, #random');
}

// Run standalone
async function main() {
  const workspaceId = process.argv[2];
  if (!workspaceId) {
    console.error('Usage: tsx chat.seed.ts <workspaceId>');
    console.error('  Provide the workspace ID from the kernel seed.');
    process.exit(1);
  }

  await seedChatDefaults({ workspaceId });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
