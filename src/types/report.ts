// Report generation types for downloadable security reports

export type ReportFormat = 'pdf' | 'csv'
export type ReportType = 'executive' | 'technical' | 'audit' | 'compliance'

export interface ExecutiveSummary {
  title: string
  generatedAt: string
  specName: string
  specVersion: string
  overallRiskScore: number
  overallSeverity: string
  totalEndpoints: number
  totalFindings: number
  criticalFindings: number
  highFindings: number
  mediumFindings: number
  lowFindings: number
  keyRisks: string[]
  recommendations: string[]
}

export interface SecurityFindingReport {
  id: string
  title: string
  severity: string
  owaspCategory: string
  affectedEndpoint: string
  affectedMethod: string
  businessImpact: string
  technicalDetails: string
  suggestedFix: string
  confidence: string
}

export interface RiskScoreReport {
  overallScore: number
  severity: string
  trend: string
  breakdown: RiskFactorBreakdown[]
  topContributors: RiskContributorReport[]
}

export interface RiskFactorBreakdown {
  factor: string
  score: number
  weight: number
  description: string
}

export interface RiskContributorReport {
  factor: string
  impact: number
  description: string
  recommendation: string
}

export interface OWASPMapping {
  category: string
  count: number
  severity: string
  description: string
  findings: string[]
}

export interface DependencyGraphReport {
  totalNodes: number
  totalEdges: number
  criticalPaths: string[][]
  circularDependencies: string[][]
  disconnectedServices: string[]
  singlePointsOfFailure: string[]
  services: ServiceReport[]
}

export interface ServiceReport {
  id: string
  name: string
  type: string
  risk: string
  health: number
  endpoints: number
  isExternal: boolean
}

export interface AIRecommendationReport {
  vulnerabilityId: string
  vulnerabilityTitle: string
  explanation: string
  businessImpact: string
  fix: string
  estimatedTime: string
  codeExample: {
    language: string
    before: string
    after: string
    description: string
  }
  priority: string
  confidence: number
}

export interface SecurityReport {
  executiveSummary: ExecutiveSummary
  securityFindings: SecurityFindingReport[]
  riskScore: RiskScoreReport
  owaspMapping: OWASPMapping[]
  dependencyGraph: DependencyGraphReport
  aiRecommendations: AIRecommendationReport[]
  metadata: ReportMetadata
}

export interface ReportMetadata {
  reportId: string
  generatedAt: string
  generatedBy: string
  specId: string
  specName: string
  specVersion: string
  reportType: ReportType
  format: ReportFormat
}

export interface ReportGenerationOptions {
  includeExecutiveSummary: boolean
  includeSecurityFindings: boolean
  includeRiskScore: boolean
  includeOWASPMapping: boolean
  includeDependencyGraph: boolean
  includeAIRecommendations: boolean
  format: ReportFormat
  reportType: ReportType
}

export interface ExportResult {
  success: boolean
  data?: string | Blob
  filename?: string
  mimeType?: string
  error?: string
}
