import { TeamMember, APIKey } from '../types'
import settingsData from '../data/settings.json'

// Mock service for settings data
export const settingsService = {
  getTeamMembers: (): TeamMember[] => {
    return settingsData.teamMembers as TeamMember[]
  },

  getTeamMemberByEmail: (email: string): TeamMember | undefined => {
    const members = settingsData.teamMembers as TeamMember[]
    return members.find(m => m.email === email)
  },

  addTeamMember: (member: Omit<TeamMember, 'initials'>): TeamMember => {
    const members = settingsData.teamMembers as TeamMember[]
    const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase()
    const newMember: TeamMember = {
      ...member,
      initials
    }
    members.push(newMember)
    return newMember
  },

  removeTeamMember: (email: string): boolean => {
    const members = settingsData.teamMembers as TeamMember[]
    const index = members.findIndex(m => m.email === email)
    if (index !== -1) {
      members.splice(index, 1)
      return true
    }
    return false
  },

  getAPIKeys: (): APIKey[] => {
    return settingsData.apiKeys as APIKey[]
  },

  getAPIKeyById: (id: string): APIKey | undefined => {
    const keys = settingsData.apiKeys as APIKey[]
    return keys.find(k => k.id === id)
  },

  addAPIKey: (key: Omit<APIKey, 'id'>): APIKey => {
    const keys = settingsData.apiKeys as APIKey[]
    const newId = (parseInt(keys[keys.length - 1]?.id || '0') + 1).toString()
    const newKey: APIKey = {
      id: newId,
      ...key
    }
    keys.push(newKey)
    return newKey
  },

  deleteAPIKey: (id: string): boolean => {
    const keys = settingsData.apiKeys as APIKey[]
    const index = keys.findIndex(k => k.id === id)
    if (index !== -1) {
      keys.splice(index, 1)
      return true
    }
    return false
  },

  getFullKey: (prefix: string): string => {
    return `${prefix}7f3a9b2c1d8e4f6a0b5c9d2e7f1a3b8c4d`
  },

  getStats: () => {
    const members = settingsData.teamMembers as TeamMember[]
    const keys = settingsData.apiKeys as APIKey[]
    return {
      totalMembers: members.length,
      totalKeys: keys.length,
      activeKeys: keys.length
    }
  }
}
