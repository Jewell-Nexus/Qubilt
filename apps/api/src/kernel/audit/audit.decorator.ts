import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit_metadata';

export interface AuditMetadata {
  action: string;
  resourceType: string;
}

export const Audit = (action: string, resourceType: string) =>
  SetMetadata(AUDIT_KEY, { action, resourceType } as AuditMetadata);
