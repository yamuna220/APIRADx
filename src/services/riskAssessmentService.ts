import { RiskHeatmapRow } from '../types'
import riskAssessmentData from '../data/risk-assessment.json'

// Mock service for risk assessment data
export const riskAssessmentService = {
  getHeatmap: (): RiskHeatmapRow[] => {
    return riskAssessmentData.heatmap as RiskHeatmapRow[]
  },

  getTopVulnerable: () => {
    return riskAssessmentData.topVulnerable
  },

  getTrendPoints: (): number[] => {
    return riskAssessmentData.trendPoints
  },

  getTrendMonths: (): string[] => {
    return riskAssessmentData.trendMonths
  },

  getRiskContributors: () => {
    return riskAssessmentData.riskContributors
  },

  getBusinessImpact: () => {
    return riskAssessmentData.businessImpact
  },

  getStats: () => {
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
