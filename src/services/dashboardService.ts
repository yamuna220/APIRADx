import { 
  OWASPDistribution, 
  TrendData, 
  RecentAnalysis, 
  VulnerableAPI, 
  AIInsight, 
  ActivityItem,
  UploadHistory 
} from '../types'
import { uploadApi } from './uploadApi'
import { SecurityFinding } from '../types/security'

// Dynamic service for dashboard data fetching from real backend
export const dashboardService = {
  getKPISparkData: () => {
    // Generate static looking sparklines for now, or build dynamically if historical data exists
    return {
      apis: [210, 225, 238, 245, 256, 268, 275, 284],
      critical: [42, 38, 35, 28, 22, 18, 15, 12],
      score: [65, 68, 72, 78, 82, 85, 88, 91],
      insights: [15, 18, 24, 21, 28, 32, 36, 42]
    }
  },

  getDashboardData: async () => {
    let specs = []
    try {
        specs = await uploadApi.getSpecs()
    } catch (err) {
        console.error("Backend fetch failed, using fallback:", err)
    }
    
    let totalCritical = 0
    let totalHigh = 0
    let totalMedium = 0
    let totalLow = 0
    
    let vulnerableAPIs: VulnerableAPI[] = []
    let aiInsights: AIInsight[] = []
    let recentAnalysis: RecentAnalysis[] = []
    let uploadHistory: UploadHistory[] = []
    
    let allFindings: SecurityFinding[] = []

    for (const spec of specs) {
        try {
            const security = await uploadApi.getSecurityAnalysis(spec.id)
            totalCritical += security.summary.criticalCount
            totalHigh += security.summary.highCount
            totalMedium += security.summary.mediumCount
            totalLow += security.summary.lowCount
            
            allFindings = [...allFindings, ...security.findings]
            
            // Populate recent analysis
            if (security.findings.length > 0) {
                const finding = security.findings[0]
                recentAnalysis.push({
                    name: finding.affectedEndpoint || spec.name,
                    service: spec.name,
                    method: finding.affectedMethod || 'GET',
                    auth: 'OAuth2',
                    owner: 'System',
                    risk: finding.severity,
                    status: finding.severity === 'Critical' || finding.severity === 'High' ? 'Vulnerable' : 'Reviewing',
                    scan: new Date().toISOString().split('T')[0]
                })
            }
            
            // Populate vulnerable APIs
            if (security.summary.criticalCount > 0 || security.summary.highCount > 0) {
                vulnerableAPIs.push({
                    name: spec.name,
                    service: spec.name,
                    score: Math.min(10, (security.summary.criticalCount * 2) + security.summary.highCount),
                    delta: 'down',
                    trend: []
                })
            }
            
            uploadHistory.push({
                name: spec.file_name,
                size: spec.size,
                time: spec.uploadedAt
            })
            
        } catch (e) {
            console.error("Failed to fetch security for spec", spec.id)
        }
    }
    
    // Aggregate OWASP
    const owaspMap = new Map<string, number>()
    allFindings.forEach(f => {
        const cat = f.owaspCategory || 'Other'
        owaspMap.set(cat, (owaspMap.get(cat) || 0) + 1)
    })
    
    const owaspDistribution: OWASPDistribution[] = Array.from(owaspMap.entries()).map(([label, value], i) => {
        const colors = ['var(--error)', 'var(--high)', 'var(--warning)', 'var(--info)', '#A78BFA']
        return {
            label: label.split('-')[1] || label,
            value,
            pct: Math.round((value / Math.max(1, allFindings.length)) * 100),
            color: colors[i % colors.length]
        }
    })

    const totalRisks = totalCritical + totalHigh + totalMedium + totalLow
    const score = Math.max(0, 100 - totalCritical * 10 - totalHigh * 5)
    
    // Sort and limit
    vulnerableAPIs.sort((a, b) => b.score - a.score)
    vulnerableAPIs = vulnerableAPIs.slice(0, 5)
    
    // Mock AI Insights based on findings
    allFindings.filter(f => f.severity === 'Critical').slice(0, 5).forEach(f => {
        aiInsights.push({
            sev: f.severity,
            text: f.title,
            impact: f.businessImpact,
            fix: f.suggestedFix,
            time: '30 mins',
            action: 'Apply Fix'
        })
    })

    return {
        stats: {
            totalAPIs: specs.length,
            criticalIssues: totalCritical,
            securityScore: score,
            totalInsights: aiInsights.length,
            riskScore: (totalCritical > 0 ? 8.5 : (totalHigh > 0 ? 5.2 : 2.1)),
            totalActivities: 5
        },
        owaspDistribution: owaspDistribution.length > 0 ? owaspDistribution : [{label: 'Secure', value: 1, pct: 100, color: 'var(--success)'}],
        vulnerableAPIs,
        recentAnalysis,
        aiInsights,
        uploadHistory,
        activityTimeline: []
    }
  }
}
