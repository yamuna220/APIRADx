// Workspace management types

export interface Workspace {
  id: string
  name: string
  logo?: string
  color: string
  memberCount: number
  apiCount: number
  isOwner: boolean
  role: 'owner' | 'admin' | 'member' | 'viewer'
  createdAt: string
  lastAccessed: string
}

export interface WorkspaceSettings {
  id: string
  name: string
  description?: string
  logo?: string
  defaultTheme: 'dark' | 'light' | 'system'
  defaultDensity: 'compact' | 'comfortable' | 'spacious'
  notifications: {
    email: boolean
    inApp: boolean
    securityAlerts: boolean
    weeklyDigest: boolean
  }
  security: {
    require2FA: boolean
    sessionTimeout: number
    ipWhitelist: string[]
  }
}

export interface CreateWorkspaceInput {
  name: string
  description?: string
  color: string
}

export interface WorkspaceMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joinedAt: string
  lastActive: string
}
