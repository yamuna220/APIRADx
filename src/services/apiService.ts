import { APIEndpoint } from '../types'
import apisData from '../data/apis.json'

// Mock API service for API endpoints
export const apiService = {
  getAllAPIs: (): APIEndpoint[] => {
    return apisData as APIEndpoint[]
  },

  getAPIById: (id: number): APIEndpoint | undefined => {
    const apis = apisData as APIEndpoint[]
    return apis.find(api => api.id === id)
  },

  getAPIsByService: (service: string): APIEndpoint[] => {
    const apis = apisData as APIEndpoint[]
    return apis.filter(api => api.service === service)
  },

  getAPIsByRisk: (riskLabel: string): APIEndpoint[] => {
    const apis = apisData as APIEndpoint[]
    return apis.filter(api => api.riskLabel === riskLabel)
  },

  searchAPIs: (query: string): APIEndpoint[] => {
    const apis = apisData as APIEndpoint[]
    const lowerQuery = query.toLowerCase()
    return apis.filter(api => 
      api.name.toLowerCase().includes(lowerQuery) || 
      api.endpoint.toLowerCase().includes(lowerQuery) ||
      api.service.toLowerCase().includes(lowerQuery)
    )
  },

  getStats: () => {
    const apis = apisData as APIEndpoint[]
    return {
      total: apis.length,
      critical: apis.filter(a => a.riskLabel === 'Critical').length,
      high: apis.filter(a => a.riskLabel === 'High').length,
      medium: apis.filter(a => a.riskLabel === 'Medium').length,
      low: apis.filter(a => a.riskLabel === 'Low').length,
      active: apis.filter(a => a.status === 'Active').length,
      deprecated: apis.filter(a => a.status === 'Deprecated').length
    }
  }
}
