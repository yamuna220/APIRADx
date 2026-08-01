// AI Recommendation types for vulnerability remediation

export type RecommendationPriority = 'Critical' | 'High' | 'Medium' | 'Low'

export interface VulnerabilityContext {
  id: string
  title: string
  severity: string
  owaspCategory: string
  affectedEndpoint: string
  affectedMethod?: string
  technicalDetails: string
  codeContext?: string
}

export interface AIRecommendation {
  explanation: string
  businessImpact: string
  fix: string
  estimatedTime: string
  codeExample: CodeExample
  priority: RecommendationPriority
  references: string[]
  confidence: number
}

export interface CodeExample {
  language: string
  before: string
  after: string
  description: string
}

export interface AIProvider {
  name: string
  generateRecommendation(vulnerability: VulnerabilityContext): Promise<AIRecommendation>
  isAvailable(): boolean
}

export interface RecommendationRequest {
  vulnerability: VulnerabilityContext
  options?: {
    includeCodeExample?: boolean
    language?: string
    detailLevel?: 'brief' | 'standard' | 'detailed'
  }
}

export interface RecommendationResponse {
  recommendation: AIRecommendation
  provider: string
  timestamp: string
  processingTime: number
}
