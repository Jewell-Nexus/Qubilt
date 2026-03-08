import { PrismaClient } from '../node_modules/.prisma/wiki-client';

const prisma = new PrismaClient();

interface SeedConfig {
  workspaceId: string;
}

const BUILT_IN_TEMPLATES = [
  {
    name: 'Meeting Notes',
    description: 'Structured meeting notes with agenda, attendees, decisions, and action items',
    icon: '📋',
    category: 'meetings',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Meeting Notes' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Date' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '[Date]' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Attendees' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Name]' }] }] },
        ] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Agenda' }] },
        { type: 'orderedList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Topic 1]' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Topic 2]' }] }] },
        ] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Decisions' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Decision]' }] }] },
        ] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Action Items' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Action] — @assignee — due [date]' }] }] },
        ] },
      ],
    },
  },
  {
    name: 'Project Brief',
    description: 'Project overview with goals, stakeholders, timeline, and risks',
    icon: '🎯',
    category: 'project',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Project Brief' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Overview' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '[Brief description of the project and its purpose]' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Goals' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Goal 1]' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Goal 2]' }] }] },
        ] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Stakeholders' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Name] — [Role]' }] }] },
        ] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Timeline' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '[Key milestones and dates]' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Risks' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Risk] — Mitigation: [strategy]' }] }] },
        ] },
      ],
    },
  },
  {
    name: 'Weekly Update',
    description: 'Weekly status update with wins, blockers, and next week plans',
    icon: '📊',
    category: 'status',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Weekly Update' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Week of [date]' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Wins' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Accomplishment]' }] }] },
        ] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Blockers' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Blocker] — Status: [status]' }] }] },
        ] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Next Week' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Planned work]' }] }] },
        ] },
      ],
    },
  },
  {
    name: 'Technical Spec',
    description: 'Technical specification with architecture, API, and open questions',
    icon: '⚙️',
    category: 'engineering',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Technical Specification' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Overview' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '[What is being built and why]' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Architecture' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '[High-level architecture description and diagrams]' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'API Design' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Endpoints' }] },
        { type: 'codeBlock', attrs: { language: 'text' }, content: [{ type: 'text', text: 'GET /api/resource\nPOST /api/resource\nPATCH /api/resource/:id\nDELETE /api/resource/:id' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Data Model' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '[Schema and relationships]' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Open Questions' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Question 1]' }] }] },
        ] },
      ],
    },
  },
  {
    name: 'Retrospective',
    description: 'Team retrospective with went well, improve, and action items',
    icon: '🔄',
    category: 'meetings',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Retrospective' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Sprint/Iteration: [name] — [date]' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'What Went Well' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Positive outcome]' }] }] },
        ] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'What Could Improve' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Area for improvement]' }] }] },
        ] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Action Items' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Action] — Owner: [name]' }] }] },
        ] },
      ],
    },
  },
];

export async function seedWikiDefaults(config: SeedConfig) {
  const { workspaceId } = config;

  console.log('Seeding Wiki defaults...');

  for (const template of BUILT_IN_TEMPLATES) {
    const existing = await prisma.wikiTemplate.findFirst({
      where: { workspaceId, name: template.name, isBuiltIn: true },
    });
    if (!existing) {
      await prisma.wikiTemplate.create({
        data: {
          workspaceId,
          name: template.name,
          description: template.description,
          icon: template.icon,
          content: template.content,
          category: template.category,
          isBuiltIn: true,
        },
      });
    }
  }

  console.log('Wiki seed complete.');
  console.log('  Templates: Meeting Notes, Project Brief, Weekly Update, Technical Spec, Retrospective');
}

// Run standalone
async function main() {
  const workspaceId = process.argv[2];
  if (!workspaceId) {
    console.error('Usage: tsx wiki.seed.ts <workspaceId>');
    console.error('  Provide the workspace ID from the kernel seed.');
    process.exit(1);
  }

  await seedWikiDefaults({ workspaceId });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
