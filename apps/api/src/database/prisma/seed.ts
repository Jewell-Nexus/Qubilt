import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding kernel database...');

  const hashedPassword = await bcrypt.hash('Admin1234!', 12);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@qubilt.local' },
    update: {},
    create: {
      email: 'admin@qubilt.local',
      username: 'admin',
      displayName: 'Admin',
      hashedPassword,
      emailVerified: true,
    },
  });

  // Create workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'my-workspace' },
    update: {},
    create: {
      name: 'My Workspace',
      slug: 'my-workspace',
      ownerId: adminUser.id,
    },
  });

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: {
      workspaceId_name: { workspaceId: workspace.id, name: 'admin' },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'admin',
      description: 'Full access to all kernel features',
      builtin: 'admin',
      position: 0,
      permissions: {
        create: [
          { permission: 'kernel.users.view' },
          { permission: 'kernel.users.manage' },
          { permission: 'kernel.roles.manage' },
          { permission: 'kernel.modules.manage' },
          { permission: 'kernel.workspace.manage' },
          { permission: 'kernel.billing.manage' },
        ],
      },
    },
  });

  await prisma.role.upsert({
    where: {
      workspaceId_name: { workspaceId: workspace.id, name: 'member' },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'member',
      description: 'Standard workspace member',
      builtin: 'member',
      position: 1,
      permissions: {
        create: [{ permission: 'kernel.users.view' }],
      },
    },
  });

  await prisma.role.upsert({
    where: {
      workspaceId_name: { workspaceId: workspace.id, name: 'viewer' },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'viewer',
      description: 'Read-only access',
      builtin: 'viewer',
      position: 2,
      permissions: {
        create: [{ permission: 'kernel.users.view' }],
      },
    },
  });

  // Assign admin user to workspace
  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: adminUser.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log('Seed complete.');
  console.log(`  Admin user: admin@qubilt.local / Admin1234!`);
  console.log(`  Workspace: ${workspace.name} (${workspace.slug})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
