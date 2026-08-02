const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export interface RiskAssessmentResponse {
  overallScore: number
  severity: string
  trend: string
  breakdown: any[]
  topContributors: any[]
}

class RiskApi {
  private getHeaders() {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async getRiskAssessment(specId: number): Promise<RiskAssessmentResponse> {
    const response = await fetch(`${API_BASE}/api/specs/${specId}/risk`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch risk assessment')
    }

    return response.json()
  }
}

export const riskApi = new RiskApi()
