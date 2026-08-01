const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export interface UploadSpecData {
  name: string
  version?: string
  description?: string
  file: File
}

export interface UploadSpecResponse {
  id: number
  name: string
  file_name: string
  file_size: number
  status: string
  endpoints_count: number
  created_at: string
  size: string
  uploadedAt: string
  risks: number
}

class UploadApi {
  private getHeaders() {
    const token = localStorage.getItem('access_token')
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async uploadSpec(data: UploadSpecData): Promise<UploadSpecResponse> {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('name', data.name)
    if (data.version) formData.append('version', data.version)
    if (data.description) formData.append('description', data.description)

    const response = await fetch(`${API_BASE}/api/specs/upload`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Upload failed')
    }

    return response.json()
  }

  async getSpecs(): Promise<UploadSpecResponse[]> {
    const response = await fetch(`${API_BASE}/api/specs`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch specs')
    }

    return response.json()
  }

  async getSpec(specId: number): Promise<UploadSpecResponse> {
    const response = await fetch(`${API_BASE}/api/specs/${specId}`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch spec')
    }

    return response.json()
  }

  async deleteSpec(specId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/api/specs/${specId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to delete spec')
    }

    return response.json()
  }

  async getSecurityAnalysis(specId: number) {
    const response = await fetch(`${API_BASE}/api/specs/${specId}/security`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch security analysis')
    }

    return response.json()
  }

  async getRiskAssessment(specId: number) {
    const response = await fetch(`${API_BASE}/api/specs/${specId}/risk`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch risk assessment')
    }

    return response.json()
  }

  async getDependencyGraph(specId: number) {
    const response = await fetch(`${API_BASE}/api/specs/${specId}/dependency-graph`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch dependency graph')
    }

    return response.json()
  }

  async getAIRecommendations(specId: number) {
    const response = await fetch(`${API_BASE}/api/specs/${specId}/ai-recommendations`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch AI recommendations')
    }

    return response.json()
  }
}

export const uploadApi = new UploadApi()
