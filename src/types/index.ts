// Core data types for APIRADx application

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Healthy' | 'Inactive'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
export type AuthMethod = 'OAuth 2.0' | 'JWT' | 'API Key' | 'mTLS' | 'None'
export type ServiceType = 'Core' | 'Security' | 'Commerce' | 'Data' | 'Infrastructure' | 'External' | 'Platform'
export type TrafficLevel = 'high' | 'medium' | 'low'
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low'

// API Endpoint
export interface APIEndpoint {
  id: number
  name: string
  endpoint: string
  service: string
  method: HttpMethod
  auth: AuthMethod
  owner: string
  risk: number
  riskLabel: RiskLevel
  version: string
  status: 'Active' | 'Deprecated'
  updated: string
}

// Service
export interface Service {
  id: string
  label: string
  type: ServiceType
  owner: string
  version: string
  endpoints: number
  health: number
  latency: number
  auth: AuthMethod
  risk: RiskLevel
  isExternal?: boolean
  findings: string[]
}

// Dependency Edge
export interface DependencyEdge {
  from: string
  to: string
  traffic: TrafficLevel
  isExternal?: boolean
}

// Vulnerability Finding
export interface Vulnerability {
  id: string
  owasp: string
  title: string
  severity: Severity
  endpoint: string
  cvss: number
  affected: number
  description: string
  impact: string
  fix: string
  technical: string
}

// Risk Heatmap Data
export interface RiskHeatmapRow {
  service: string
  critical: number
  high: number
  medium: number
  low: number
}

// KPI Data
export interface KPIData {
  apis: number
  critical: number
  score: number
  risk: number
}

// Trend Data
export interface TrendData {
  month: string
  value: number
}

// OWASP Distribution
export interface OWASPDistribution {
  label: RiskLevel
  value: number
  pct: number
}

// Recent Analysis
export interface RecentAnalysis {
  name: string
  service: string
  method: HttpMethod
  auth: AuthMethod
  owner: string
  risk: RiskLevel
  status: 'Vulnerable' | 'Reviewing' | 'Secure'
  scan: string
}

// Vulnerable API
export interface VulnerableAPI {
  name: string
  service: string
  score: number
  delta: 'up' | 'down' | 'same'
}

// AI Insight
export interface AIInsight {
  severity: Severity
  text: string
  impact: string
  fix: string
  time: string
  action: string
}

// Activity Timeline
export interface ActivityItem {
  icon: string
  label: string
  sub: string
  time: string
  user: string
  colorVar: string
  status: string
}

// Upload History
export interface UploadHistory {
  id: string
  name: string
  size: string
  uploadedAt: string
  status: 'success' | 'error'
  endpoints: number
  risks: number
}

// Report
export interface Report {
  id: number
  name: string
  type: 'Executive' | 'Technical' | 'Audit' | 'Compliance'
  date: string
  size: string
  summary?: any
  findings?: any[]
  riskScore?: any
  owaspMapping?: any[]
  dependencyGraph?: any
  aiRecommendations?: any[]
  metadata?: {
    specId?: string
    specName?: string
    generatedAt?: string
    generatedBy?: string
    specVersion?: string
  }
}

// AI Recommendation
export interface AIRecommendation {
  title: string
  severity: Severity
  priority: string
  reduction: string
  explanation: string
  fix: string
  snippet: string
}

// AI Message
export interface AIMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  code?: string
  thinking?: boolean
}

// Impact Result
export interface ImpactResult {
  affectedServices: {
    name: string
    impact: Severity
    reason: string
  }[]
  downstreamAPIs: {
    path: string
    consumers: number
  }[]
  businessImpact: {
    area: string
    severity: Severity
    detail: string
  }[]
  deploymentRisk: Severity
  recommendedTests: string[]
  chain: string[]
}

// Team Member
export interface TeamMember {
  name: string
  email: string
  role: string
  initials: string
  color: string
}

// API Key
export interface APIKey {
  id: string
  name: string
  prefix: string
  created: string
  lastUsed: string
}

// Dashboard Statistics
export interface DashboardStats {
  totalAPIs: number
  criticalIssues: number
  securityScore: number
  riskScore: number
  scoreTrend: number[]
  owaspDistribution: OWASPDistribution[]
  recentAnalysis: RecentAnalysis[]
  vulnerableAPIs: VulnerableAPI[]
  aiInsights: AIInsight[]
  activityTimeline: ActivityItem[]
  uploadHistory: UploadHistory[]
}
