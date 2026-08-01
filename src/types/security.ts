// Security finding types for API security analysis

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info'
export type Confidence = 'High' | 'Medium' | 'Low'

export type OWASPCategory =
  | 'API1:2019-Broken Object Level Authorization'
  | 'API2:2019-Broken Authentication'
  | 'API3:2019-Excessive Data Exposure'
  | 'API4:2019-Lack of Resources & Rate Limiting'
  | 'API5:2019-Broken Function Level Authorization'
  | 'API6:2019-Mass Assignment'
  | 'API7:2019-Security Misconfiguration'
  | 'API8:2019-Injection'
  | 'API9:2019-Improper Assets Management'
  | 'API10:2019-Insufficient Logging & Monitoring'

export interface SecurityFinding {
  id: string
  title: string
  severity: Severity
  businessImpact: string
  technicalDetails: string
  suggestedFix: string
  owaspCategory: OWASPCategory
  confidence: Confidence
  affectedEndpoint: string
  affectedMethod?: string
  location?: string
  references?: string[]
}

export interface SecurityAnalysisResult {
  findings: SecurityFinding[]
  summary: SecuritySummary
  timestamp: string
  specId: string
}

export interface SecuritySummary {
  totalFindings: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  infoCount: number
  riskScore: number
}

export interface SecurityRule {
  id: string
  name: string
  description: string
  owaspCategory: OWASPCategory
  severity: Severity
  check: (spec: any, endpoint?: any) => SecurityFinding[]
}

export interface SecurityContext {
  spec: any
  endpoints: any[]
  servers: any[]
  securitySchemes: Record<string, any>
  globalSecurity: any[]
}
