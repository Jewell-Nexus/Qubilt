export type ModuleCategory =
  | 'project-management'
  | 'collaboration'
  | 'communication'
  | 'crm-sales'
  | 'hr-people'
  | 'finance'
  | 'development'
  | 'analytics'
  | 'productivity'
  | 'integration'
  | 'other'

export interface QubiltModule {
  id: string
  name: string
  version: string
  description: string
  icon: string
  accentColor: string
  category: ModuleCategory
  dependencies?: string[]
  permissions?: PermissionDefinition[]
  settingsSchema?: Record<string, unknown>
  navigation?: NavigationItem[]
  widgets?: WidgetDefinition[]
  eventHandlers?: EventSubscription[]
  searchProviders?: SearchProvider[]
  onInstall?(): Promise<void>
  onEnable?(workspaceId: string): Promise<void>
  onDisable?(workspaceId: string): Promise<void>
  onUninstall?(): Promise<void>
}

export interface PermissionDefinition {
  key: string
  name: string
  category: string
  description?: string
}

export interface NavigationItem {
  id: string
  label: string
  icon: string
  route: string
  scope: 'global' | 'project' | 'personal'
  position?: number
  parent?: string
  requiredPermission?: string
  accentColor?: string
}

export interface WidgetDefinition {
  id: string
  name: string
  description: string
  component: string
  defaultSize: { w: number; h: number }
  scopes: ('project_overview' | 'my_page' | 'dashboard')[]
}

export interface EventSubscription {
  event: string
  handler: string
}

export interface SearchProvider {
  entity: string
  displayName: string
  searchFields: string[]
}

export interface SearchResult {
  id: string
  title: string
  subtitle?: string
  url: string
  moduleId: string
  icon?: string
}
