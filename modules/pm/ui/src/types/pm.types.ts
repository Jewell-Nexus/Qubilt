export interface PmType {
  id: string;
  name: string;
  color: string;
  position: number;
  isDefault: boolean;
  isMilestone: boolean;
  workspaceId: string;
}

export interface PmStatus {
  id: string;
  name: string;
  color: string;
  position: number;
  isClosed: boolean;
  isDefault: boolean;
  isReadonly: boolean;
  workspaceId: string;
}

export interface PmPriority {
  id: string;
  name: string;
  color: string;
  position: number;
  isDefault: boolean;
  isActive: boolean;
  workspaceId: string;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}

export interface WorkPackage {
  id: string;
  subject: string;
  description?: string;
  typeId: string;
  type?: PmType;
  statusId: string;
  status?: PmStatus;
  priorityId?: string;
  priority?: PmPriority;
  assigneeId?: string;
  assignee?: User;
  reporterId?: string;
  reporter?: User;
  projectId: string;
  parentId?: string;
  versionId?: string;
  version?: PmVersion;
  categoryId?: string;
  category?: PmCategory;
  sprintId?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  spentHours: number;
  storyPoints?: number;
  percentDone: number;
  scheduleManually: boolean;
  ignoreNonWorkingDays: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalDetail {
  id: string;
  field: string;
  oldValue?: string;
  newValue?: string;
}

export interface Journal {
  id: string;
  workPackageId: string;
  userId: string;
  user?: User;
  notes?: string;
  version: number;
  createdAt: string;
  details: JournalDetail[];
}

export interface PmVersion {
  id: string;
  name: string;
  description?: string;
  status: 'OPEN' | 'LOCKED' | 'CLOSED';
  startDate?: string;
  dueDate?: string;
  sharing: string;
  projectId: string;
}

export interface PmCategory {
  id: string;
  name: string;
  defaultAssigneeId?: string;
  projectId: string;
}

export interface PmRelation {
  id: string;
  fromId: string;
  toId: string;
  type: RelationType;
  delay?: number;
  description?: string;
  from?: WorkPackage;
  to?: WorkPackage;
}

export type RelationType =
  | 'RELATES'
  | 'DUPLICATES'
  | 'DUPLICATED_BY'
  | 'BLOCKS'
  | 'BLOCKED_BY'
  | 'PRECEDES'
  | 'FOLLOWS'
  | 'INCLUDES'
  | 'PART_OF'
  | 'REQUIRES'
  | 'REQUIRED_BY';

export interface PmQuery {
  id: string;
  name: string;
  projectId?: string;
  userId: string;
  filters?: unknown[];
  sortBy?: unknown[];
  groupBy?: string;
  columns?: string[];
  isPublic: boolean;
  isDefault: boolean;
  displayType?: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  workPackageId?: string;
  userId: string;
  user?: User;
  hours: number;
  spentOn: string;
  comment?: string;
  activityId?: string;
  billable: boolean;
  createdAt: string;
}

export interface TimeActivity {
  id: string;
  name: string;
  isDefault: boolean;
  projectId: string;
}

export interface PmSprint {
  id: string;
  name: string;
  status: 'PLANNING' | 'ACTIVE' | 'CLOSED';
  startDate?: string;
  endDate?: string;
  goal?: string;
  versionId?: string;
  projectId: string;
}

export interface PmBoard {
  id: string;
  name: string;
  type: BoardType;
  projectId: string;
  columns: PmBoardColumn[];
}

export type BoardType = 'MANUAL' | 'STATUS' | 'ASSIGNEE' | 'VERSION' | 'SUBPROJECT' | 'PARENT_CHILD';

export interface PmBoardColumn {
  id: string;
  name: string;
  position: number;
  query?: Record<string, unknown>;
  boardId: string;
  cards: PmBoardCard[];
}

export interface PmBoardCard {
  id: string;
  workPackageId: string;
  position: number;
  columnId: string;
  workPackage?: WorkPackage;
}

export interface PmBaseline {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
}

export interface BaselineComparisonItem {
  workPackageId: string;
  subject: string;
  baselineStartDate?: string;
  baselineDueDate?: string;
  currentStartDate?: string;
  currentDueDate?: string;
}

export interface BaselineComparison {
  added: BaselineComparisonItem[];
  removed: BaselineComparisonItem[];
  changed: BaselineComparisonItem[];
}

export interface PmBudget {
  id: string;
  name: string;
  description?: string;
  versionId?: string;
  projectId: string;
  items: PmBudgetItem[];
}

export interface PmBudgetItem {
  id: string;
  type: 'LABOR' | 'MATERIAL';
  description: string;
  amount: number;
  workPackageId?: string;
  budgetId: string;
}

export interface PmCustomField {
  id: string;
  name: string;
  fieldFormat: CustomFieldFormat;
  isRequired: boolean;
  isFilter: boolean;
  searchable: boolean;
  defaultValue?: string;
  possibleValues?: string[];
  position: number;
  workspaceId: string;
}

export type CustomFieldFormat =
  | 'STRING'
  | 'TEXT'
  | 'INTEGER'
  | 'FLOAT'
  | 'BOOL'
  | 'DATE'
  | 'DATETIME'
  | 'LIST'
  | 'MULTI_LIST'
  | 'USER'
  | 'VERSION'
  | 'HIERARCHY';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateWorkPackageDto {
  subject: string;
  typeId?: string;
  statusId?: string;
  priorityId?: string;
  assigneeId?: string;
  parentId?: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  versionId?: string;
  storyPoints?: number;
}

export interface UpdateWorkPackageDto {
  subject?: string;
  typeId?: string;
  statusId?: string;
  priorityId?: string;
  assigneeId?: string;
  parentId?: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  versionId?: string;
  categoryId?: string;
  storyPoints?: number;
  percentDone?: number;
  customValues?: { customFieldId: string; value: unknown }[];
}

export interface FilterWorkPackagesParams {
  statusId?: string;
  typeId?: string;
  priorityId?: string;
  assigneeId?: string;
  versionId?: string;
  categoryId?: string;
  overdue?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  queryId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateRelationDto {
  toId: string;
  type: RelationType;
  delay?: number;
  description?: string;
}

export interface LogTimeDto {
  projectId: string;
  workPackageId?: string;
  hours: number;
  spentOn: string;
  comment?: string;
  activityId?: string;
  billable?: boolean;
}
