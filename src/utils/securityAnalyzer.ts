// API Security Analyzer - OWASP API Security Top 10 inspired rules
import {
  SecurityFinding,
  SecurityAnalysisResult,
  SecuritySummary,
  SecurityContext,
  Severity,
  Confidence,
  OWASPCategory
} from '../types/security'
import { calculateRiskScore } from '../utils/riskScorer'
import { RiskContext } from '../types/risk'
import { VulnerabilityContext } from '../types/ai'
import { aiProviderService } from '../services/aiProviderService'

// ── Security Rules ───────────────────────────────────────────────────

const SECURITY_RULES = [
  // API1: Broken Object Level Authorization
  {
    id: 'BROKEN_OBJECT_AUTH',
    name: 'Broken Object Level Authorization',
    description: 'Endpoints may allow unauthorized access to objects',
    owaspCategory: 'API1:2019-Broken Object Level Authorization' as OWASPCategory,
    severity: 'Critical' as Severity,
    check: (context: SecurityContext): SecurityFinding[] => {
      const findings: SecurityFinding[] = []
      
      context.endpoints.forEach(endpoint => {
        const path = endpoint.path
        const method = endpoint.method
        
        // Check for ID parameters without proper authorization
        const hasIdParam = endpoint.parameters?.some((p: any) => 
          p.name.toLowerCase().includes('id') || p.name.toLowerCase().includes('uuid')
        )
        
        const hasAuth = endpoint.security?.length > 0 || context.globalSecurity?.length > 0
        
        if (hasIdParam && !hasAuth && ['GET', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
          findings.push({
            id: `BROKEN_OBJECT_AUTH_${endpoint.operationId || path}_${method}`,
            title: 'Potential Broken Object Level Authorization',
            severity: 'Critical',
            businessImpact: 'Attackers can access or modify resources belonging to other users',
            technicalDetails: `Endpoint ${method} ${path} accepts ID parameters but lacks authentication/authorization requirements`,
            suggestedFix: 'Add authentication and implement proper object-level authorization checks',
            owaspCategory: 'API1:2019-Broken Object Level Authorization',
            confidence: 'Medium',
            affectedEndpoint: path,
            affectedMethod: method
          })
        }
      })
      
      return findings
    }
  },

  // API2: Broken Authentication
  {
    id: 'MISSING_AUTHENTICATION',
    name: 'Missing Authentication',
    description: 'Endpoints lack authentication requirements',
    owaspCategory: 'API2:2019-Broken Authentication' as OWASPCategory,
    severity: 'Critical' as Severity,
    check: (context: SecurityContext): SecurityFinding[] => {
      const findings: SecurityFinding[] = []
      
      const sensitivePaths = ['/users', '/admin', '/account', '/profile', '/settings', '/data']
      
      context.endpoints.forEach(endpoint => {
        const path = endpoint.path.toLowerCase()
        const method = endpoint.method
        
        const isSensitivePath = sensitivePaths.some(sensitive => path.includes(sensitive))
        const hasAuth = endpoint.security?.length > 0 || context.globalSecurity?.length > 0
        
        if (isSensitivePath && !hasAuth && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
          findings.push({
            id: `MISSING_AUTH_${endpoint.operationId || path}_${method}`,
            title: 'Missing Authentication on Sensitive Endpoint',
            severity: 'Critical',
            businessImpact: 'Unauthorized users can access sensitive operations and data',
            technicalDetails: `Endpoint ${method} ${endpoint.path} handles sensitive operations but has no authentication requirement`,
            suggestedFix: 'Add authentication requirement using OAuth2, JWT, or API keys',
            owaspCategory: 'API2:2019-Broken Authentication',
            confidence: 'High',
            affectedEndpoint: path,
            affectedMethod: method
          })
        }
      })
      
      return findings
    }
  },

  // API3: Excessive Data Exposure
  {
    id: 'SENSITIVE_DATA_EXPOSURE',
    name: 'Sensitive Data Exposure',
    description: 'Endpoints may expose sensitive data',
    owaspCategory: 'API3:2019-Excessive Data Exposure' as OWASPCategory,
    severity: 'High' as Severity,
    check: (context: SecurityContext): SecurityFinding[] => {
      const findings: SecurityFinding[] = []
      
      const sensitiveKeywords = ['password', 'ssn', 'credit', 'token', 'secret', 'key', 'phone', 'email']
      
      context.endpoints.forEach(endpoint => {
        const responses = endpoint.responses || {}
        
        Object.values(responses).forEach((response: any) => {
          const schema = response.content?.['application/json']?.schema || response.schema
          
          if (schema && schema.properties) {
            const exposedSensitiveFields = Object.keys(schema.properties).filter(prop =>
              sensitiveKeywords.some(keyword => prop.toLowerCase().includes(keyword))
            )
            
            if (exposedSensitiveFields.length > 0) {
              findings.push({
                id: `SENSITIVE_DATA_${endpoint.operationId || endpoint.path}`,
                title: 'Sensitive Data Exposure in Response',
                severity: 'High',
                businessImpact: 'Sensitive user data may be exposed to unauthorized parties',
                technicalDetails: `Endpoint ${endpoint.method} ${endpoint.path} exposes potentially sensitive fields: ${exposedSensitiveFields.join(', ')}`,
                suggestedFix: 'Remove sensitive fields from responses or implement proper data filtering',
                owaspCategory: 'API3:2019-Excessive Data Exposure',
                confidence: 'Medium',
                affectedEndpoint: endpoint.path,
                affectedMethod: endpoint.method
              })
            }
          }
        })
      })
      
      return findings
    }
  },

  // API4: Lack of Resources & Rate Limiting
  {
    id: 'MISSING_RATE_LIMITING',
    name: 'Missing Rate Limiting',
    description: 'No rate limiting headers or configuration detected',
    owaspCategory: 'API4:2019-Lack of Resources & Rate Limiting' as OWASPCategory,
    severity: 'Medium' as Severity,
    check: (context: SecurityContext): SecurityFinding[] => {
      const findings: SecurityFinding[] = []
      
      // Check for rate limiting headers in responses
      const hasRateLimitHeaders = context.endpoints.some(endpoint => {
        const responses = endpoint.responses || {}
        return Object.values(responses).some((response: any) => {
          const headers = response.headers || {}
          return headers['X-RateLimit-Limit'] || headers['X-RateLimit-Remaining'] || headers['Retry-After']
        })
      })
      
      if (!hasRateLimitHeaders && context.endpoints.length > 0) {
        findings.push({
          id: 'MISSING_RATE_LIMITING_GLOBAL',
          title: 'Missing Rate Limiting Configuration',
          severity: 'Medium',
          businessImpact: 'API may be vulnerable to DoS attacks and abuse',
          technicalDetails: 'No rate limiting headers detected in API responses',
          suggestedFix: 'Implement rate limiting using headers like X-RateLimit-Limit, X-RateLimit-Remaining',
          owaspCategory: 'API4:2019-Lack of Resources & Rate Limiting',
          confidence: 'Low',
          affectedEndpoint: 'Global',
          references: ['https://owasp.org/www-project-api-security/']
        })
      }
      
      return findings
    }
  },

  // API5: Broken Function Level Authorization
  {
    id: 'BROKEN_FUNCTION_AUTH',
    name: 'Broken Function Level Authorization',
    description: 'Admin functions may be accessible to regular users',
    owaspCategory: 'API5:2019-Broken Function Level Authorization' as OWASPCategory,
    severity: 'Critical' as Severity,
    check: (context: SecurityContext): SecurityFinding[] => {
      const findings: SecurityFinding[] = []
      
      const adminPaths = ['/admin', '/manage', '/config', '/settings', '/users/delete', '/users/create']
      
      context.endpoints.forEach(endpoint => {
        const path = endpoint.path.toLowerCase()
        const isAdminPath = adminPaths.some(admin => path.includes(admin))
        
        if (isAdminPath) {
          const hasAuth = endpoint.security?.length > 0 || context.globalSecurity?.length > 0
          
          if (!hasAuth) {
            findings.push({
              id: `BROKEN_FUNCTION_AUTH_${endpoint.operationId || path}`,
              title: 'Admin Function Without Authorization',
              severity: 'Critical',
              businessImpact: 'Regular users may access administrative functions',
              technicalDetails: `Endpoint ${endpoint.method} ${endpoint.path} appears to be an admin function but lacks authorization`,
              suggestedFix: 'Add role-based access control (RBAC) for administrative endpoints',
              owaspCategory: 'API5:2019-Broken Function Level Authorization',
              confidence: 'High',
              affectedEndpoint: path,
              affectedMethod: endpoint.method
            })
          }
        }
      })
      
      return findings
    }
  },

  // API7: Security Misconfiguration - HTTP instead of HTTPS
  {
    id: 'HTTP_INSECURE',
    name: 'HTTP Instead of HTTPS',
    description: 'Server URLs use HTTP instead of HTTPS',
    owaspCategory: 'API7:2019-Security Misconfiguration' as OWASPCategory,
    severity: 'High' as Severity,
    check: (context: SecurityContext): SecurityFinding[] => {
      const findings: SecurityFinding[] = []
      
      context.servers.forEach(server => {
        const url = server.url || ''
        if (url.startsWith('http://')) {
          findings.push({
            id: `HTTP_INSECURE_${server.url}`,
            title: 'Insecure HTTP Server URL',
            severity: 'High',
            businessImpact: 'Data transmitted in plaintext can be intercepted',
            technicalDetails: `Server URL ${url} uses HTTP instead of HTTPS`,
            suggestedFix: 'Configure server to use HTTPS with valid TLS certificates',
            owaspCategory: 'API7:2019-Security Misconfiguration',
            confidence: 'High',
            affectedEndpoint: server.url,
            location: 'servers'
          })
        }
      })
      
      return findings
    }
  },

  // API7: Security Misconfiguration - Missing Security Schemes
  {
    id: 'MISSING_SECURITY_SCHEMES',
    name: 'Missing Security Schemes',
    description: 'API lacks defined security schemes',
    owaspCategory: 'API7:2019-Security Misconfiguration' as OWASPCategory,
    severity: 'High' as Severity,
    check: (context: SecurityContext): SecurityFinding[] => {
      const findings: SecurityFinding[] = []
      
      const hasSecuritySchemes = Object.keys(context.securitySchemes).length > 0
      
      if (!hasSecuritySchemes && context.endpoints.length > 0) {
        findings.push({
          id: 'MISSING_SECURITY_SCHEMES_GLOBAL',
          title: 'No Security Schemes Defined',
          severity: 'High',
          businessImpact: 'API lacks authentication and authorization mechanisms',
          technicalDetails: 'No security schemes (OAuth2, API keys, JWT) are defined in the specification',
          suggestedFix: 'Define security schemes in components/securitySchemes and apply them to endpoints',
          owaspCategory: 'API7:2019-Security Misconfiguration',
          confidence: 'High',
          affectedEndpoint: 'Global',
          location: 'components/securitySchemes'
        })
      }
      
      return findings
    }
  },

  // Deprecated Endpoints
  {
    id: 'DEPRECATED_ENDPOINTS',
    name: 'Deprecated Endpoints',
    description: 'Endpoints marked as deprecated but still in use',
    owaspCategory: 'API9:2019-Improper Assets Management' as OWASPCategory,
    severity: 'Medium' as Severity,
    check: (context: SecurityContext): SecurityFinding[] => {
      const findings: SecurityFinding[] = []
      
      context.endpoints.forEach(endpoint => {
        if (endpoint.deprecated) {
          findings.push({
            id: `DEPRECATED_${endpoint.operationId || endpoint.path}`,
            title: 'Deprecated Endpoint Still Available',
            severity: 'Medium',
            businessImpact: 'Deprecated endpoints may have security vulnerabilities and should be removed',
            technicalDetails: `Endpoint ${endpoint.method} ${endpoint.path} is marked as deprecated`,
            suggestedFix: 'Remove deprecated endpoints or provide a clear deprecation timeline',
            owaspCategory: 'API9:2019-Improper Assets Management',
            confidence: 'High',
            affectedEndpoint: endpoint.path,
            affectedMethod: endpoint.method
          })
        }
      })
      
      return findings
    }
  },

  // Missing Input Validation
  {
    id: 'MISSING_INPUT_VALIDATION',
    name: 'Missing Input Validation',
    description: 'Endpoints lack proper input validation schemas',
    owaspCategory: 'API8:2019-Injection' as OWASPCategory,
    severity: 'High' as Severity,
    check: (context: SecurityContext): SecurityFinding[] => {
      const findings: SecurityFinding[] = []
      
      context.endpoints.forEach(endpoint => {
        const method = endpoint.method
        const hasRequestBody = endpoint.requestBody && endpoint.requestBody.content
        
        if (hasRequestBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
          const content = endpoint.requestBody.content
          const hasSchema = content['application/json']?.schema || content['application/x-www-form-urlencoded']?.schema
          
          if (!hasSchema) {
            findings.push({
              id: `MISSING_VALIDATION_${endpoint.operationId || endpoint.path}`,
              title: 'Missing Request Body Schema',
              severity: 'High',
              businessImpact: 'Lack of input validation can lead to injection attacks',
              technicalDetails: `Endpoint ${method} ${endpoint.path} accepts request body but has no schema validation`,
              suggestedFix: 'Define JSON schema for request body with proper type constraints and validation rules',
              owaspCategory: 'API8:2019-Injection',
              confidence: 'Medium',
              affectedEndpoint: endpoint.path,
              affectedMethod: method
            })
          }
        }
      })
      
      return findings
    }
  },

  // Dangerous HTTP Methods
  {
    id: 'DANGEROUS_HTTP_METHODS',
    name: 'Dangerous HTTP Methods',
    description: 'Potentially dangerous HTTP methods enabled',
    owaspCategory: 'API7:2019-Security Misconfiguration' as OWASPCategory,
    severity: 'Medium' as Severity,
    check: (context: SecurityContext): SecurityFinding[] => {
      const findings: SecurityFinding[] = []
      
      const dangerousMethods = ['TRACE', 'OPTIONS', 'HEAD']
      
      context.endpoints.forEach(endpoint => {
        if (dangerousMethods.includes(endpoint.method)) {
          findings.push({
            id: `DANGEROUS_METHOD_${endpoint.operationId || endpoint.path}`,
            title: `Potentially Dangerous HTTP Method: ${endpoint.method}`,
            severity: 'Medium',
            businessImpact: 'Certain HTTP methods can be exploited for information disclosure or attacks',
            technicalDetails: `Endpoint uses ${endpoint.method} method which may expose server information`,
            suggestedFix: 'Disable unnecessary HTTP methods or implement proper access controls',
            owaspCategory: 'API7:2019-Security Misconfiguration',
            confidence: 'Medium',
            affectedEndpoint: endpoint.path,
            affectedMethod: endpoint.method
          })
        }
      })
      
      return findings
    }
  },

  // Weak CORS Configuration
  {
    id: 'WEAK_CORS',
    name: 'Weak CORS Configuration',
    description: 'CORS may allow unauthorized cross-origin requests',
    owaspCategory: 'API7:2019-Security Misconfiguration' as OWASPCategory,
    severity: 'Medium' as Severity,
    check: (context: SecurityContext): SecurityFinding[] => {
      const findings: SecurityFinding[] = []
      
      context.endpoints.forEach(endpoint => {
        const responses = endpoint.responses || {}
        
        Object.values(responses).forEach((response: any) => {
          const headers = response.headers || {}
          const accessControl = headers['Access-Control-Allow-Origin']
          
          if (accessControl && (accessControl.value === '*' || accessControl === '*')) {
            findings.push({
              id: `WEAK_CORS_${endpoint.operationId || endpoint.path}`,
              title: 'Overly Permissive CORS Configuration',
              severity: 'Medium',
              businessImpact: 'Allows any origin to access the API, potentially enabling CSRF attacks',
              technicalDetails: `Endpoint ${endpoint.method} ${endpoint.path} has Access-Control-Allow-Origin set to *`,
              suggestedFix: 'Restrict CORS to specific trusted origins instead of using wildcard',
              owaspCategory: 'API7:2019-Security Misconfiguration',
              confidence: 'High',
              affectedEndpoint: endpoint.path,
              affectedMethod: endpoint.method
            })
          }
        })
      })
      
      return findings
    }
  }
]

// ── Main Analyzer ─────────────────────────────────────────────────────

export function analyzeSecurity(spec: any, specId: string): SecurityAnalysisResult {
  const context = buildSecurityContext(spec)
  const findings: SecurityFinding[] = []
  
  // Run all security rules
  for (const rule of SECURITY_RULES) {
    const ruleFindings = rule.check(context)
    findings.push(...ruleFindings)
  }
  
  const summary = generateSummary(findings)
  
  // Calculate risk score using the risk scoring engine
  const riskContext: RiskContext = {
    spec,
    endpoints: context.endpoints,
    securityFindings: findings,
    servers: context.servers,
    securitySchemes: context.securitySchemes,
    globalSecurity: context.globalSecurity
  }
  
  // Note: Risk score calculation is separate and can be called by the consumer
  // For now, we'll keep it in the summary as a simple calculation
  
  return {
    findings,
    summary,
    timestamp: new Date().toISOString(),
    specId
  }
}

// ── AI Recommendation Integration ───────────────────────────────────────

export async function generateAIRecommendation(finding: SecurityFinding) {
  const vulnerabilityContext: VulnerabilityContext = {
    id: finding.id,
    title: finding.title,
    severity: finding.severity,
    owaspCategory: finding.owaspCategory,
    affectedEndpoint: finding.affectedEndpoint,
    affectedMethod: finding.affectedMethod,
    technicalDetails: finding.technicalDetails
  }

  try {
    const response = await aiProviderService.generateRecommendation(vulnerabilityContext)
    return response.recommendation
  } catch (error) {
    console.error('Failed to generate AI recommendation:', error)
    return null
  }
}

export async function generateBatchAIRecommendations(findings: SecurityFinding[]) {
  const vulnerabilityContexts: VulnerabilityContext[] = findings.map(finding => ({
    id: finding.id,
    title: finding.title,
    severity: finding.severity,
    owaspCategory: finding.owaspCategory,
    affectedEndpoint: finding.affectedEndpoint,
    affectedMethod: finding.affectedMethod,
    technicalDetails: finding.technicalDetails
  }))

  try {
    const responses = await aiProviderService.generateBatchRecommendations(vulnerabilityContexts)
    return responses.map(r => r.recommendation)
  } catch (error) {
    console.error('Failed to generate batch AI recommendations:', error)
    return []
  }
}

export function analyzeSecurityWithRisk(spec: any, specId: string): SecurityAnalysisResult {
  const securityResult = analyzeSecurity(spec, specId)
  
  // Build risk context for risk scoring
  const riskContext: RiskContext = {
    spec,
    endpoints: buildSecurityContext(spec).endpoints,
    securityFindings: securityResult.findings,
    servers: spec.servers || [],
    securitySchemes: spec.components?.securitySchemes || spec.securityDefinitions || {},
    globalSecurity: spec.security || []
  }
  
  // Calculate risk score
  const riskScore = calculateRiskScore(riskContext)
  
  // Add risk score to summary
  securityResult.summary.riskScore = riskScore.overallScore
  
  return securityResult
}

// ── Helper Functions ───────────────────────────────────────────────────

function buildSecurityContext(spec: any): SecurityContext {
  const endpoints: any[] = []
  
  // Extract endpoints from paths
  if (spec.paths) {
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace']
      
      for (const method of methods) {
        const operation = (pathItem as any)[method]
        if (operation) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            operationId: operation.operationId,
            summary: operation.summary,
            description: operation.description,
            parameters: [...((pathItem as any).parameters || []), ...(operation.parameters || [])],
            requestBody: operation.requestBody,
            responses: operation.responses,
            tags: operation.tags,
            deprecated: operation.deprecated || false,
            security: operation.security
          })
        }
      }
    }
  }
  
  return {
    spec,
    endpoints,
    servers: spec.servers || [],
    securitySchemes: spec.components?.securitySchemes || spec.securityDefinitions || {},
    globalSecurity: spec.security || []
  }
}

function generateSummary(findings: SecurityFinding[]): SecuritySummary {
  const summary: SecuritySummary = {
    totalFindings: findings.length,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    infoCount: 0,
    riskScore: 0
  }
  
  findings.forEach(finding => {
    switch (finding.severity) {
      case 'Critical':
        summary.criticalCount++
        summary.riskScore += 10
        break
      case 'High':
        summary.highCount++
        summary.riskScore += 7
        break
      case 'Medium':
        summary.mediumCount++
        summary.riskScore += 4
        break
      case 'Low':
        summary.lowCount++
        summary.riskScore += 2
        break
      case 'Info':
        summary.infoCount++
        summary.riskScore += 1
        break
    }
  })
  
  // Normalize risk score to 0-100
  summary.riskScore = Math.min(100, summary.riskScore)
  
  return summary
}

// ── Utility Functions ─────────────────────────────────────────────────

export function getFindingsBySeverity(findings: SecurityFinding[], severity: Severity): SecurityFinding[] {
  return findings.filter(f => f.severity === severity)
}

export function getFindingsByCategory(findings: SecurityFinding[], category: OWASPCategory): SecurityFinding[] {
  return findings.filter(f => f.owaspCategory === category)
}

export function getFindingsByEndpoint(findings: SecurityFinding[], endpoint: string): SecurityFinding[] {
  return findings.filter(f => f.affectedEndpoint === endpoint)
}
