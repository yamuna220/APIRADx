// User profile types

export interface UserProfile {
  id: string
  email: string
  username: string
  fullName: string
  avatar?: string
  organization: string
  role: string
  timezone: string
  createdAt: string
  lastActive: string
}

export interface UserSettings {
  profile: {
    fullName: string
    email: string
    avatar?: string
    timezone: string
  }
  organization: {
    name: string
    role: string
  }
  security: {
    currentPassword?: string
    newPassword?: string
    twoFactorEnabled: boolean
  }
  preferences: {
    theme: 'dark' | 'light' | 'system'
    density: 'compact' | 'comfortable' | 'spacious'
    language: string
    dateFormat: string
  }
  notifications: {
    email: boolean
    inApp: boolean
    securityAlerts: boolean
    weeklyDigest: boolean
  }
}
