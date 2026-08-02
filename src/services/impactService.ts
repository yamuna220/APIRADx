import impactData from '../data/impact-prediction.json'

interface AffectedService {
  name: string
  impact: 'Critical' | 'High' | 'Medium' | 'Low'
  reason: string
}

interface DownstreamAPI {
  path: string
  consumers: number
}

interface BusinessImpact {
  area: string
  severity: string
  detail: string
}

interface ImpactResult {
  affectedServices: AffectedService[]
  downstreamAPIs: DownstreamAPI[]
  businessImpact: BusinessImpact[]
  deploymentRisk: 'Critical' | 'High' | 'Medium' | 'Low'
  recommendedTests: string[]
  chain: string[]
}

// Async service for impact prediction with fallback to mock
export const impactService = {
  getAPIs: async (): Promise<string[]> => {
    // Return mock data for now (backend doesn't provide this yet)
    return impactData.apis as string[]
  },

  getVersions: async (): Promise<string[]> => {
    // Return mock data for now (backend doesn't provide this yet)
    return impactData.versions as string[]
  },

  getChangeTypes: async (): Promise<string[]> => {
    // Return mock data for now (backend doesn't provide this yet)
    return impactData.changeTypes as string[]
  },

  getMockResult: async (): Promise<ImpactResult> => {
    // Return mock data for now (backend doesn't provide this yet)
    return impactData.mockResult as ImpactResult
  }
}
