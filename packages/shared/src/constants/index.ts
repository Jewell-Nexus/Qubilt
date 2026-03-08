export const MODULE_IDS = {
  PM: '@qubilt/pm',
  WIKI: '@qubilt/wiki',
  CHAT: '@qubilt/chat',
  CRM: '@qubilt/crm',
  HELPDESK: '@qubilt/helpdesk',
  HR: '@qubilt/hr',
  FINANCE: '@qubilt/finance',
  OKRS: '@qubilt/okrs',
  ASSETS: '@qubilt/assets',
  WHITEBOARD: '@qubilt/whiteboard',
  VIDEO: '@qubilt/video',
  CODE: '@qubilt/code',
  FORUMS: '@qubilt/forums',
  MARKETPLACE: '@qubilt/marketplace',
} as const

export const KERNEL_PERMISSIONS = {
  USERS_VIEW: 'kernel.users.view',
  USERS_MANAGE: 'kernel.users.manage',
  ROLES_MANAGE: 'kernel.roles.manage',
  MODULES_MANAGE: 'kernel.modules.manage',
  WORKSPACE_MANAGE: 'kernel.workspace.manage',
  BILLING_MANAGE: 'kernel.billing.manage',
} as const

export const DEFAULT_ROLES: readonly ('admin' | 'member' | 'viewer')[] = [
  'admin',
  'member',
  'viewer',
] as const
