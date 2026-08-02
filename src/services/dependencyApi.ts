const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export interface DependencyGraphResponse {
  nodes: any[]
  edges: any[]
  metadata: {
    totalNodes: number
    totalEdges: number
    criticalPaths: string[]
    circularDependencies: string[]
    disconnectedServices: string[]
    singlePointsOfFailure: string[]
  }
}

class DependencyApi {
  private getHeaders() {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async getDependencyGraph(specId: number): Promise<DependencyGraphResponse> {
    const response = await fetch(`${API_BASE}/api/specs/${specId}/dependency-graph`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch dependency graph')
    }

    return response.json()
  }
}

export const dependencyApi = new DependencyApi()
