// Dependency graph types for React Flow visualization

export type NodeType = 
  | 'service'
  | 'database'
  | 'external_api'
  | 'auth_server'
  | 'gateway'
  | 'cache'
  | 'message_queue'
  | 'unknown'

export type NodeRisk = 'Critical' | 'High' | 'Medium' | 'Low' | 'Healthy' | 'Inactive'

export interface GraphNode {
  id: string
  type: NodeType
  label: string
  description?: string
  risk: NodeRisk
  health: number
  endpoints: number
  isExternal: boolean
  position?: { x: number; y: number }
  data?: {
    path?: string
    server?: string
    tags?: string[]
    methods?: string[]
    authentication?: string[]
    description?: string
  }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: 'dependency' | 'data_flow' | 'auth_flow' | 'api_call'
  label?: string
  weight: number
  isCritical: boolean
  data?: {
    method?: string
    path?: string
    frequency?: number
  }
}

export interface DependencyGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  metadata: GraphMetadata
}

export interface GraphMetadata {
  totalNodes: number
  totalEdges: number
  criticalPaths: string[][]
  circularDependencies: string[][]
  disconnectedServices: string[]
  singlePointsOfFailure: string[]
  generatedAt: string
}

export interface GraphAnalysis {
  hasCircularDependencies: boolean
  hasDisconnectedServices: boolean
  hasSinglePointsOfFailure: boolean
  criticalPathCount: number
  averageNodeHealth: number
  mostCriticalNode?: string
  recommendations: string[]
}

export interface ReactFlowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    label: string
    nodeType: NodeType
    risk: NodeRisk
    health: number
    endpoints: number
    isExternal: boolean
    description?: string
  }
  style?: React.CSSProperties
}

export interface ReactFlowEdge {
  id: string
  source: string
  target: string
  type?: string
  animated?: boolean
  style?: React.CSSProperties
  label?: string
  labelStyle?: React.CSSProperties
  labelShowBg?: boolean
  labelBgStyle?: React.CSSProperties
  data?: {
    weight: number
    isCritical: boolean
    edgeType: string
  }
}

export interface ReactFlowGraph {
  nodes: ReactFlowNode[]
  edges: ReactFlowEdge[]
}
