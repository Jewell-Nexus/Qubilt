export interface KernelEventPayloads {
  'kernel.user.created': { userId: string; workspaceId: string };
  'kernel.user.updated': { userId: string; changes: string[] };
  'kernel.user.deleted': { userId: string };
  'kernel.workspace.created': { workspaceId: string; ownerId: string };
  'kernel.module.installed': { moduleId: string; version: string };
  'kernel.module.enabled': { moduleId: string; workspaceId: string };
  'kernel.module.disabled': { moduleId: string; workspaceId: string };
  'kernel.module.uninstalled': { moduleId: string };
  'kernel.invitation.sent': { email: string; workspaceId: string; token: string };
}
