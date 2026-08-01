import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { UserProfile, UserSettings } from '../types/user'
import { authApi, User as BackendUser } from '../services/authApi'
import { useNotifications } from './NotificationContext'

interface UserContextType {
  user: UserProfile | null
  settings: UserSettings
  isAuthenticated: boolean
  isLoading: boolean
  isProfileDropdownOpen: boolean
  setProfileDropdownOpen: (open: boolean) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  updateSettings: (updates: Partial<UserSettings>) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const mockSettings: UserSettings = {
  profile: {
    fullName: '',
    email: '',
    timezone: 'America/New_York'
  },
  organization: {
    name: '',
    role: 'member'
  },
  security: {
    twoFactorEnabled: false
  },
  preferences: {
    theme: 'dark',
    density: 'comfortable',
    language: 'en',
    dateFormat: 'MM/DD/YYYY'
  },
  notifications: {
    email: true,
    inApp: true,
    securityAlerts: true,
    weeklyDigest: true
  }
}

function backendUserToProfile(backendUser: BackendUser): UserProfile {
  return {
    id: backendUser.id.toString(),
    email: backendUser.email,
    username: backendUser.username,
    fullName: backendUser.full_name || backendUser.username,
    organization: backendUser.organization || 'Personal',
    role: backendUser.role,
    timezone: 'America/New_York',
    createdAt: backendUser.created_at,
    lastActive: backendUser.last_login || new Date().toISOString()
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings>(() => {
    const stored = localStorage.getItem('apiradx-settings')
    return stored ? JSON.parse(stored) : mockSettings
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const { addNotification } = useNotifications()

  useEffect(() => {
    const loadUser = async () => {
      if (authApi.isAuthenticated()) {
        try {
          const backendUser = await authApi.getCurrentUser()
          const userProfile = backendUserToProfile(backendUser)
          setUser(userProfile)
          
          // Update settings with user data
          setSettings(prev => ({
            ...prev,
            profile: {
              ...prev.profile,
              fullName: userProfile.fullName,
              email: userProfile.email
            },
            organization: {
              ...prev.organization,
              name: userProfile.organization,
              role: userProfile.role
            }
          }))
        } catch (error) {
          console.error('Failed to load user:', error)
          authApi.logoutLocal()
        }
      }
      setIsLoading(false)
    }

    loadUser()
  }, [])

  useEffect(() => {
    localStorage.setItem('apiradx-settings', JSON.stringify(settings))
  }, [settings])

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updates, lastActive: new Date().toISOString() } : null)
  }

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings(prev => {
      const merged = { ...prev }
      if (updates.profile) merged.profile = { ...merged.profile, ...updates.profile }
      if (updates.organization) merged.organization = { ...merged.organization, ...updates.organization }
      if (updates.security) merged.security = { ...merged.security, ...updates.security }
      if (updates.preferences) merged.preferences = { ...merged.preferences, ...updates.preferences }
      if (updates.notifications) merged.notifications = { ...merged.notifications, ...updates.notifications }
      return merged
    })
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      await authApi.login(email, password)
      const backendUser = await authApi.getCurrentUser()
      const userProfile = backendUserToProfile(backendUser)
      setUser(userProfile)
      
      setSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          fullName: userProfile.fullName,
          email: userProfile.email
        },
        organization: {
          ...prev.organization,
          name: userProfile.organization,
          role: userProfile.role
        }
      }))
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      authApi.logoutLocal()
      setUser(null)
      localStorage.removeItem('apiradx-settings')
    }
  }

  const refreshUser = async () => {
    if (authApi.isAuthenticated()) {
      try {
        const backendUser = await authApi.getCurrentUser()
        const userProfile = backendUserToProfile(backendUser)
        setUser(userProfile)
      } catch (error) {
        console.error('Failed to refresh user:', error)
      }
    }
  }

  return (
    <UserContext.Provider value={{
      user,
      settings,
      isAuthenticated: authApi.isAuthenticated(),
      isLoading,
      isProfileDropdownOpen,
      setProfileDropdownOpen,
      updateProfile,
      updateSettings,
      login,
      logout,
      refreshUser
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
