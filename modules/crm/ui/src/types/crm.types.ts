export type ContactType = 'PERSON' | 'ORGANIZATION';
export type DealStatus = 'OPEN' | 'WON' | 'LOST';
export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'NOTE' | 'DEADLINE';

export interface CrmContact {
  id: string;
  workspaceId: string;
  type: ContactType;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  company: string | null;
  organizationId: string | null;
  ownerId: string;
  tags: string[];
  customData: Record<string, unknown> | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // enriched fields from findAll
  dealCount?: number;
  activityCount?: number;
  lastActivityDate?: string | null;
}

export interface ContactDetail extends CrmContact {
  organization: CrmContact | null;
  employees: Array<{ id: string; firstName: string | null; lastName: string | null; email: string | null; jobTitle: string | null }>;
  deals: Array<{ id: string; name: string; value: string; status: DealStatus; stage: { name: string } }>;
  activities: CrmActivity[];
  notes: CrmNote[];
}

export interface CrmPipeline {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  stages: CrmPipelineStage[];
}

export interface CrmPipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  position: number;
  probability: number;
  color: string | null;
  isWon: boolean;
  isClosed: boolean;
  dealCount?: number;
  totalValue?: number;
}

export interface CrmDeal {
  id: string;
  workspaceId: string;
  pipelineId: string;
  stageId: string;
  contactId: string;
  name: string;
  value: string;
  currency: string;
  status: DealStatus;
  expectedCloseDate: string | null;
  closedAt: string | null;
  ownerId: string;
  customData: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  stage?: CrmPipelineStage;
  contact?: Pick<CrmContact, 'id' | 'firstName' | 'lastName' | 'email' | 'company'>;
  pipeline?: Pick<CrmPipeline, 'id' | 'name'>;
}

export interface DealDetail extends CrmDeal {
  stage: CrmPipelineStage;
  pipeline: CrmPipeline;
  contact: CrmContact;
  activities: CrmActivity[];
  notes: CrmNote[];
}

export interface PipelineBoardData {
  pipeline: { id: string; name: string };
  stages: Array<{
    stage: CrmPipelineStage;
    deals: CrmDeal[];
  }>;
}

export interface CrmActivity {
  id: string;
  workspaceId: string;
  type: ActivityType;
  subject: string;
  description: string | null;
  contactId: string | null;
  dealId: string | null;
  userId: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  contact?: { id: string; firstName: string | null; lastName: string | null } | null;
  deal?: { id: string; name: string } | null;
}

export interface CrmNote {
  id: string;
  workspaceId: string;
  content: string;
  contactId: string | null;
  dealId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForecastData {
  expectedRevenue: number;
  weightedRevenue: number;
  dealCount: number;
  byPeriod: Array<{ period: string; expectedRevenue: number; weightedRevenue: number; dealCount: number }>;
  byStage: Array<{ stageName: string; dealCount: number; totalValue: number; weightedValue: number }>;
  byOwner: Array<{ ownerId: string; dealCount: number; totalValue: number; weightedValue: number }>;
}

export interface FunnelStage {
  stageId: string;
  stageName: string;
  dealCount: number;
  totalValue: number;
  conversionRate: number;
}

export interface RevenueTrend {
  month: string;
  wonDeals: number;
  wonValue: number;
  lostDeals: number;
  lostValue: number;
}

export interface OwnerStats {
  ownerId: string;
  wonDeals: number;
  wonValue: number;
  openDeals: number;
  openValue: number;
  conversionRate: number;
}

export interface CreateContactDto {
  workspaceId: string;
  type: ContactType;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  organizationId?: string;
  ownerId: string;
  tags?: string[];
  customData?: Record<string, unknown>;
}

export interface UpdateContactDto {
  type?: ContactType;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  organizationId?: string;
  ownerId?: string;
  tags?: string[];
  customData?: Record<string, unknown>;
}

export interface CreateDealDto {
  workspaceId: string;
  pipelineId: string;
  contactId: string;
  name: string;
  value?: number;
  currency?: string;
  expectedCloseDate?: string;
  ownerId: string;
  customData?: Record<string, unknown>;
}

export interface UpdateDealDto {
  name?: string;
  value?: number;
  currency?: string;
  expectedCloseDate?: string;
  ownerId?: string;
  contactId?: string;
  customData?: Record<string, unknown>;
}

export interface CreateActivityDto {
  workspaceId: string;
  type: ActivityType;
  subject: string;
  description?: string;
  contactId?: string;
  dealId?: string;
  userId: string;
  dueDate?: string;
}

export interface CreateNoteDto {
  workspaceId: string;
  content: string;
  contactId?: string;
  dealId?: string;
}

export interface CreatePipelineDto {
  workspaceId: string;
  name: string;
  description?: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}
