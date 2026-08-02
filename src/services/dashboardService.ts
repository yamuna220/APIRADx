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
import { dashboardApi } from './dashboardApi'

// Async service for dashboard data with fallback to mock
export const dashboardService = {
  getKPISparkData: async () => {
    try {
      const stats = await dashboardApi.getStats()
      // Return mock spark data for now (backend doesn't provide this yet)
      return dashboardData.kpiSparkData
    } catch (error) {
      console.error('Failed to fetch KPI spark data, using fallback:', error)
      return dashboardData.kpiSparkData
    }
  },

  getOWASPDistribution: async (): Promise<OWASPDistribution[]> => {
    try {
      const stats = await dashboardApi.getStats()
      // Return mock OWASP distribution for now (backend doesn't provide this yet)
      return dashboardData.owaspDistribution as OWASPDistribution[]
    } catch (error) {
      console.error('Failed to fetch OWASP distribution, using fallback:', error)
      return dashboardData.owaspDistribution as OWASPDistribution[]
    }
  },

  getTrendData: async (): Promise<TrendData[]> => {
    try {
      const stats = await dashboardApi.getStats()
      // Return mock trend data for now (backend doesn't provide this yet)
      return dashboardData.trendData as TrendData[]
    } catch (error) {
      console.error('Failed to fetch trend data, using fallback:', error)
      return dashboardData.trendData as TrendData[]
    }
  },

  getRecentAnalysis: async (): Promise<RecentAnalysis[]> => {
    // Return mock data for now (backend doesn't provide this yet)
    return dashboardData.recentAnalysis as RecentAnalysis[]
  },

  getVulnerableAPIs: async (): Promise<VulnerableAPI[]> => {
    // Return mock data for now (backend doesn't provide this yet)
    return dashboardData.vulnerableAPIs as VulnerableAPI[]
  },

  getAIInsights: async (): Promise<AIInsight[]> => {
    // Return mock data for now (backend doesn't provide this yet)
    return dashboardData.aiInsights as AIInsight[]
  },

  getActivityTimeline: async (): Promise<ActivityItem[]> => {
    // Return mock data for now (backend doesn't provide this yet)
    return dashboardData.activityTimeline as ActivityItem[]
  },

  getUploadHistory: async (): Promise<UploadHistory[]> => {
    // Return mock data for now (backend doesn't provide this yet)
    // Cast through unknown to handle type mismatch
    return dashboardData.uploadHistory as unknown as UploadHistory[]
  },

  getStats: async () => {
    try {
      const stats = await dashboardApi.getStats()
      const dist = dashboardData.owaspDistribution as OWASPDistribution[]
      const trend = dashboardData.trendData as TrendData[]
      return {
        totalAPIs: stats.totalAPIs,
        criticalIssues: stats.criticalAPIs,
        securityScore: Math.round(stats.avgRiskScore),
        scoreTrend: trend.map(t => t.value),
        totalInsights: dashboardData.aiInsights.length,
        totalActivities: dashboardData.activityTimeline.length
      }
    } catch (error) {
      console.error('Failed to fetch stats, using fallback:', error)
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
}
