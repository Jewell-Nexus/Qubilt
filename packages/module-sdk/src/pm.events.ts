export const PmEvents = {
  WORK_PACKAGE_CREATED: 'pm.work_package.created',
  WORK_PACKAGE_UPDATED: 'pm.work_package.updated',
  WORK_PACKAGE_ASSIGNED: 'pm.work_package.assigned',
  WORK_PACKAGE_DELETED: 'pm.work_package.deleted',
  TIME_ENTRY_CREATED: 'pm.time_entry.created',
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
  'pm.time_entry.created': {
    userId: string;
    hours: number;
    projectId: string;
    workPackageId: string | null;
  };
}
