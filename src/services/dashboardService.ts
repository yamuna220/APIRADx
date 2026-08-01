import { 
  OWASPDistribution, 
  TrendData, 
  RecentAnalysis, 
  VulnerableAPI, 
  AIInsight, 
  ActivityItem,
  UploadHistory 
} from '../types'
import dashboardData from '../data/dashboard.json'

// Mock service for dashboard data
export const dashboardService = {
  getKPISparkData: () => {
    return dashboardData.kpiSparkData
  },

  getOWASPDistribution: (): OWASPDistribution[] => {
    return dashboardData.owaspDistribution as OWASPDistribution[]
  },

  getTrendData: (): TrendData[] => {
    return dashboardData.trendData as TrendData[]
  },

  getRecentAnalysis: (): RecentAnalysis[] => {
    return dashboardData.recentAnalysis as RecentAnalysis[]
  },

  getVulnerableAPIs: (): VulnerableAPI[] => {
    return dashboardData.vulnerableAPIs as VulnerableAPI[]
  },

  getAIInsights: (): AIInsight[] => {
    return dashboardData.aiInsights as AIInsight[]
  },

  getActivityTimeline: (): ActivityItem[] => {
    return dashboardData.activityTimeline as ActivityItem[]
  },

  getUploadHistory: (): UploadHistory[] => {
    return dashboardData.uploadHistory as UploadHistory[]
  },

  getStats: () => {
    const dist = dashboardData.owaspDistribution as OWASPDistribution[]
    const trend = dashboardData.trendData as TrendData[]
    return {
      totalAPIs: 284,
      criticalIssues: dist.find(d => d.label === 'Critical')?.value || 0,
      securityScore: trend[trend.length - 1]?.value || 91,
      scoreTrend: trend.map(t => t.value),
      totalInsights: dashboardData.aiInsights.length,
      totalActivities: dashboardData.activityTimeline.length
    }
  }
}
