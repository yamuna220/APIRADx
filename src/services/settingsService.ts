import { TeamMember, APIKey } from '../types'

// Dynamic service for settings data
export const settingsService = {
  getTeamMembers: (): TeamMember[] => {
    return []
  },

  getTeamMemberByEmail: (email: string): TeamMember | undefined => {
    return undefined
  },

  addTeamMember: (member: Omit<TeamMember, 'initials'>): TeamMember => {
    const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase()
    return { ...member, initials }
  },

  removeTeamMember: (email: string): boolean => {
    return true
  },

  getAPIKeys: (): APIKey[] => {
    return []
  },

  getAPIKeyById: (id: string): APIKey | undefined => {
    return undefined
  },

  addAPIKey: (key: Omit<APIKey, 'id'>): APIKey => {
    return { id: Math.random().toString(), ...key }
  },

  deleteAPIKey: (id: string): boolean => {
    return true
  },

  getFullKey: (prefix: string): string => {
    return `${prefix}7f3a9b2c1d8e4f6a0b5c9d2e7f1a3b8c4d`
  },

  getStats: () => {
    return {
      totalMembers: 0,
      totalKeys: 0,
      activeKeys: 0
    }
  }
}
