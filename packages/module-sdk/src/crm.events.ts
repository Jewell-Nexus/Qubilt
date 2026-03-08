export const CrmEvents = {
  CONTACT_CREATED: 'crm.contact.created',
  CONTACT_UPDATED: 'crm.contact.updated',
  DEAL_CREATED: 'crm.deal.created',
  DEAL_STAGE_CHANGED: 'crm.deal.stage_changed',
  DEAL_CLOSED_WON: 'crm.deal.closed_won',
  DEAL_CLOSED_LOST: 'crm.deal.closed_lost',
  ACTIVITY_CREATED: 'crm.activity.created',
} as const;

export interface CrmEventPayloads {
  'crm.contact.created': {
    contactId: string;
    workspaceId: string;
    type: string;
  };
  'crm.contact.updated': {
    contactId: string;
    workspaceId: string;
  };
  'crm.deal.created': {
    dealId: string;
    workspaceId: string;
    contactId: string;
    value: number;
  };
  'crm.deal.stage_changed': {
    dealId: string;
    workspaceId: string;
    fromStageId: string;
    toStageId: string;
    fromStageName: string;
    toStageName: string;
  };
  'crm.deal.closed_won': {
    dealId: string;
    workspaceId: string;
    contactId: string;
    value: number;
  };
  'crm.deal.closed_lost': {
    dealId: string;
    workspaceId: string;
    contactId: string;
    value: number;
  };
  'crm.activity.created': {
    activityId: string;
    workspaceId: string;
    type: string;
    dealId: string | null;
    contactId: string | null;
  };
}
