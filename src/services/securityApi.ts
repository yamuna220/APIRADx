const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export interface SecurityFinding {
  id: string
  title: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  owasp: string
  endpoint: string
  affected: number
  cvss: number
  description: string
  impact: string
  fix: string
  technical: string
}

export interface SecurityAnalysisResponse {
  findings: SecurityFinding[]
  summary: {
    totalFindings: number
    criticalCount: number
    highCount: number
    mediumCount: number
    lowCount: number
    riskScore: number | null
  }
  timestamp: string
  specId: string
}

class SecurityApi {
  private getHeaders() {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async getSecurityAnalysis(specId: number): Promise<SecurityAnalysisResponse> {
    const response = await fetch(`${API_BASE}/api/specs/${specId}/security`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch security analysis')
    }

    return response.json()
  }

  async getSeverityCounts(specId: number): Promise<Record<string, number>> {
    const analysis = await this.getSecurityAnalysis(specId)
    return {
      Critical: analysis.summary.criticalCount,
      High: analysis.summary.highCount,
      Medium: analysis.summary.mediumCount,
      Low: analysis.summary.lowCount
    }
  }
}

export const securityApi = new SecurityApi()
