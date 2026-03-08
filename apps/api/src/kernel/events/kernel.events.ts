export const KernelEvents = {
  USER_CREATED: 'kernel.user.created',
  USER_UPDATED: 'kernel.user.updated',
  USER_DELETED: 'kernel.user.deleted',
  WORKSPACE_CREATED: 'kernel.workspace.created',
  MODULE_INSTALLED: 'kernel.module.installed',
  MODULE_ENABLED: 'kernel.module.enabled',
  MODULE_DISABLED: 'kernel.module.disabled',
  MODULE_UNINSTALLED: 'kernel.module.uninstalled',
  INVITATION_SENT: 'kernel.invitation.sent',
} as const;
