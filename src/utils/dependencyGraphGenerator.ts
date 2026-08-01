// Dynamic Dependency Graph Generator for React Flow
import {
  DependencyGraph,
  GraphNode,
  GraphEdge,
  GraphMetadata,
  GraphAnalysis,
  NodeType,
  NodeRisk,
  ReactFlowGraph,
  ReactFlowNode,
  ReactFlowEdge
} from '../types/dependency'

// ── Service Extraction ─────────────────────────────────────────────────

function extractServices(spec: any): GraphNode[] {
  const nodes: GraphNode[] = []
  const serviceMap = new Map<string, GraphNode>()

  // Extract services from path structure
  if (spec.paths) {
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      const segments = path.split('/').filter(s => s.length > 0)
      
      // First segment is typically the service name
      if (segments.length > 0) {
        const serviceName = segments[0]
        
        if (!serviceMap.has(serviceName)) {
          const node: GraphNode = {
            id: serviceName,
            type: determineNodeType(serviceName, path),
            label: capitalize(serviceName),
            risk: determineRisk(serviceName, path),
            health: 100,
            endpoints: 0,
            isExternal: false,
            data: {
              path,
              tags: (pathItem as any).tags || [],
              methods: []
            }
          }
          serviceMap.set(serviceName, node)
          nodes.push(node)
        }
        
        // Count endpoints
        const node = serviceMap.get(serviceName)!
        const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace']
        methods.forEach(method => {
          if ((pathItem as any)[method]) {
            node.endpoints++
            node.data?.methods?.push(method.toUpperCase())
          }
        })
      }
    }
  }

  // Extract from servers
  if (spec.servers) {
    spec.servers.forEach((server: any, index: number) => {
      const serverName = extractServiceName(server.url)
      if (!serviceMap.has(serverName)) {
        const node: GraphNode = {
          id: serverName,
          type: 'service',
          label: serverName,
          risk: 'Healthy',
          health: 100,
          endpoints: 0,
          isExternal: isExternalUrl(server.url),
          data: {
            server: server.url,
            description: server.description
          }
        }
        serviceMap.set(serverName, node)
        nodes.push(node)
      }
    })
  }

  return nodes
}

function extractDatabases(spec: any): GraphNode[] {
  const nodes: GraphNode[] = []
  const dbKeywords = ['db', 'database', 'sql', 'mongo', 'postgres', 'mysql', 'redis', 'cache', 'storage']
  const dbPatterns = [
    /db/i, /database/i, /sql/i, /mongo/i, /postgres/i, /mysql/i, /redis/i, /cache/i
  ]

  if (spec.paths) {
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      dbKeywords.forEach(keyword => {
        if (path.toLowerCase().includes(keyword)) {
          const dbId = `db_${keyword}_${nodes.length}`
          nodes.push({
            id: dbId,
            type: 'database',
            label: `${capitalize(keyword)} Database`,
            risk: 'High',
            health: 95,
            endpoints: 0,
            isExternal: false,
            data: { path }
          })
        }
      })
    }
  }

  // Check for database references in descriptions
  if (spec.info?.description) {
    dbPatterns.forEach(pattern => {
      if (pattern.test(spec.info.description)) {
        const dbId = `db_ref_${nodes.length}`
        nodes.push({
          id: dbId,
          type: 'database',
          label: 'Reference Database',
          risk: 'Medium',
          health: 90,
          endpoints: 0,
          isExternal: false
        })
      }
    })
  }

  return nodes
}

function extractExternalAPIs(spec: any): GraphNode[] {
  const nodes: GraphNode[] = []
  const externalKeywords = ['external', 'third-party', 'api', 'proxy', 'integration']
  const externalPatterns = [/external/i, /third.?party/i, /proxy/i, /integration/i]

  if (spec.paths) {
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      externalKeywords.forEach(keyword => {
        if (path.toLowerCase().includes(keyword)) {
          const apiId = `external_${keyword}_${nodes.length}`
          nodes.push({
            id: apiId,
            type: 'external_api',
            label: `${capitalize(keyword)} API`,
            risk: 'Medium',
            health: 85,
            endpoints: 0,
            isExternal: true,
            data: { path }
          })
        }
      })
    }
  }

  // Check for external server URLs
  if (spec.servers) {
    spec.servers.forEach((server: any, index: number) => {
      if (isExternalUrl(server.url)) {
        const apiId = `external_server_${index}`
        nodes.push({
          id: apiId,
          type: 'external_api',
          label: extractServiceName(server.url),
          risk: 'Medium',
          health: 80,
          endpoints: 0,
          isExternal: true,
          data: { server: server.url }
        })
      }
    })
  }

  return nodes
}

function extractAuthServers(spec: any): GraphNode[] {
  const nodes: GraphNode[] = []
  const authKeywords = ['auth', 'login', 'oauth', 'token', 'jwt', 'identity', 'sso']

  if (spec.paths) {
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      authKeywords.forEach(keyword => {
        if (path.toLowerCase().includes(keyword)) {
          const authId = `auth_${keyword}_${nodes.length}`
          nodes.push({
            id: authId,
            type: 'auth_server',
            label: `${capitalize(keyword)} Service`,
            risk: 'Critical',
            health: 100,
            endpoints: 0,
            isExternal: false,
            data: { path }
          })
        }
      })
    }
  }

  // Check for security schemes
  if (spec.components?.securitySchemes || spec.securityDefinitions) {
    const schemes = spec.components?.securitySchemes || spec.securityDefinitions
    Object.entries(schemes).forEach(([name, scheme]: [string, any]) => {
      if (scheme.type === 'oauth2' || scheme.type === 'openIdConnect') {
        const authId = `auth_scheme_${name}`
        nodes.push({
          id: authId,
          type: 'auth_server',
          label: `${capitalize(name)} Auth`,
          risk: 'Critical',
          health: 100,
          endpoints: 0,
          isExternal: false,
          data: { authentication: scheme.type }
        })
      }
    })
  }

  return nodes
}

// ── Edge Generation ───────────────────────────────────────────────────

function generateEdges(nodes: GraphNode[], spec: any): GraphEdge[] {
  const edges: GraphEdge[] = []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  // Generate edges based on path hierarchy
  if (spec.paths) {
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      const segments = path.split('/').filter(s => s.length > 0)
      
      if (segments.length > 1) {
        const sourceService = segments[0]
        const targetService = segments[1]
        
        // Check if both services exist as nodes
        if (nodeMap.has(sourceService) && nodeMap.has(targetService)) {
          const edgeId = `${sourceService}_${targetService}`
          if (!edges.find(e => e.id === edgeId)) {
            edges.push({
              id: edgeId,
              source: sourceService,
              target: targetService,
              type: 'dependency',
              weight: 1,
              isCritical: isCriticalPath(sourceService, targetService),
              data: {
                path,
                method: 'GET',
                frequency: 1
              }
            })
          }
        }
      }
    }
  }

  // Generate edges for database connections
  const dbNodes = nodes.filter(n => n.type === 'database')
  dbNodes.forEach(dbNode => {
    const serviceNodes = nodes.filter(n => n.type === 'service')
    serviceNodes.forEach(serviceNode => {
      if (dbNode.data?.path?.includes(serviceNode.id.toLowerCase())) {
        const edgeId = `${serviceNode.id}_${dbNode.id}`
        if (!edges.find(e => e.id === edgeId)) {
          edges.push({
            id: edgeId,
            source: serviceNode.id,
            target: dbNode.id,
            type: 'data_flow',
            weight: 2,
            isCritical: true,
            data: {
              method: 'QUERY',
              frequency: 5
            }
          })
        }
      }
    })
  })

  // Generate edges for external API calls
  const externalNodes = nodes.filter(n => n.type === 'external_api')
  externalNodes.forEach(externalNode => {
    const serviceNodes = nodes.filter(n => n.type === 'service')
    serviceNodes.forEach(serviceNode => {
      if (externalNode.data?.path?.includes(serviceNode.id.toLowerCase())) {
        const edgeId = `${serviceNode.id}_${externalNode.id}`
        if (!edges.find(e => e.id === edgeId)) {
          edges.push({
            id: edgeId,
            source: serviceNode.id,
            target: externalNode.id,
            type: 'api_call',
            weight: 1,
            isCritical: false,
            data: {
              method: 'POST',
              frequency: 2
            }
          })
        }
      }
    })
  })

  // Generate edges for authentication flows
  const authNodes = nodes.filter(n => n.type === 'auth_server')
  authNodes.forEach(authNode => {
    const serviceNodes = nodes.filter(n => n.type === 'service')
    serviceNodes.forEach(serviceNode => {
      const edgeId = `${serviceNode.id}_${authNode.id}`
      if (!edges.find(e => e.id === edgeId)) {
        edges.push({
          id: edgeId,
          source: serviceNode.id,
          target: authNode.id,
          type: 'auth_flow',
          weight: 3,
          isCritical: true,
          data: {
            method: 'AUTH',
            frequency: 10
          }
        })
      }
    })
  })

  return edges
}

// ── Analysis Functions ────────────────────────────────────────────────

function detectCriticalPaths(nodes: GraphNode[], edges: GraphEdge[]): string[][] {
  const criticalPaths: string[][] = []
  const authNodes = nodes.filter(n => n.type === 'auth_server')
  const dbNodes = nodes.filter(n => n.type === 'database')

  // Paths through authentication servers
  authNodes.forEach(authNode => {
    const incomingEdges = edges.filter(e => e.target === authNode.id)
    incomingEdges.forEach(edge => {
      const path = [edge.source, authNode.id]
      const outgoingEdges = edges.filter(e => e.source === authNode.id)
      outgoingEdges.forEach(outEdge => {
        path.push(outEdge.target)
        criticalPaths.push([...path])
      })
    })
  })

  // Paths to databases
  dbNodes.forEach(dbNode => {
    const incomingEdges = edges.filter(e => e.target === dbNode.id && e.isCritical)
    incomingEdges.forEach(edge => {
      const path = [edge.source, dbNode.id]
      criticalPaths.push([...path])
    })
  })

  return criticalPaths
}

function detectCircularDependencies(nodes: GraphNode[], edges: GraphEdge[]): string[][] {
  const circularDependencies: string[][] = []
  const adjacency = new Map<string, string[]>()

  // Build adjacency list
  nodes.forEach(node => {
    adjacency.set(node.id, [])
  })

  edges.forEach(edge => {
    const neighbors = adjacency.get(edge.source) || []
    neighbors.push(edge.target)
    adjacency.set(edge.source, neighbors)
  })

  // Detect cycles using DFS
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const currentPath: string[] = []

  function detectCycle(node: string): boolean {
    visited.add(node)
    recursionStack.add(node)
    currentPath.push(node)

    const neighbors = adjacency.get(node) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (detectCycle(neighbor)) {
          return true
        }
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = currentPath.indexOf(neighbor)
        const cycle = currentPath.slice(cycleStart)
        cycle.push(neighbor)
        circularDependencies.push([...cycle])
        return true
      }
    }

    recursionStack.delete(node)
    currentPath.pop()
    return false
  }

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      detectCycle(node.id)
    }
  })

  return circularDependencies
}

function detectDisconnectedServices(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const disconnected: string[] = []
  const connectedNodes = new Set<string>()

  // Mark all connected nodes
  edges.forEach(edge => {
    connectedNodes.add(edge.source)
    connectedNodes.add(edge.target)
  })

  // Find nodes without any connections
  nodes.forEach(node => {
    if (!connectedNodes.has(node.id)) {
      disconnected.push(node.id)
    }
  })

  return disconnected
}

function detectSinglePointsOfFailure(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const spof: string[] = []
  const inDegree = new Map<string, number>()
  const outDegree = new Map<string, number>()

  // Initialize degrees
  nodes.forEach(node => {
    inDegree.set(node.id, 0)
    outDegree.set(node.id, 0)
  })

  // Calculate degrees
  edges.forEach(edge => {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
    outDegree.set(edge.source, (outDegree.get(edge.source) || 0) + 1)
  })

  // Identify single points of failure
  nodes.forEach(node => {
    const inDeg = inDegree.get(node.id) || 0
    const outDeg = outDegree.get(node.id) || 0
    
    // Critical nodes: auth servers, databases with many dependents
    if (node.type === 'auth_server' && inDeg > 0) {
      spof.push(node.id)
    }
    
    // Nodes that are the only connection between components
    if (inDeg > 0 && outDeg > 0) {
      const totalConnections = inDeg + outDeg
      if (totalConnections > 3) {
        spof.push(node.id)
      }
    }
  })

  return spof
}

// ── Main Graph Generator ─────────────────────────────────────────────

export function generateDependencyGraph(spec: any): DependencyGraph {
  const services = extractServices(spec)
  const databases = extractDatabases(spec)
  const externalAPIs = extractExternalAPIs(spec)
  const authServers = extractAuthServers(spec)

  const nodes = [...services, ...databases, ...externalAPIs, ...authServers]
  const edges = generateEdges(nodes, spec)

  const criticalPaths = detectCriticalPaths(nodes, edges)
  const circularDependencies = detectCircularDependencies(nodes, edges)
  const disconnectedServices = detectDisconnectedServices(nodes, edges)
  const singlePointsOfFailure = detectSinglePointsOfFailure(nodes, edges)

  const metadata: GraphMetadata = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    criticalPaths,
    circularDependencies,
    disconnectedServices,
    singlePointsOfFailure,
    generatedAt: new Date().toISOString()
  }

  return {
    nodes,
    edges,
    metadata
  }
}

// ── React Flow Conversion ─────────────────────────────────────────────

export function toReactFlowGraph(graph: DependencyGraph): ReactFlowGraph {
  const nodes: ReactFlowNode[] = graph.nodes.map((node, index) => ({
    id: node.id,
    type: 'custom',
    position: calculateNodePosition(node, index, graph.nodes.length),
    data: {
      label: node.label,
      nodeType: node.type,
      risk: node.risk,
      health: node.health,
      endpoints: node.endpoints,
      isExternal: node.isExternal,
      description: node.description
    },
    style: getNodeStyle(node)
  }))

  const edges: ReactFlowEdge[] = graph.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: edge.isCritical,
    style: getEdgeStyle(edge),
    label: edge.label,
    labelStyle: { fontSize: 10, fontWeight: 500 },
    labelShowBg: true,
    labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
    data: {
      weight: edge.weight,
      isCritical: edge.isCritical,
      edgeType: edge.type
    }
  }))

  return { nodes, edges }
}

// ── Helper Functions ─────────────────────────────────────────────────

function determineNodeType(serviceName: string, path: string): NodeType {
  const lowerName = serviceName.toLowerCase()
  const lowerPath = path.toLowerCase()

  if (lowerName.includes('auth') || lowerName.includes('login') || lowerName.includes('oauth')) {
    return 'auth_server'
  }
  if (lowerName.includes('db') || lowerName.includes('database') || lowerName.includes('sql')) {
    return 'database'
  }
  if (lowerName.includes('gateway') || lowerName.includes('api')) {
    return 'gateway'
  }
  if (lowerName.includes('cache') || lowerName.includes('redis')) {
    return 'cache'
  }
  if (lowerName.includes('queue') || lowerName.includes('kafka') || lowerName.includes('rabbit')) {
    return 'message_queue'
  }
  
  return 'service'
}

function determineRisk(serviceName: string, path: string): NodeRisk {
  const lowerName = serviceName.toLowerCase()
  const lowerPath = path.toLowerCase()

  if (lowerName.includes('auth') || lowerName.includes('login')) {
    return 'Critical'
  }
  if (lowerName.includes('payment') || lowerName.includes('transaction')) {
    return 'Critical'
  }
  if (lowerName.includes('admin') || lowerName.includes('manage')) {
    return 'High'
  }
  if (lowerName.includes('user') || lowerName.includes('profile')) {
    return 'Medium'
  }
  
  return 'Healthy'
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function extractServiceName(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    const parts = hostname.split('.')
    return parts[0] || hostname
  } catch {
    return url.replace(/https?:\/\//, '').split('/')[0]
  }
}

function isExternalUrl(url: string): boolean {
  return url.includes('http://') || url.includes('https://')
}

function isCriticalPath(source: string, target: string): boolean {
  const criticalKeywords = ['auth', 'payment', 'transaction', 'user']
  return criticalKeywords.some(keyword => 
    source.toLowerCase().includes(keyword) || target.toLowerCase().includes(keyword)
  )
}

function calculateNodePosition(node: GraphNode, index: number, total: number): { x: number; y: number } {
  const cols = Math.ceil(Math.sqrt(total))
  const row = Math.floor(index / cols)
  const col = index % cols
  
  return {
    x: col * 200 + 100,
    y: row * 150 + 100
  }
}

function getNodeStyle(node: GraphNode): React.CSSProperties {
  const colors: Record<NodeRisk, string> = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#22c55e',
    Healthy: '#3b82f6',
    Inactive: '#6b7280'
  }

  const typeColors: Record<NodeType, string> = {
    service: '#3b82f6',
    database: '#8b5cf6',
    external_api: '#f59e0b',
    auth_server: '#ef4444',
    gateway: '#06b6d4',
    cache: '#10b981',
    message_queue: '#ec4899',
    unknown: '#6b7280'
  }

  return {
    background: node.isExternal ? '#fef3c7' : '#f3f4f6',
    border: `2px solid ${typeColors[node.type]}`,
    borderRadius: '8px',
    padding: '10px',
    minWidth: '150px',
    boxShadow: node.risk === 'Critical' ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'
  }
}

function getEdgeStyle(edge: GraphEdge): React.CSSProperties {
  return {
    stroke: edge.isCritical ? '#ef4444' : '#94a3b8',
    strokeWidth: edge.isCritical ? 3 : 2,
    strokeDasharray: edge.type === 'auth_flow' ? '5,5' : 'none'
  }
}

// ── Analysis Functions ───────────────────────────────────────────────

export function analyzeGraph(graph: DependencyGraph): GraphAnalysis {
  const hasCircularDependencies = graph.metadata.circularDependencies.length > 0
  const hasDisconnectedServices = graph.metadata.disconnectedServices.length > 0
  const hasSinglePointsOfFailure = graph.metadata.singlePointsOfFailure.length > 0
  const criticalPathCount = graph.metadata.criticalPaths.length

  const averageNodeHealth = graph.nodes.reduce((sum, node) => sum + node.health, 0) / graph.nodes.length

  const mostCriticalNode = graph.nodes
    .filter(n => n.risk === 'Critical')
    .sort((a, b) => b.endpoints - a.endpoints)[0]?.id

  const recommendations: string[] = []

  if (hasCircularDependencies) {
    recommendations.push(`Resolve ${graph.metadata.circularDependencies.length} circular dependencies to prevent infinite loops`)
  }

  if (hasDisconnectedServices) {
    recommendations.push(`Investigate ${graph.metadata.disconnectedServices.length} disconnected services`)
  }

  if (hasSinglePointsOfFailure) {
    recommendations.push(`Implement redundancy for ${graph.metadata.singlePointsOfFailure.length} single points of failure`)
  }

  if (criticalPathCount > 5) {
    recommendations.push('Consider load balancing for critical paths')
  }

  if (averageNodeHealth < 80) {
    recommendations.push('Improve overall service health monitoring')
  }

  return {
    hasCircularDependencies,
    hasDisconnectedServices,
    hasSinglePointsOfFailure,
    criticalPathCount,
    averageNodeHealth: Math.round(averageNodeHealth),
    mostCriticalNode,
    recommendations
  }
}
