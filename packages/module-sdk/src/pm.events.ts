export const PmEvents = {
  WORK_PACKAGE_CREATED: 'pm.work_package.created',
  WORK_PACKAGE_UPDATED: 'pm.work_package.updated',
  WORK_PACKAGE_ASSIGNED: 'pm.work_package.assigned',
  WORK_PACKAGE_DELETED: 'pm.work_package.deleted',
  WORK_PACKAGE_CLOSED: 'pm.work_package.closed',
  WORK_PACKAGE_REOPENED: 'pm.work_package.reopened',
  TIME_ENTRY_CREATED: 'pm.time_entry.created',
  TIME_ENTRY_UPDATED: 'pm.time_entry.updated',
  TIME_ENTRY_DELETED: 'pm.time_entry.deleted',
  SPRINT_STARTED: 'pm.sprint.started',
  SPRINT_CLOSED: 'pm.sprint.closed',
  VERSION_CLOSED: 'pm.version.closed',
} as const;

export interface PmEventPayloads {
  'pm.work_package.created': {
    workPackageId: string;
    projectId: string;
    typeId: string;
    authorId: string;
  };
  'pm.work_package.updated': {
    workPackageId: string;
    changes: string[];
  };
  'pm.work_package.assigned': {
    workPackageId: string;
    assigneeId: string;
    subject: string;
  };
  'pm.work_package.deleted': {
    workPackageId: string;
    projectId: string;
  };
  'pm.work_package.closed': {
    workPackageId: string;
    projectId: string;
  };
  'pm.work_package.reopened': {
    workPackageId: string;
    projectId: string;
  };
  'pm.time_entry.created': {
    userId: string;
    hours: number;
    projectId: string;
    workPackageId: string | null;
  };
  'pm.time_entry.updated': {
    timeEntryId: string;
    userId: string;
    projectId: string;
  };
  'pm.time_entry.deleted': {
    timeEntryId: string;
    userId: string;
    projectId: string;
  };
  'pm.sprint.started': {
    sprintId: string;
    projectId: string;
  };
  'pm.sprint.closed': {
    sprintId: string;
    projectId: string;
  };
  'pm.version.closed': {
    versionId: string;
    projectId: string;
  };
}
