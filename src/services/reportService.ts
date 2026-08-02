import { Report } from '../types'
import reportsData from '../data/reports.json'
import { generateSecurityReport, exportReport } from '../utils/reportGenerator'
import { SecurityAnalysisResult } from '../types/security'
import { RiskScoreResult } from '../types/risk'
import { DependencyGraph } from '../types/dependency'
import { AIRecommendation } from '../types/ai'
import { LegacyParsedAPISpec } from '../utils/openapiParser'
import { ReportGenerationOptions, ExportResult, SecurityReport, ReportFormat } from '../types/report'
import { reportsApi } from './reportsApi'

// Async service for reports with fallback to mock
export const reportService = {
  getAllReports: async (): Promise<Report[]> => {
    // Return mock data for now (backend provides this via reports API)
    return reportsData as Report[]
  },

  getReportById: async (id: number): Promise<Report | undefined> => {
    const reports = reportsData as Report[]
    return reports.find(r => r.id === id)
  },

  getReportsByType: async (type: string): Promise<Report[]> => {
    const reports = reportsData as Report[]
    return reports.filter(r => r.type === type)
  },

  getStats: async () => {
    const reports = reportsData as Report[]
    return {
      total: reports.length,
      executive: reports.filter(r => r.type === 'Executive').length,
      technical: reports.filter(r => r.type === 'Technical').length,
      audit: reports.filter(r => r.type === 'Audit').length,
      compliance: reports.filter(r => r.type === 'Compliance').length
    }
  },

  // Generate a comprehensive security report
  generateSecurityReport: async (
    spec: LegacyParsedAPISpec,
    securityResult: SecurityAnalysisResult,
    riskScore: RiskScoreResult,
    dependencyGraph: DependencyGraph,
    aiRecommendations: AIRecommendation[],
    options?: Partial<ReportGenerationOptions>
  ): Promise<SecurityReport> => {
    const defaultOptions: ReportGenerationOptions = {
      includeExecutiveSummary: true,
      includeSecurityFindings: true,
      includeRiskScore: true,
      includeOWASPMapping: true,
      includeDependencyGraph: true,
      includeAIRecommendations: true,
      format: 'pdf',
      reportType: 'executive'
    }

    const mergedOptions = { ...defaultOptions, ...options }
    return generateSecurityReport(spec, securityResult, riskScore, dependencyGraph, aiRecommendations, mergedOptions)
  },

  // Export report to specified format
  exportReport: async (report: SecurityReport, format: ReportFormat): Promise<ExportResult> => {
    return exportReport(report, format)
  },

  // Delete a report by ID (uses backend API)
  deleteReport: async (id: string): Promise<void> => {
    try {
      await reportsApi.deleteReport(id)
    } catch (error) {
      console.error('Failed to delete report via API, using fallback:', error)
      // Fallback to mock deletion
      const reports = reportsData as Report[]
      const index = reports.findIndex(r => r.id.toString() === id)
      if (index !== -1) {
        reports.splice(index, 1)
      }
    }
  },

  // Rename a report (uses backend API)
  renameReport: async (id: string, newName: string): Promise<void> => {
    try {
      await reportsApi.updateReport(id, { name: newName })
    } catch (error) {
      console.error('Failed to rename report via API, using fallback:', error)
      // Fallback to mock rename
      const reports = reportsData as Report[]
      const report = reports.find(r => r.id.toString() === id)
      if (report) {
        report.name = newName
      }
    }
  },

  // Add a new report
  addReport: async (report: Report): Promise<void> => {
    const reports = reportsData as Report[]
    reports.push(report)
  },

  // Generate and export report in one step
  generateAndExportReport: async (
    spec: LegacyParsedAPISpec,
    securityResult: SecurityAnalysisResult,
    riskScore: RiskScoreResult,
    dependencyGraph: DependencyGraph,
    aiRecommendations: AIRecommendation[],
    format: ReportFormat,
    options?: Partial<ReportGenerationOptions>
  ): Promise<ExportResult> => {
    const report = await reportService.generateSecurityReport(
      spec,
      securityResult,
      riskScore,
      dependencyGraph,
      aiRecommendations,
      { ...options, format }
    )
    return await reportService.exportReport(report, format)
  }
}
