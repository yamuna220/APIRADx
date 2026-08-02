import { RiskHeatmapRow } from '../types'
import riskAssessmentData from '../data/risk-assessment.json'
import { riskApi } from './riskApi'

// Async service for risk assessment data with fallback to mock
export const riskAssessmentService = {
  getHeatmap: async (): Promise<RiskHeatmapRow[]> => {
    // Return mock data for now (backend doesn't provide this yet)
    return riskAssessmentData.heatmap as RiskHeatmapRow[]
  },

  getTopVulnerable: async () => {
    // Return mock data for now (backend doesn't provide this yet)
    return riskAssessmentData.topVulnerable
  },

  getTrendPoints: async (): Promise<number[]> => {
    // Return mock data for now (backend doesn't provide this yet)
    return riskAssessmentData.trendPoints
  },

  getTrendMonths: async (): Promise<string[]> => {
    // Return mock data for now (backend doesn't provide this yet)
    return riskAssessmentData.trendMonths
  },

  getRiskContributors: async () => {
    // Return mock data for now (backend doesn't provide this yet)
    return riskAssessmentData.riskContributors
  },

  getBusinessImpact: async () => {
    // Return mock data for now (backend doesn't provide this yet)
    return riskAssessmentData.businessImpact
  },

  getStats: async () => {
    // Return mock data for now (backend doesn't provide this yet)
    const heatmap = riskAssessmentData.heatmap as RiskHeatmapRow[]
    return {
      totalServices: heatmap.length,
      totalCritical: heatmap.reduce((sum, row) => sum + row.critical, 0),
      totalHigh: heatmap.reduce((sum, row) => sum + row.high, 0),
      totalMedium: heatmap.reduce((sum, row) => sum + row.medium, 0),
      totalLow: heatmap.reduce((sum, row) => sum + row.low, 0),
      currentScore: riskAssessmentData.trendPoints[riskAssessmentData.trendPoints.length - 1],
      scoreChange: riskAssessmentData.trendPoints[riskAssessmentData.trendPoints.length - 1] - riskAssessmentData.trendPoints[0]
    }
  }
}
