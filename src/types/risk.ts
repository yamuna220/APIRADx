// Risk scoring types for API risk assessment

export type RiskSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Minimal'
export type RiskTrend = 'Increasing' | 'Decreasing' | 'Stable' | 'Unknown'

export interface RiskFactor {
  name: string
  weight: number
  score: number
  maxScore: number
  description: string
}

export interface RiskScoreResult {
  overallScore: number
  maxScore: number
  severity: RiskSeverity
  trend: RiskTrend
  breakdown: RiskBreakdown
  topContributors: RiskContributor[]
  timestamp: string
}

export interface RiskBreakdown {
  authentication: RiskFactor
  sensitiveData: RiskFactor
  exposure: RiskFactor
  dependencyCriticality: RiskFactor
  owaspViolations: RiskFactor
  configurationRisks: RiskFactor
}

export interface RiskContributor {
  category: string
  factor: string
  score: number
  impact: string
  recommendation: string
}

export interface RiskThresholds {
  critical: number
  high: number
  medium: number
  low: number
}

export interface RiskHistory {
  timestamp: string
  score: number
  severity: RiskSeverity
}

export interface RiskWeights {
  authentication: number
  sensitiveData: number
  exposure: number
  dependencyCriticality: number
  owaspViolations: number
  configurationRisks: number
}

export interface RiskContext {
  spec: any
  endpoints: any[]
  securityFindings: any[]
  servers: any[]
  securitySchemes: Record<string, any>
  globalSecurity: any[]
  dependencies?: any[]
}
