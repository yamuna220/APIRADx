// Impact prediction types for endpoint change analysis

export type ChangeType = 'add' | 'modify' | 'delete' | 'deprecate'
export type ChangeScope = 'parameter' | 'response' | 'authentication' | 'rate_limit' | 'breaking'
export type ImpactLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Minimal'
export type DeploymentRiskLevel = 'Very High' | 'High' | 'Medium' | 'Low' | 'Minimal'

export interface EndpointChange {
  endpointId: string
  path: string
  method: string
  changeType: ChangeType
  changeScope: ChangeScope
  description: string
  previousValue?: any
  newValue?: any
  breakingChange: boolean
}

export interface AffectedAPI {
  endpointId: string
  path: string
  method: string
  impactReason: string
  impactLevel: ImpactLevel
  requiresUpdate: boolean
}

export interface DependentService {
  serviceId: string
  serviceName: string
  dependencyType: 'direct' | 'indirect' | 'transitive'
  impactLevel: ImpactLevel
  affectedEndpoints: string[]
  requiresAction: boolean
}

export interface BusinessImpact {
  level: ImpactLevel
  affectedUsers: number
  affectedRevenue: number
  slaImpact: boolean
  complianceRisk: boolean
  description: string
  mitigation: string
}

export interface DeploymentRisk {
  level: DeploymentRiskLevel
  rollbackComplexity: 'simple' | 'moderate' | 'complex' | 'very_complex'
  downtimeEstimate: string
  dataLossRisk: boolean
  rollbackPlan: string
  monitoringRequired: string[]
}

export interface TestingRecommendation {
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security'
  priority: 'critical' | 'high' | 'medium' | 'low'
  description: string
  estimatedTime: string
  testCases: string[]
}

export interface DependencyChainNode {
  id: string
  name: string
  type: 'endpoint' | 'service' | 'database' | 'external'
  impactLevel: ImpactLevel
  position: { x: number; y: number }
}

export interface DependencyChainEdge {
  source: string
  target: string
  type: 'direct' | 'indirect' | 'transitive'
  impactLevel: ImpactLevel
}

export interface DependencyChain {
  nodes: DependencyChainNode[]
  edges: DependencyChainEdge[]
  criticalPath: string[]
}

export interface ImpactPrediction {
  change: EndpointChange
  affectedAPIs: AffectedAPI[]
  dependentServices: DependentService[]
  businessImpact: BusinessImpact
  deploymentRisk: DeploymentRisk
  testingRecommendations: TestingRecommendation[]
  dependencyChain: DependencyChain
  overallRisk: DeploymentRiskLevel
  confidence: number
  generatedAt: string
}

export interface ImpactPredictionContext {
  spec: any
  dependencyGraph: any
  change: EndpointChange
  historicalData?: any
  serviceMetrics?: any
}
