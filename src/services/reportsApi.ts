// Mock Reports API Service
// Simulates FastAPI backend endpoints for report management

import { Report } from '../types'
import { exportReport } from '../utils/reportGenerator'

export interface ReportShareOptions {
  method: 'link' | 'email' | 'workspace'
  email?: string
  workspaceId?: string
  expiresIn?: number // hours
}

export interface ShareLinkResponse {
  link: string
  expiresAt: string
  token: string
}

export interface ReportUpdateData {
  name?: string
  description?: string
  tags?: string[]
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Simulated database
let reportsDatabase: Report[] = []
let shareLinks: Map<string, ShareLinkResponse> = new Map()

// Helper function to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function to simulate random errors (10% chance)
const simulateError = () => {
  if (Math.random() < 0.1) {
    throw new Error('Network error: Failed to connect to server')
  }
}

export const reportsApi = {
  // GET /reports
  async getAllReports(): Promise<APIResponse<Report[]>> {
    try {
      await delay(300)
      simulateError()
      
      return {
        success: true,
        data: reportsDatabase
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reports'
      }
    }
  },

  // GET /reports/{id}
  async getReportById(id: string): Promise<APIResponse<Report>> {
    try {
      await delay(200)
      simulateError()
      
      const report = reportsDatabase.find(r => r.id.toString() === id)
      if (!report) {
        return {
          success: false,
          error: 'Report not found'
        }
      }
      
      return {
        success: true,
        data: report
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch report'
      }
    }
  },

  // GET /reports/{id}/pdf
  async generatePDF(id: string): Promise<APIResponse<{ content: string; filename: string }>> {
    try {
      await delay(1500) // Simulate PDF generation time
      simulateError()
      
      const report = reportsDatabase.find(r => r.id.toString() === id)
      if (!report) {
        return {
          success: false,
          error: 'Report not found'
        }
      }

      // Transform report data to match SecurityReport interface
      const securityReport = {
        executiveSummary: report.summary,
        securityFindings: report.findings || [],
        riskScore: report.riskScore,
        owaspMapping: report.owaspMapping || [],
        dependencyGraph: report.dependencyGraph,
        aiRecommendations: report.aiRecommendations || [],
        metadata: {
          reportId: report.id.toString(),
          generatedAt: report.metadata?.generatedAt || new Date().toISOString(),
          generatedBy: report.metadata?.generatedBy || 'system',
          specId: report.metadata?.specId || 'unknown',
          specName: report.metadata?.specName || report.name,
          specVersion: report.metadata?.specVersion || '1.0.0',
          reportType: 'executive' as const,
          format: 'pdf' as const
        }
      }

      // Generate PDF content
      const pdfResult = await exportReport(securityReport as any, 'pdf')
      
      if (!pdfResult.success) {
        return {
          success: false,
          error: pdfResult.error || 'Failed to generate PDF'
        }
      }

      const filename = `APIRADx_${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`
      
      return {
        success: true,
        data: {
          content: pdfResult.data as string,
          filename
        },
        message: 'PDF generated successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate PDF'
      }
    }
  },

  // GET /reports/{id}/csv
  async generateCSV(id: string): Promise<APIResponse<{ content: string; filename: string }>> {
    try {
      await delay(800) // Simulate CSV generation time
      simulateError()
      
      const report = reportsDatabase.find(r => r.id.toString() === id)
      if (!report) {
        return {
          success: false,
          error: 'Report not found'
        }
      }

      // Transform report data to match SecurityReport interface
      const securityReport = {
        executiveSummary: report.summary,
        securityFindings: report.findings || [],
        riskScore: report.riskScore,
        owaspMapping: report.owaspMapping || [],
        dependencyGraph: report.dependencyGraph,
        aiRecommendations: report.aiRecommendations || [],
        metadata: {
          reportId: report.id.toString(),
          generatedAt: report.metadata?.generatedAt || new Date().toISOString(),
          generatedBy: report.metadata?.generatedBy || 'system',
          specId: report.metadata?.specId || 'unknown',
          specName: report.metadata?.specName || report.name,
          specVersion: report.metadata?.specVersion || '1.0.0',
          reportType: 'executive' as const,
          format: 'csv' as const
        }
      }

      // Generate CSV content
      const csvResult = await exportReport(securityReport as any, 'csv')
      
      if (!csvResult.success) {
        return {
          success: false,
          error: csvResult.error || 'Failed to generate CSV'
        }
      }

      const filename = `APIRADx_${report.name.replace(/\s+/g, '_')}_analysis_${new Date().toISOString().split('T')[0]}.csv`
      
      return {
        success: true,
        data: {
          content: csvResult.data as string,
          filename
        },
        message: 'CSV generated successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate CSV'
      }
    }
  },

  // PUT /reports/{id}
  async updateReport(id: string, data: ReportUpdateData): Promise<APIResponse<Report>> {
    try {
      await delay(400)
      simulateError()
      
      const reportIndex = reportsDatabase.findIndex(r => r.id.toString() === id)
      if (reportIndex === -1) {
        return {
          success: false,
          error: 'Report not found'
        }
      }

      // Update report
      const updatedReport = {
        ...reportsDatabase[reportIndex],
        ...data
      }
      reportsDatabase[reportIndex] = updatedReport
      
      return {
        success: true,
        data: updatedReport,
        message: 'Report updated successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update report'
      }
    }
  },

  // DELETE /reports/{id}
  async deleteReport(id: string): Promise<APIResponse<void>> {
    try {
      await delay(500)
      simulateError()
      
      const reportIndex = reportsDatabase.findIndex(r => r.id.toString() === id)
      if (reportIndex === -1) {
        return {
          success: false,
          error: 'Report not found'
        }
      }

      reportsDatabase.splice(reportIndex, 1)
      
      return {
        success: true,
        message: 'Report deleted successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete report'
      }
    }
  },

  // POST /reports/{id}/share
  async shareReport(id: string, options: ReportShareOptions): Promise<APIResponse<ShareLinkResponse>> {
    try {
      await delay(600)
      simulateError()
      
      const report = reportsDatabase.find(r => r.id.toString() === id)
      if (!report) {
        return {
          success: false,
          error: 'Report not found'
        }
      }

      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const expiresAt = new Date(Date.now() + (options.expiresIn || 24) * 60 * 60 * 1000).toISOString()
      const link = `${window.location.origin}/reports/${id}/share/${token}`

      const shareResponse: ShareLinkResponse = {
        link,
        expiresAt,
        token
      }

      shareLinks.set(token, shareResponse)
      
      return {
        success: true,
        data: shareResponse,
        message: 'Share link generated successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate share link'
      }
    }
  },

  // Helper: Download file from content
  downloadFile(content: string, filename: string, mimeType: string): void {
    try {
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  },

  // Helper: Copy to clipboard
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }
}
