export const WikiEvents = {
  PAGE_CREATED: 'wiki.page.created',
  PAGE_UPDATED: 'wiki.page.updated',
  PAGE_DELETED: 'wiki.page.deleted',
} as const;

export interface WikiEventPayloads {
  'wiki.page.created': {
    pageId: string;
    workspaceId: string;
    projectId?: string;
    authorId: string;
  };
  'wiki.page.updated': {
    pageId: string;
    changes: string[];
  };
  'wiki.page.deleted': {
    pageId: string;
  };
}
