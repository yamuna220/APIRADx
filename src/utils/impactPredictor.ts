// Impact Prediction Engine for Endpoint Changes
import {
  ImpactPrediction,
  EndpointChange,
  AffectedAPI,
  DependentService,
  BusinessImpact,
  DeploymentRisk,
  TestingRecommendation,
  DependencyChain,
  DependencyChainNode,
  DependencyChainEdge,
  ImpactPredictionContext,
  ImpactLevel,
  DeploymentRiskLevel,
  ChangeType,
  ChangeScope
} from '../types/impact'

// ── Affected API Prediction ───────────────────────────────────────────

function predictAffectedAPIs(change: EndpointChange, spec: any): AffectedAPI[] {
  const affectedAPIs: AffectedAPI[] = []
  
  if (!spec.paths) return affectedAPIs

  const changedPath = change.path
  const changedMethod = change.method

  // Find endpoints that share the same path prefix
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const pathSegments = path.split('/').filter(s => s.length > 0)
    const changedSegments = changedPath.split('/').filter(s => s.length > 0)
    
    // Check if paths share a common prefix
    if (pathSegments.length > 0 && changedSegments.length > 0) {
      const commonPrefix = pathSegments[0] === changedSegments[0]
      
      if (commonPrefix && path !== changedPath) {
        const impactLevel = determineImpactLevel(change.changeScope, change.changeType)
        
        affectedAPIs.push({
          endpointId: `${path}_${Object.keys(pathItem as any)[0]}`,
          path,
          method: Object.keys(pathItem as any)[0].toUpperCase(),
          impactReason: `Shares service prefix with changed endpoint: ${changedPath}`,
          impactLevel,
          requiresUpdate: change.breakingChange
        })
      }
    }

    // Check for endpoints that reference the changed endpoint in responses
    const methods = ['get', 'post', 'put', 'delete', 'patch']
    methods.forEach(method => {
      const operation = (pathItem as any)[method]
      if (operation && operation.responses) {
        const responseContent = JSON.stringify(operation.responses)
        if (responseContent.includes(changedPath)) {
          affectedAPIs.push({
            endpointId: `${path}_${method}`,
            path,
            method: method.toUpperCase(),
            impactReason: `References changed endpoint in response schema`,
            impactLevel: 'High',
            requiresUpdate: true
          })
        }
      }
    })
  }

  return affectedAPIs
}

// ── Dependent Service Identification ───────────────────────────────────

function identifyDependentServices(
  change: EndpointChange,
  dependencyGraph: any
): DependentService[] {
  const dependentServices: DependentService[] = []
  
  if (!dependencyGraph || !dependencyGraph.nodes || !dependencyGraph.edges) {
    return dependentServices
  }

  const changedService = extractServiceName(change.path)
  
  // Find services that depend on the changed service
  dependencyGraph.edges.forEach((edge: any) => {
    if (edge.target === changedService || edge.source === changedService) {
      const relatedServiceId = edge.target === changedService ? edge.source : edge.target
      const relatedService = dependencyGraph.nodes.find((n: any) => n.id === relatedServiceId)
      
      if (relatedService) {
        const dependencyType = edge.type === 'direct' ? 'direct' : 'indirect'
        const impactLevel = determineServiceImpactLevel(change.changeType, change.changeScope)
        
        dependentServices.push({
          serviceId: relatedServiceId,
          serviceName: relatedService.label,
          dependencyType,
          impactLevel,
          affectedEndpoints: [change.path],
          requiresAction: change.breakingChange
        })
      }
    }
  })

  return dependentServices
}

// ── Business Impact Assessment ───────────────────────────────────────

function assessBusinessImpact(
  change: EndpointChange,
  affectedAPIs: AffectedAPI[],
  dependentServices: DependentService[]
): BusinessImpact {
  const criticalEndpoints = ['/auth', '/payment', '/transaction', '/user', '/admin']
  const isCriticalEndpoint = criticalEndpoints.some(path => 
    change.path.toLowerCase().includes(path)
  )

  const affectedCount = affectedAPIs.length + dependentServices.length
  let level: ImpactLevel = 'Low'
  
  if (isCriticalEndpoint || change.breakingChange) {
    level = 'Critical'
  } else if (affectedCount > 5) {
    level = 'High'
  } else if (affectedCount > 2) {
    level = 'Medium'
  }

  // Estimate affected users (mock calculation)
  const affectedUsers = isCriticalEndpoint ? 100000 : affectedCount * 1000
  const affectedRevenue = isCriticalEndpoint ? 50000 : affectedCount * 500

  const slaImpact = isCriticalEndpoint || change.changeType === 'delete'
  const complianceRisk = change.path.toLowerCase().includes('user') || 
                       change.path.toLowerCase().includes('payment') ||
                       change.path.toLowerCase().includes('auth')

  let description = `This ${change.changeType} to ${change.path} will affect ${affectedCount} related endpoints and services.`
  if (isCriticalEndpoint) {
    description += ' This is a critical endpoint that handles core business operations.'
  }
  if (change.breakingChange) {
    description += ' This is a breaking change that will require client updates.'
  }

  const mitigation = generateMitigationStrategy(change, level)

  return {
    level,
    affectedUsers,
    affectedRevenue,
    slaImpact,
    complianceRisk,
    description,
    mitigation
  }
}

// ── Deployment Risk Calculation ───────────────────────────────────────

function calculateDeploymentRisk(
  change: EndpointChange,
  businessImpact: BusinessImpact,
  affectedAPIs: AffectedAPI[]
): DeploymentRisk {
  let level: DeploymentRiskLevel = 'Low'
  let rollbackComplexity: 'simple' | 'moderate' | 'complex' | 'very_complex' = 'simple'
  let downtimeEstimate = '< 5 minutes'
  let dataLossRisk = false

  if (businessImpact.level === 'Critical' || change.breakingChange) {
    level = 'Very High'
    rollbackComplexity = 'complex'
    downtimeEstimate = '15-30 minutes'
    dataLossRisk = change.changeType === 'delete'
  } else if (businessImpact.level === 'High') {
    level = 'High'
    rollbackComplexity = 'moderate'
    downtimeEstimate = '5-15 minutes'
  } else if (businessImpact.level === 'Medium') {
    level = 'Medium'
    rollbackComplexity = 'simple'
    downtimeEstimate = '5-10 minutes'
  }

  const rollbackPlan = generateRollbackPlan(change, rollbackComplexity)
  const monitoringRequired = generateMonitoringRequirements(change)

  return {
    level,
    rollbackComplexity,
    downtimeEstimate,
    dataLossRisk,
    rollbackPlan,
    monitoringRequired
  }
}

// ── Testing Recommendations ───────────────────────────────────────────

function generateTestingRecommendations(
  change: EndpointChange,
  businessImpact: BusinessImpact,
  affectedAPIs: AffectedAPI[]
): TestingRecommendation[] {
  const recommendations: TestingRecommendation[] = []

  // Unit tests
  recommendations.push({
    type: 'unit',
    priority: businessImpact.level === 'Critical' ? 'critical' : 'high',
    description: `Unit tests for ${change.method} ${change.path} endpoint`,
    estimatedTime: '2-4 hours',
    testCases: [
      'Test happy path scenarios',
      'Test error handling',
      'Test input validation',
      'Test authentication/authorization'
    ]
  })

  // Integration tests
  if (affectedAPIs.length > 0) {
    recommendations.push({
      type: 'integration',
      priority: 'high',
      description: `Integration tests for ${affectedAPIs.length} affected endpoints`,
      estimatedTime: `${affectedAPIs.length * 2} hours`,
      testCases: affectedAPIs.slice(0, 3).map(api => `Test integration with ${api.path}`)
    })
  }

  // E2E tests for critical changes
  if (businessImpact.level === 'Critical' || change.breakingChange) {
    recommendations.push({
      type: 'e2e',
      priority: 'critical',
      description: 'End-to-end tests for critical user flows',
      estimatedTime: '4-6 hours',
      testCases: [
        'Test complete user authentication flow',
        'Test transaction processing flow',
        'Test data consistency across services'
      ]
    })
  }

  // Performance tests for high-traffic endpoints
  recommendations.push({
    type: 'performance',
    priority: businessImpact.level === 'Critical' ? 'high' : 'medium',
    description: 'Performance and load testing',
    estimatedTime: '2-3 hours',
    testCases: [
      'Load test with expected traffic',
      'Stress test with peak traffic',
      'Measure response times and throughput'
    ]
  })

  // Security tests for authentication changes
  if (change.changeScope === 'authentication') {
    recommendations.push({
      type: 'security',
      priority: 'critical',
      description: 'Security testing for authentication changes',
      estimatedTime: '3-4 hours',
      testCases: [
        'Test token validation',
        'Test session management',
        'Test authorization checks',
        'Test for common auth vulnerabilities'
      ]
    })
  }

  return recommendations
}

// ── Dependency Chain Visualization ───────────────────────────────────

function generateDependencyChain(
  change: EndpointChange,
  dependentServices: DependentService[],
  dependencyGraph: any
): DependencyChain {
  const nodes: DependencyChainNode[] = []
  const edges: DependencyChainEdge[] = []
  const criticalPath: string[] = []

  // Add the changed endpoint as the root node
  const changedService = extractServiceName(change.path)
  nodes.push({
    id: change.endpointId,
    name: change.path,
    type: 'endpoint',
    impactLevel: 'Critical',
    position: { x: 100, y: 100 }
  })

  // Add dependent services
  dependentServices.forEach((service, index) => {
    const angle = (index / dependentServices.length) * 2 * Math.PI
    const radius = 150
    const x = 100 + radius * Math.cos(angle)
    const y = 100 + radius * Math.sin(angle)

    nodes.push({
      id: service.serviceId,
      name: service.serviceName,
      type: 'service',
      impactLevel: service.impactLevel,
      position: { x, y }
    })

    edges.push({
      source: change.endpointId,
      target: service.serviceId,
      type: service.dependencyType,
      impactLevel: service.impactLevel
    })

    if (service.impactLevel === 'Critical') {
      criticalPath.push(service.serviceId)
    }
  })

  // Add transitive dependencies from the graph
  if (dependencyGraph && dependencyGraph.edges) {
    dependencyGraph.edges.forEach((edge: any) => {
      if (dependentServices.some(s => s.serviceId === edge.source)) {
        const targetExists = nodes.find(n => n.id === edge.target)
        if (!targetExists) {
          nodes.push({
            id: edge.target,
            name: edge.target,
            type: 'service',
            impactLevel: 'Medium',
            position: { x: 300, y: 100 + nodes.length * 50 }
          })
        }
        
        edges.push({
          source: edge.source,
          target: edge.target,
          type: 'transitive',
          impactLevel: 'Medium'
        })
      }
    })
  }

  criticalPath.unshift(change.endpointId)

  return { nodes, edges, criticalPath }
}

// ── Main Impact Prediction Function ───────────────────────────────────

export function predictImpact(context: ImpactPredictionContext): ImpactPrediction {
  const { change, spec, dependencyGraph } = context

  const affectedAPIs = predictAffectedAPIs(change, spec)
  const dependentServices = identifyDependentServices(change, dependencyGraph)
  const businessImpact = assessBusinessImpact(change, affectedAPIs, dependentServices)
  const deploymentRisk = calculateDeploymentRisk(change, businessImpact, affectedAPIs)
  const testingRecommendations = generateTestingRecommendations(change, businessImpact, affectedAPIs)
  const dependencyChain = generateDependencyChain(change, dependentServices, dependencyGraph)

  const overallRisk = determineOverallRisk(businessImpact, deploymentRisk)

  return {
    change,
    affectedAPIs,
    dependentServices,
    businessImpact,
    deploymentRisk,
    testingRecommendations,
    dependencyChain,
    overallRisk,
    confidence: 0.85,
    generatedAt: new Date().toISOString()
  }
}

// ── Helper Functions ─────────────────────────────────────────────────

function determineImpactLevel(scope: ChangeScope, type: ChangeType): ImpactLevel {
  if (scope === 'breaking' || type === 'delete') return 'Critical'
  if (scope === 'authentication') return 'High'
  if (scope === 'response' && type === 'modify') return 'High'
  if (scope === 'parameter') return 'Medium'
  return 'Low'
}

function determineServiceImpactLevel(type: ChangeType, scope: ChangeScope): ImpactLevel {
  if (type === 'delete') return 'Critical'
  if (scope === 'breaking') return 'Critical'
  if (type === 'modify' && scope === 'authentication') return 'High'
  return 'Medium'
}

function extractServiceName(path: string): string {
  const segments = path.split('/').filter(s => s.length > 0)
  return segments[0] || 'unknown'
}

function determineOverallRisk(
  businessImpact: BusinessImpact,
  deploymentRisk: DeploymentRisk
): DeploymentRiskLevel {
  if (businessImpact.level === 'Critical' || deploymentRisk.level === 'Very High') {
    return 'Very High'
  }
  if (businessImpact.level === 'High' || deploymentRisk.level === 'High') {
    return 'High'
  }
  if (businessImpact.level === 'Medium' || deploymentRisk.level === 'Medium') {
    return 'Medium'
  }
  return 'Low'
}

function generateMitigationStrategy(change: EndpointChange, level: ImpactLevel): string {
  if (level === 'Critical') {
    return 'Implement feature flags, gradual rollout, and comprehensive monitoring. Prepare rollback plan and communicate changes to all stakeholders.'
  }
  if (level === 'High') {
    return 'Implement canary deployment, monitor key metrics, and have rollback plan ready. Notify dependent teams of upcoming changes.'
  }
  if (level === 'Medium') {
    return 'Monitor deployment closely, have rollback plan available, and notify affected teams.'
  }
  return 'Standard deployment process with monitoring.'
}

function generateRollbackPlan(
  change: EndpointChange,
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex'
): string {
  if (complexity === 'simple') {
    return 'Revert to previous version using standard deployment rollback.'
  }
  if (complexity === 'moderate') {
    return 'Revert API changes, restore database migrations if applicable, and clear caches.'
  }
  if (complexity === 'complex') {
    return 'Full system rollback including database migrations, cache clearing, and dependent service coordination.'
  }
  return 'Complex multi-stage rollback requiring coordination across all dependent services and potential data reconciliation.'
}

function generateMonitoringRequirements(change: EndpointChange): string[] {
  const requirements = [
    'Monitor endpoint response times',
    'Track error rates',
    'Monitor authentication failures',
    'Track dependent service health'
  ]

  if (change.changeScope === 'authentication') {
    requirements.push('Monitor token validation success rate')
    requirements.push('Track session creation rate')
  }

  if (change.changeScope === 'response') {
    requirements.push('Monitor response payload sizes')
    requirements.push('Track client error rates')
  }

  return requirements
}
