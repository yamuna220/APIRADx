import { Report } from '../types'
import reportsData from '../data/reports.json'
import { generateSecurityReport, exportReport } from '../utils/reportGenerator'
import { SecurityAnalysisResult } from '../types/security'
import { RiskScoreResult } from '../types/risk'
import { DependencyGraph } from '../types/dependency'
import { AIRecommendation } from '../types/ai'
import { LegacyParsedAPISpec } from '../utils/openapiParser'
import { ReportGenerationOptions, ExportResult, SecurityReport, ReportFormat } from '../types/report'

// Mock service for reports
export const reportService = {
  getAllReports: (): Report[] => {
    return reportsData as Report[]
  },

  getReportById: (id: number): Report | undefined => {
    const reports = reportsData as Report[]
    return reports.find(r => r.id === id)
  },

  getReportsByType: (type: string): Report[] => {
    const reports = reportsData as Report[]
    return reports.filter(r => r.type === type)
  },

  getStats: () => {
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
  generateSecurityReport: (
    spec: LegacyParsedAPISpec,
    securityResult: SecurityAnalysisResult,
    riskScore: RiskScoreResult,
    dependencyGraph: DependencyGraph,
    aiRecommendations: AIRecommendation[],
    options?: Partial<ReportGenerationOptions>
  ): SecurityReport => {
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
  exportReport: (report: SecurityReport, format: ReportFormat): ExportResult => {
    return exportReport(report, format)
  },

  // Delete a report by ID
  deleteReport: (id: string): void => {
    const reports = reportsData as Report[]
    const index = reports.findIndex(r => r.id.toString() === id)
    if (index !== -1) {
      reports.splice(index, 1)
    }
  },

  // Rename a report
  renameReport: (id: string, newName: string): void => {
    const reports = reportsData as Report[]
    const report = reports.find(r => r.id.toString() === id)
    if (report) {
      report.name = newName
    }
  },

  // Add a new report
  addReport: (report: Report): void => {
    const reports = reportsData as Report[]
    reports.push(report)
  },

  // Generate and export report in one step
  generateAndExportReport: (
    spec: LegacyParsedAPISpec,
    securityResult: SecurityAnalysisResult,
    riskScore: RiskScoreResult,
    dependencyGraph: DependencyGraph,
    aiRecommendations: AIRecommendation[],
    format: ReportFormat,
    options?: Partial<ReportGenerationOptions>
  ): ExportResult => {
    const report = reportService.generateSecurityReport(
      spec,
      securityResult,
      riskScore,
      dependencyGraph,
      aiRecommendations,
      { ...options, format }
    )
    return reportService.exportReport(report, format)
  }
}
