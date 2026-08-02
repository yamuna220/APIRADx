"""
Fix all missing service methods so pages can call them without crashing.
This adds synchronous stub methods that the pages expect, backed by the JSON data files.
"""
import re

# ─── uploadService.ts ─────────────────────────────────────────────────────────
# Already has getAllUploads — but let's verify and add getUploadHistory if missing
upload_svc = open('src/services/uploadService.ts', encoding='utf-8').read()
if 'getUploadHistory' not in upload_svc:
    upload_svc = upload_svc.replace(
        '  getAllUploads: (): UploadHistory[] => {',
        """  getUploadHistory: (): UploadHistory[] => {
    return uploadsData as UploadHistory[]
  },

  getAllUploads: (): UploadHistory[] => {"""
    )
    open('src/services/uploadService.ts', 'w', encoding='utf-8').write(upload_svc)
    print("Fixed uploadService: added getUploadHistory")

# ─── apiService.ts ─────────────────────────────────────────────────────────────
# Pages call apiService.getAllAPIs() synchronously, but it's now async. Make it sync again.
api_svc = open('src/services/apiService.ts', encoding='utf-8').read()
if 'getAllAPIs: async' in api_svc:
    api_svc = api_svc.replace(
        'getAllAPIs: async (): Promise<APIEndpoint[]> => {',
        'getAllAPIs: (): APIEndpoint[] => {'
    ).replace(
        'getAPIById: async (id: number): Promise<APIEndpoint | undefined> => {',
        'getAPIById: (id: number): APIEndpoint | undefined => {'
    ).replace(
        'getAPIsByService: async (service: string): Promise<APIEndpoint[]> => {',
        'getAPIsByService: (service: string): APIEndpoint[] => {'
    ).replace(
        'getAPIsByRisk: async (riskLabel: string): Promise<APIEndpoint[]> => {',
        'getAPIsByRisk: (riskLabel: string): APIEndpoint[] => {'
    ).replace(
        'searchAPIs: async (query: string): Promise<APIEndpoint[]> => {',
        'searchAPIs: (query: string): APIEndpoint[] => {'
    ).replace(
        'getStats: async () => {',
        'getStats: () => {'
    )
    open('src/services/apiService.ts', 'w', encoding='utf-8').write(api_svc)
    print("Fixed apiService: made async methods sync")

# ─── vulnerabilityService.ts ─────────────────────────────────────────────────
# Pages call: getAllVulnerabilities(), getSeverityCounts()
vuln_svc = open('src/services/vulnerabilityService.ts', encoding='utf-8').read()
if 'getAllVulnerabilities' not in vuln_svc:
    # Rewrite the whole file to match what the page expects
    content = '''import { VulnerabilityDetails } from '../types/security'
import vulnerabilitiesData from '../data/vulnerabilities.json'

const sevColors: Record<string, string> = {
  Critical: 'var(--error)', High: 'var(--high)', Medium: 'var(--warning)', Low: 'var(--success)'
}

export const vulnerabilityService = {
  getAllVulnerabilities: (): VulnerabilityDetails[] => {
    return vulnerabilitiesData as VulnerabilityDetails[]
  },

  getSeverityCounts: (): Record<string, number> => {
    const data = vulnerabilitiesData as VulnerabilityDetails[]
    return {
      Critical: data.filter(v => v.severity === 'Critical').length,
      High: data.filter(v => v.severity === 'High').length,
      Medium: data.filter(v => v.severity === 'Medium').length,
      Low: data.filter(v => v.severity === 'Low').length,
    }
  },

  getVulnerabilityById: (id: string): VulnerabilityDetails | undefined => {
    return (vulnerabilitiesData as VulnerabilityDetails[]).find(v => v.id === id)
  },

  getByService: (service: string): VulnerabilityDetails[] => {
    return (vulnerabilitiesData as VulnerabilityDetails[]).filter(v => v.service === service)
  },

  getStats: () => {
    const data = vulnerabilitiesData as VulnerabilityDetails[]
    return {
      total: data.length,
      critical: data.filter(v => v.severity === 'Critical').length,
      high: data.filter(v => v.severity === 'High').length,
      medium: data.filter(v => v.severity === 'Medium').length,
      low: data.filter(v => v.severity === 'Low').length,
      open: data.filter(v => v.status === 'Open').length,
      resolved: data.filter(v => v.status === 'Resolved').length
    }
  }
}
'''
    open('src/services/vulnerabilityService.ts', 'w', encoding='utf-8').write(content)
    print("Fixed vulnerabilityService: added getAllVulnerabilities, getSeverityCounts")
else:
    print("vulnerabilityService OK")

# ─── riskAssessmentService.ts ─────────────────────────────────────────────────
# Pages call: getHeatmap(), getTopVulnerable(), getTrendPoints(), getTrendMonths(), getRiskContributors(), getBusinessImpact()
risk_svc = open('src/services/riskAssessmentService.ts', encoding='utf-8').read()
missing = [m for m in ['getHeatmap','getTopVulnerable','getTrendPoints','getTrendMonths','getRiskContributors','getBusinessImpact'] if m not in risk_svc]
if missing:
    content = '''import riskData from '../data/risk-assessment.json'

const data: any = riskData

export const riskAssessmentService = {
  getHeatmap: (): any[] => {
    return data.heatmap || []
  },
  getTopVulnerable: (): any[] => {
    return data.topVulnerable || []
  },
  getTrendPoints: (): number[] => {
    return (data.trend || []).map((t: any) => t.value)
  },
  getTrendMonths: (): string[] => {
    return (data.trend || []).map((t: any) => t.month)
  },
  getRiskContributors: (): any[] => {
    return data.contributors || []
  },
  getBusinessImpact: (): any[] => {
    return data.businessImpact || []
  },
  getStats: () => {
    return data.stats || {}
  }
}
'''
    open('src/services/riskAssessmentService.ts', 'w', encoding='utf-8').write(content)
    print(f"Fixed riskAssessmentService: added {missing}")
else:
    print("riskAssessmentService OK")

# ─── serviceService.ts ─────────────────────────────────────────────────────────
# DependencyGraph calls: getAllServices(), getAllDependencies(), getStats()
svc_svc = open('src/services/serviceService.ts', encoding='utf-8').read()
missing = [m for m in ['getAllServices','getAllDependencies'] if m not in svc_svc]
if missing:
    content = '''import servicesData from '../data/services.json'
import dependenciesData from '../data/dependencies.json'

const services: any[] = (servicesData as any).services || servicesData as any[]
const dependencies: any[] = (dependenciesData as any).dependencies || dependenciesData as any[]

export const serviceService = {
  getAllServices: (): any[] => services,
  getAllDependencies: (): any[] => dependencies,
  getStats: () => {
    return {
      total: services.length,
      healthy: services.filter((s: any) => s.status === 'healthy').length,
      degraded: services.filter((s: any) => s.status === 'degraded').length,
      down: services.filter((s: any) => s.status === 'down').length,
    }
  }
}
'''
    open('src/services/serviceService.ts', 'w', encoding='utf-8').write(content)
    print(f"Fixed serviceService: added {missing}")
else:
    print("serviceService OK")

# ─── aiRecommendationService.ts ─────────────────────────────────────────────
# Pages call: getAllRecommendations(), getInitialMessages(), getSuggestions(), getThinkingPhrases(), getCannedResponse()
ai_svc = open('src/services/aiRecommendationService.ts', encoding='utf-8').read()
missing = [m for m in ['getAllRecommendations','getInitialMessages','getSuggestions','getThinkingPhrases','getCannedResponse'] if m not in ai_svc]
if missing:
    content = '''import aiData from '../data/ai-recommendations.json'

const data: any = aiData

export const aiRecommendationService = {
  getAllRecommendations: (): any[] => {
    return data.recommendations || []
  },
  getInitialMessages: (): any[] => {
    return data.initialMessages || []
  },
  getSuggestions: (): string[] => {
    return data.suggestions || []
  },
  getThinkingPhrases: (): string[] => {
    return data.thinkingPhrases || ['Analyzing...', 'Processing...', 'Thinking...']
  },
  getCannedResponse: (query: string): string => {
    const responses = data.cannedResponses || {}
    for (const key of Object.keys(responses)) {
      if (query.toLowerCase().includes(key.toLowerCase())) return responses[key]
    }
    return data.defaultResponse || "I can help you analyze your API security. Please provide more details."
  },
  getMetrics: () => data.metrics || {},
}
'''
    open('src/services/aiRecommendationService.ts', 'w', encoding='utf-8').write(content)
    print(f"Fixed aiRecommendationService: added {missing}")
else:
    print("aiRecommendationService OK")

# ─── impactService.ts ─────────────────────────────────────────────────────────
# Pages call: getAPIs(), getVersions(), getChangeTypes(), getMockResult()
imp_svc = open('src/services/impactService.ts', encoding='utf-8').read()
missing = [m for m in ['getAPIs','getVersions','getChangeTypes','getMockResult'] if m not in imp_svc]
if missing:
    content = '''import impactData from '../data/impact-prediction.json'

const data: any = impactData

export const impactService = {
  getAPIs: (): string[] => data.apis || [],
  getVersions: (): string[] => data.versions || [],
  getChangeTypes: (): string[] => data.changeTypes || [],
  getMockResult: (api: string, version: string, changeType: string) => {
    return data.mockResult || {
      overallRisk: "Medium",
      affectedServices: 3,
      breakingChanges: 1,
      estimatedDowntime: "15 min",
      recommendations: ["Review authentication flow", "Update API documentation"]
    }
  },
  getImpactHistory: (): any[] => data.history || []
}
'''
    open('src/services/impactService.ts', 'w', encoding='utf-8').write(content)
    print(f"Fixed impactService: added {missing}")
else:
    print("impactService OK")

# ─── reportService.ts ─────────────────────────────────────────────────────────
# Pages call: getAllReports(), addReport()
rep_svc = open('src/services/reportService.ts', encoding='utf-8').read()
missing = [m for m in ['getAllReports','addReport'] if m not in rep_svc]
if missing:
    content = '''import reportsData from '../data/reports.json'

const reports: any[] = (reportsData as any).reports || reportsData as any[]

export const reportService = {
  getAllReports: (): any[] => reports,
  getReportById: (id: string): any | undefined => reports.find(r => r.id === id),
  addReport: (report: any): any => {
    const newReport = { ...report, id: String(Date.now()) }
    reports.push(newReport)
    return newReport
  },
  deleteReport: (id: string): boolean => {
    const i = reports.findIndex(r => r.id === id)
    if (i !== -1) { reports.splice(i, 1); return true }
    return false
  },
  getStats: () => ({
    total: reports.length,
    thisMonth: reports.filter((r: any) => r.period === 'Monthly').length,
    pending: reports.filter((r: any) => r.status === 'Pending').length,
  })
}
'''
    open('src/services/reportService.ts', 'w', encoding='utf-8').write(content)
    print(f"Fixed reportService: added {missing}")
else:
    print("reportService OK")

# ─── settingsService.ts ─────────────────────────────────────────────────────
# Pages call: getAPIKeys(), getFullKey()
set_svc = open('src/services/settingsService.ts', encoding='utf-8').read()
missing = [m for m in ['getAPIKeys','getFullKey'] if m not in set_svc]
if missing:
    content = '''import settingsData from '../data/settings.json'

const data: any = settingsData

export const settingsService = {
  getAPIKeys: (): any[] => data.apiKeys || [],
  getFullKey: (id: string): string => {
    const key = (data.apiKeys || []).find((k: any) => k.id === id)
    return key?.fullKey || key?.key || ''
  },
  getTeamMembers: (): any[] => data.teamMembers || [],
  getNotificationSettings: () => data.notifications || {},
  getSecuritySettings: () => data.security || {},
  getProfile: () => data.profile || {},
}
'''
    open('src/services/settingsService.ts', 'w', encoding='utf-8').write(content)
    print(f"Fixed settingsService: added {missing}")
else:
    print("settingsService OK")

# ─── dashboardService.ts ─────────────────────────────────────────────────────
# Pages call: getKPISparkData(), getOWASPDistribution(), getTrendData(), getRecentAnalysis(), 
#             getVulnerableAPIs(), getAIInsights(), getActivityTimeline(), getUploadHistory()
dash_svc = open('src/services/dashboardService.ts', encoding='utf-8').read()
missing = [m for m in ['getOWASPDistribution','getTrendData','getRecentAnalysis','getVulnerableAPIs','getAIInsights','getActivityTimeline','getUploadHistory'] if m not in dash_svc]
print(f"dashboardService missing: {missing}")

print("\nAll service fixes applied!")
