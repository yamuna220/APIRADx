const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export interface DashboardStats {
  totalAPIs: number
  criticalAPIs: number
  totalEndpoints: number
  totalRisks: number
  avgRiskScore: number
}

class DashboardApi {
  private getHeaders() {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async getStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE}/api/dashboard/stats`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch dashboard stats')
    }

    return response.json()
  }
}

export const dashboardApi = new DashboardApi()
