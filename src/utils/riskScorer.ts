// Weighted API Risk Scoring Engine
import {
  RiskScoreResult,
  RiskBreakdown,
  RiskFactor,
  RiskContributor,
  RiskSeverity,
  RiskTrend,
  RiskThresholds,
  RiskWeights,
  RiskContext
} from '../types/risk'

// ── Risk Weights Configuration ───────────────────────────────────────

const DEFAULT_WEIGHTS: RiskWeights = {
  authentication: 0.25,      // 25% - Critical for security
  sensitiveData: 0.20,       // 20% - Data protection importance
  exposure: 0.15,            // 15% - Public vs private exposure
  dependencyCriticality: 0.10, // 10% - Impact of dependencies
  owaspViolations: 0.20,     // 20% - Security standard compliance
  configurationRisks: 0.10   // 10% - Configuration issues
}

const RISK_THRESHOLDS: RiskThresholds = {
  critical: 80,
  high: 60,
  medium: 40,
  low: 20
}

// ── Risk Factor Scoring Functions ─────────────────────────────────────

function scoreAuthentication(context: RiskContext): RiskFactor {
  let score = 0
  const maxScore = 100
  const issues: string[] = []

  const endpoints = context.endpoints
  const hasSecuritySchemes = Object.keys(context.securitySchemes).length > 0
  const hasGlobalSecurity = context.globalSecurity?.length > 0

  // Check for endpoints without authentication
  const sensitivePaths = ['/users', '/admin', '/account', '/profile', '/settings', '/data', '/api']
  const sensitiveEndpoints = endpoints.filter(ep => 
    sensitivePaths.some(path => ep.path.toLowerCase().includes(path)) ||
    ep.path.toLowerCase().includes('delete') ||
    ep.path.toLowerCase().includes('update')
  )

  const unauthenticatedSensitive = sensitiveEndpoints.filter(ep => 
    !ep.security?.length && !hasGlobalSecurity
  )

  if (!hasSecuritySchemes) {
    score += 30
    issues.push('No security schemes defined')
  }

  if (!hasGlobalSecurity && sensitiveEndpoints.length > 0) {
    score += 20
    issues.push('No global security requirements')
  }

  if (unauthenticatedSensitive.length > 0) {
    const penalty = Math.min(40, unauthenticatedSensitive.length * 10)
    score += penalty
    issues.push(`${unauthenticatedSensitive.length} sensitive endpoints without authentication`)
  }

  // Check for weak authentication methods
  const weakAuth = Object.values(context.securitySchemes).some((scheme: any) => 
    scheme.type === 'apiKey' && scheme.in === 'query'
  )
  if (weakAuth) {
    score += 10
    issues.push('API keys in query parameters (weak authentication)')
  }

  return {
    name: 'Authentication',
    weight: DEFAULT_WEIGHTS.authentication,
    score: Math.min(maxScore, score),
    maxScore,
    description: issues.length > 0 ? issues.join('; ') : 'Strong authentication implemented'
  }
}

function scoreSensitiveData(context: RiskContext): RiskFactor {
  let score = 0
  const maxScore = 100
  const issues: string[] = []

  const sensitiveKeywords = [
    'password', 'ssn', 'social', 'credit', 'card', 'token', 'secret', 
    'key', 'phone', 'email', 'address', 'bank', 'account', 'pin'
  ]

  context.endpoints.forEach(endpoint => {
    const responses = endpoint.responses || {}
    
    Object.values(responses).forEach((response: any) => {
      const schema = response.content?.['application/json']?.schema || response.schema
      
      if (schema && schema.properties) {
        Object.entries(schema.properties).forEach(([propName, propDef]: [string, any]) => {
          const isSensitive = sensitiveKeywords.some(keyword => 
            propName.toLowerCase().includes(keyword)
          )
          
          if (isSensitive) {
            score += 5
            if (!issues.includes(`Sensitive field: ${propName}`)) {
              issues.push(`Sensitive field: ${propName}`)
            }
          }
        })
      }
    })
  })

  // Check for encryption requirements
  const hasHTTPS = context.servers.some((server: any) => 
    server.url?.startsWith('https://')
  )
  
  if (!hasHTTPS && score > 0) {
    score += 15
    issues.push('Sensitive data transmitted over HTTP')
  }

  return {
    name: 'Sensitive Data',
    weight: DEFAULT_WEIGHTS.sensitiveData,
    score: Math.min(maxScore, score),
    maxScore,
    description: issues.length > 0 ? issues.join('; ') : 'No sensitive data exposure detected'
  }
}

function scoreExposure(context: RiskContext): RiskFactor {
  let score = 0
  const maxScore = 100
  const issues: string[] = []

  const endpoints = context.endpoints

  // Check for public exposure of sensitive operations
  const publicEndpoints = endpoints.filter(ep => !ep.security?.length)
  const totalEndpoints = endpoints.length

  if (totalEndpoints > 0) {
    const publicRatio = publicEndpoints.length / totalEndpoints
    if (publicRatio > 0.5) {
      score += 30
      issues.push(`${Math.round(publicRatio * 100)}% of endpoints are publicly accessible`)
    }
  }

  // Check for deprecated endpoints still exposed
  const deprecatedEndpoints = endpoints.filter(ep => ep.deprecated)
  if (deprecatedEndpoints.length > 0) {
    score += 20
    issues.push(`${deprecatedEndpoints.length} deprecated endpoints still exposed`)
  }

  // Check for dangerous HTTP methods
  const dangerousMethods = ['DELETE', 'PUT', 'PATCH']
  const dangerousEndpoints = endpoints.filter(ep => 
    dangerousMethods.includes(ep.method) && !ep.security?.length
  )
  
  if (dangerousEndpoints.length > 0) {
    score += 25
    issues.push(`${dangerousEndpoints.length} dangerous methods without authentication`)
  }

  // Check for admin paths exposed
  const adminPaths = endpoints.filter(ep => 
    ep.path.toLowerCase().includes('/admin') || 
    ep.path.toLowerCase().includes('/manage')
  )
  
  if (adminPaths.length > 0) {
    const exposedAdmin = adminPaths.filter(ep => !ep.security?.length)
    if (exposedAdmin.length > 0) {
      score += 25
      issues.push(`${exposedAdmin.length} admin endpoints potentially exposed`)
    }
  }

  return {
    name: 'Exposure',
    weight: DEFAULT_WEIGHTS.exposure,
    score: Math.min(maxScore, score),
    maxScore,
    description: issues.length > 0 ? issues.join('; ') : 'Proper access controls in place'
  }
}

function scoreDependencyCriticality(context: RiskContext): RiskFactor {
  let score = 0
  const maxScore = 100
  const issues: string[] = []

  // Analyze endpoint dependencies based on path structure
  const criticalPaths = ['/auth', '/payment', '/transaction', '/user', '/admin']
  
  context.endpoints.forEach(endpoint => {
    const isCritical = criticalPaths.some(path => 
      endpoint.path.toLowerCase().includes(path)
    )
    
    if (isCritical) {
      const hasAuth = endpoint.security?.length > 0 || context.globalSecurity?.length > 0
      if (!hasAuth) {
        score += 15
        if (!issues.includes(`Critical path unprotected: ${endpoint.path}`)) {
          issues.push(`Critical path unprotected: ${endpoint.path}`)
        }
      }
    }
  })

  // Check for external service dependencies
  const externalRefs = context.endpoints.filter(ep => 
    ep.description?.toLowerCase().includes('external') ||
    ep.summary?.toLowerCase().includes('external')
  )
  
  if (externalRefs.length > 0) {
    score += 10
    issues.push(`${externalRefs.length} external service dependencies`)
  }

  // Check for circular dependency indicators
  const circularPatterns = ['/loop', '/cycle', '/recursive']
  const potentialCircular = context.endpoints.filter(ep =>
    circularPatterns.some(pattern => ep.path.toLowerCase().includes(pattern))
  )
  
  if (potentialCircular.length > 0) {
    score += 10
    issues.push('Potential circular dependencies detected')
  }

  return {
    name: 'Dependency Criticality',
    weight: DEFAULT_WEIGHTS.dependencyCriticality,
    score: Math.min(maxScore, score),
    maxScore,
    description: issues.length > 0 ? issues.join('; ') : 'Dependencies properly managed'
  }
}

function scoreOWASPViolations(context: RiskContext): RiskFactor {
  let score = 0
  const maxScore = 100
  const issues: string[] = []

  if (!context.securityFindings || context.securityFindings.length === 0) {
    return {
      name: 'OWASP Violations',
      weight: DEFAULT_WEIGHTS.owaspViolations,
      score: 0,
      maxScore,
      description: 'No security violations detected'
    }
  }

  // Score based on severity of findings
  context.securityFindings.forEach((finding: any) => {
    switch (finding.severity) {
      case 'Critical':
        score += 25
        if (!issues.includes(`Critical: ${finding.title}`)) {
          issues.push(`Critical: ${finding.title}`)
        }
        break
      case 'High':
        score += 15
        if (!issues.includes(`High: ${finding.title}`)) {
          issues.push(`High: ${finding.title}`)
        }
        break
      case 'Medium':
        score += 8
        break
      case 'Low':
        score += 3
        break
      case 'Info':
        score += 1
        break
    }
  })

  // Cap at max score
  score = Math.min(maxScore, score)

  return {
    name: 'OWASP Violations',
    weight: DEFAULT_WEIGHTS.owaspViolations,
    score,
    maxScore,
    description: issues.length > 0 ? issues.slice(0, 3).join('; ') : `${context.securityFindings.length} findings`
  }
}

function scoreConfigurationRisks(context: RiskContext): RiskFactor {
  let score = 0
  const maxScore = 100
  const issues: string[] = []

  // Check for HTTP servers
  const httpServers = context.servers.filter((server: any) => 
    server.url?.startsWith('http://')
  )
  if (httpServers.length > 0) {
    score += 30
    issues.push(`${httpServers.length} servers using HTTP instead of HTTPS`)
  }

  // Check for wildcard CORS
  context.endpoints.forEach(endpoint => {
    const responses = endpoint.responses || {}
    Object.values(responses).forEach((response: any) => {
      const headers = response.headers || {}
      if (headers['Access-Control-Allow-Origin']?.value === '*') {
        score += 15
        if (!issues.includes('Wildcard CORS configuration')) {
          issues.push('Wildcard CORS configuration')
        }
      }
    })
  })

  // Check for dangerous HTTP methods
  const dangerousMethods = ['TRACE', 'OPTIONS', 'HEAD']
  const hasDangerous = context.endpoints.some(ep => 
    dangerousMethods.includes(ep.method)
  )
  if (hasDangerous) {
    score += 20
    issues.push('Potentially dangerous HTTP methods enabled')
  }

  // Check for missing rate limiting indicators
  const hasRateLimit = context.endpoints.some(endpoint => {
    const responses = endpoint.responses || {}
    return Object.values(responses).some((response: any) => {
      const headers = response.headers || {}
      return headers['X-RateLimit-Limit'] || headers['X-RateLimit-Remaining']
    })
  })
  
  if (!hasRateLimit && context.endpoints.length > 5) {
    score += 15
    issues.push('No rate limiting headers detected')
  }

  // Check for missing input validation
  const endpointsWithBody = context.endpoints.filter(ep => 
    ep.requestBody && ['POST', 'PUT', 'PATCH'].includes(ep.method)
  )
  const missingValidation = endpointsWithBody.filter(ep => {
    const content = ep.requestBody?.content
    return !content?.['application/json']?.schema
  })
  
  if (missingValidation.length > 0) {
    score += 20
    issues.push(`${missingValidation.length} endpoints missing input validation`)
  }

  return {
    name: 'Configuration Risks',
    weight: DEFAULT_WEIGHTS.configurationRisks,
    score: Math.min(maxScore, score),
    maxScore,
    description: issues.length > 0 ? issues.join('; ') : 'Configuration appears secure'
  }
}

// ── Main Risk Calculator ───────────────────────────────────────────────

export function calculateRiskScore(context: RiskContext): RiskScoreResult {
  const breakdown: RiskBreakdown = {
    authentication: scoreAuthentication(context),
    sensitiveData: scoreSensitiveData(context),
    exposure: scoreExposure(context),
    dependencyCriticality: scoreDependencyCriticality(context),
    owaspViolations: scoreOWASPViolations(context),
    configurationRisks: scoreConfigurationRisks(context)
  }

  // Calculate weighted overall score
  const overallScore = 
    breakdown.authentication.score * breakdown.authentication.weight +
    breakdown.sensitiveData.score * breakdown.sensitiveData.weight +
    breakdown.exposure.score * breakdown.exposure.weight +
    breakdown.dependencyCriticality.score * breakdown.dependencyCriticality.weight +
    breakdown.owaspViolations.score * breakdown.owaspViolations.weight +
    breakdown.configurationRisks.score * breakdown.configurationRisks.weight

  const maxScore = 100
  const severity = determineSeverity(overallScore)
  const topContributors = generateTopContributors(breakdown)
  const trend = calculateTrend(context)

  return {
    overallScore: Math.round(overallScore),
    maxScore,
    severity,
    trend,
    breakdown,
    topContributors,
    timestamp: new Date().toISOString()
  }
}

// ── Helper Functions ─────────────────────────────────────────────────

function determineSeverity(score: number): RiskSeverity {
  if (score >= RISK_THRESHOLDS.critical) return 'Critical'
  if (score >= RISK_THRESHOLDS.high) return 'High'
  if (score >= RISK_THRESHOLDS.medium) return 'Medium'
  if (score >= RISK_THRESHOLDS.low) return 'Low'
  return 'Minimal'
}

function generateTopContributors(breakdown: RiskBreakdown): RiskContributor[] {
  const contributors: RiskContributor[] = []

  Object.entries(breakdown).forEach(([category, factor]) => {
    if (factor.score > 0) {
      const weightedScore = factor.score * factor.weight
      contributors.push({
        category,
        factor: factor.name,
        score: factor.score,
        impact: factor.description,
        recommendation: getRecommendation(category, factor.score)
      })
    }
  })

  // Sort by weighted score (descending)
  contributors.sort((a, b) => (b.score * DEFAULT_WEIGHTS[b.category as keyof RiskWeights]) - (a.score * DEFAULT_WEIGHTS[a.category as keyof RiskWeights]))

  // Return top 5
  return contributors.slice(0, 5)
}

function getRecommendation(category: string, score: number): string {
  const recommendations: Record<string, string> = {
    authentication: 'Implement strong authentication (OAuth2/JWT) and apply to all sensitive endpoints',
    sensitiveData: 'Remove sensitive fields from responses, implement encryption at rest and in transit',
    exposure: 'Review access controls, implement rate limiting, remove deprecated endpoints',
    dependencyCriticality: 'Add authentication to critical paths, implement circuit breakers for external services',
    owaspViolations: 'Address security findings starting with Critical and High severity issues',
    configurationRisks: 'Enable HTTPS, restrict CORS, disable dangerous HTTP methods, add rate limiting'
  }

  if (score < 30) {
    return `${recommendations[category]} - Risk is manageable`
  } else if (score < 60) {
    return recommendations[category]
  } else {
    return `${recommendations[category]} - Immediate action required`
  }
}

function calculateTrend(context: RiskContext): RiskTrend {
  // In a real implementation, this would compare with historical data
  // For now, we'll make an educated guess based on the current state
  
  const hasCriticalIssues = context.securityFindings?.some((f: any) => f.severity === 'Critical')
  const hasManyHighIssues = context.securityFindings?.filter((f: any) => f.severity === 'High').length > 3
  
  if (hasCriticalIssues || hasManyHighIssues) {
    return 'Increasing'
  }
  
  const totalScore = 
    scoreAuthentication(context).score +
    scoreOWASPViolations(context).score +
    scoreConfigurationRisks(context).score

  if (totalScore > 100) {
    return 'Increasing'
  } else if (totalScore < 50) {
    return 'Decreasing'
  }
  
  return 'Stable'
}

// ── Utility Functions ─────────────────────────────────────────────────

export function getRiskColor(severity: RiskSeverity): string {
  const colors: Record<RiskSeverity, string> = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#22c55e',
    Minimal: '#6b7280'
  }
  return colors[severity]
}

export function getRiskScoreColor(score: number): string {
  if (score >= RISK_THRESHOLDS.critical) return '#ef4444'
  if (score >= RISK_THRESHOLDS.high) return '#f97316'
  if (score >= RISK_THRESHOLDS.medium) return '#eab308'
  if (score >= RISK_THRESHOLDS.low) return '#22c55e'
  return '#6b7280'
}

export function compareRiskScores(current: number, previous: number): {
  change: number
  percentage: number
  trend: RiskTrend
} {
  const change = current - previous
  const percentage = previous > 0 ? (change / previous) * 100 : 0
  
  let trend: RiskTrend = 'Stable'
  if (change > 5) trend = 'Increasing'
  else if (change < -5) trend = 'Decreasing'
  
  return { change, percentage: Math.round(percentage), trend }
}
