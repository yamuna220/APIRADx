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

// Mock service for impact prediction
export const impactService = {
  getAPIs: (): string[] => {
    return impactData.apis as string[]
  },

  getVersions: (): string[] => {
    return impactData.versions as string[]
  },

  getChangeTypes: (): string[] => {
    return impactData.changeTypes as string[]
  },

  getMockResult: (): ImpactResult => {
    return impactData.mockResult as ImpactResult
  }
}
