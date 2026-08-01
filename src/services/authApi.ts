const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export interface LoginResponse {
  access_token: string
  refresh_token?: string
  token_type: string
}

export interface User {
  id: number
  email: string
  username: string
  full_name?: string
  organization?: string
  role: string
  profile_image?: string
  email_verified: boolean
  is_active: boolean
  is_superuser: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

export interface RegisterData {
  email: string
  username: string
  full_name?: string
  organization?: string
  password: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  new_password: string
  confirm_password: string
}

class AuthApi {
  private getHeaders() {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async register(data: RegisterData): Promise<User> {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Registration failed')
    }

    return response.json()
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)

    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Login failed')
    }

    const data = await response.json()
    
    // Store tokens
    localStorage.setItem('access_token', data.access_token)
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token)
    }
    
    return data
  }

  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders(),
    })

    // Clear tokens regardless of response
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Logout failed')
    }
  }

  async refreshAccessToken(): Promise<LoginResponse> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const formData = new FormData()
    formData.append('refresh_token', refreshToken)

    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      // Clear tokens if refresh fails
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      const error = await response.json()
      throw new Error(error.detail || 'Token refresh failed')
    }

    const data = await response.json()
    
    // Update tokens
    localStorage.setItem('access_token', data.access_token)
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token)
    }
    
    return data
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: this.getHeaders(),
    })

    if (response.status === 401) {
      // Token expired, try refresh
      try {
        await this.refreshAccessToken()
        // Retry with new token
        const retryResponse = await fetch(`${API_BASE}/api/auth/me`, {
          headers: this.getHeaders(),
        })
        if (!retryResponse.ok) {
          const error = await retryResponse.json()
          throw new Error(error.detail || 'Failed to fetch user')
        }
        return retryResponse.json()
      } catch (refreshError) {
        // Refresh failed, clear tokens
        this.logoutLocal()
        throw new Error('Session expired. Please login again.')
      }
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch user')
    }

    return response.json()
  }

  async updateUser(data: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to update user')
    }

    return response.json()
  }

  async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to send reset email')
    }

    return response.json()
  }

  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to reset password')
    }

    return response.json()
  }

  async verifyEmail(token: string): Promise<{ message: string; email: string }> {
    const response = await fetch(`${API_BASE}/api/auth/verify-email?token=${token}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to verify email')
    }

    return response.json()
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token')
  }

  logoutLocal(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

export const authApi = new AuthApi()
