import { TeamMember, APIKey } from '../types'
import settingsData from '../data/settings.json'

// Async service for settings data with fallback to mock
export const settingsService = {
  getTeamMembers: async (): Promise<TeamMember[]> => {
    // Return mock data for now (backend doesn't provide this yet)
    return settingsData.teamMembers as TeamMember[]
  },

  getTeamMemberByEmail: async (email: string): Promise<TeamMember | undefined> => {
    const members = settingsData.teamMembers as TeamMember[]
    return members.find(m => m.email === email)
  },

  addTeamMember: async (member: Omit<TeamMember, 'initials'>): Promise<TeamMember> => {
    const members = settingsData.teamMembers as TeamMember[]
    const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase()
    const newMember: TeamMember = {
      ...member,
      initials
    }
    members.push(newMember)
    return newMember
  },

  removeTeamMember: async (email: string): Promise<boolean> => {
    const members = settingsData.teamMembers as TeamMember[]
    const index = members.findIndex(m => m.email === email)
    if (index !== -1) {
      members.splice(index, 1)
      return true
    }
    return false
  },

  getAPIKeys: async (): Promise<APIKey[]> => {
    // Return mock data for now (backend doesn't provide this yet)
    return settingsData.apiKeys as APIKey[]
  },

  getAPIKeyById: async (id: string): Promise<APIKey | undefined> => {
    const keys = settingsData.apiKeys as APIKey[]
    return keys.find(k => k.id === id)
  },

  addAPIKey: async (key: Omit<APIKey, 'id'>): Promise<APIKey> => {
    const keys = settingsData.apiKeys as APIKey[]
    const newId = (parseInt(keys[keys.length - 1]?.id || '0') + 1).toString()
    const newKey: APIKey = {
      id: newId,
      ...key
    }
    keys.push(newKey)
    return newKey
  },

  deleteAPIKey: async (id: string): Promise<boolean> => {
    const keys = settingsData.apiKeys as APIKey[]
    const index = keys.findIndex(k => k.id === id)
    if (index !== -1) {
      keys.splice(index, 1)
      return true
    }
    return false
  },

  getFullKey: async (prefix: string): Promise<string> => {
    return `${prefix}7f3a9b2c1d8e4f6a0b5c9d2e7f1a3b8c4d`
  },

  getStats: async () => {
    const members = settingsData.teamMembers as TeamMember[]
    const keys = settingsData.apiKeys as APIKey[]
    return {
      totalMembers: members.length,
      totalKeys: keys.length,
      activeKeys: keys.length
    }
  }
}
