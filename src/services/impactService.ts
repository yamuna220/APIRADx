import { uploadApi } from './uploadApi'

export const impactService = {
  getImpactData: async () => {
    return {
       predictions: [],
       overallRisk: 'Medium',
       topRiskArea: 'Authentication'
    }
  }
}
