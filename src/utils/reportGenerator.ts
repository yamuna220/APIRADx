// Report Generator for downloadable security reports
import {
  SecurityReport,
  ExecutiveSummary,
  SecurityFindingReport,
  RiskScoreReport,
  OWASPMapping,
  DependencyGraphReport,
  AIRecommendationReport,
  ReportGenerationOptions,
  ExportResult,
  ReportMetadata,
  ReportFormat,
  ReportType
} from '../types/report'
import { SecurityAnalysisResult } from '../types/security'
import { RiskScoreResult } from '../types/risk'
import { DependencyGraph } from '../types/dependency'
import { AIRecommendation } from '../types/ai'
import { LegacyParsedAPISpec } from '../utils/openapiParser'

// ── Executive Summary Generation ───────────────────────────────────────

function generateExecutiveSummary(
  spec: LegacyParsedAPISpec,
  securityResult: SecurityAnalysisResult,
  riskScore: RiskScoreResult
): ExecutiveSummary {
  const { summary } = securityResult
  
  const keyRisks = securityResult.findings
    .filter(f => f.severity === 'Critical' || f.severity === 'High')
    .slice(0, 5)
    .map(f => `${f.title} on ${f.affectedEndpoint}`)

  const recommendations = [
    'Address critical and high severity findings immediately',
    'Implement proper authentication and authorization mechanisms',
    'Enable HTTPS for all endpoints',
    'Add rate limiting to prevent abuse',
    'Regular security audits and penetration testing'
  ]

  return {
    title: 'API Security Assessment Report',
    generatedAt: new Date().toISOString(),
    specName: spec.name,
    specVersion: spec.version || '1.0.0',
    overallRiskScore: riskScore.overallScore,
    overallSeverity: riskScore.severity,
    totalEndpoints: spec.endpoints,
    totalFindings: summary.totalFindings,
    criticalFindings: summary.criticalCount,
    highFindings: summary.highCount,
    mediumFindings: summary.mediumCount,
    lowFindings: summary.lowCount,
    keyRisks,
    recommendations
  }
}

// ── Security Findings Aggregation ───────────────────────────────────────

function generateSecurityFindingsReport(securityResult: SecurityAnalysisResult): SecurityFindingReport[] {
  return securityResult.findings.map(finding => ({
    id: finding.id,
    title: finding.title,
    severity: finding.severity,
    owaspCategory: finding.owaspCategory,
    affectedEndpoint: finding.affectedEndpoint,
    affectedMethod: finding.affectedMethod || 'N/A',
    businessImpact: finding.businessImpact,
    technicalDetails: finding.technicalDetails,
    suggestedFix: finding.suggestedFix,
    confidence: finding.confidence
  }))
}

// ── Risk Score Integration ───────────────────────────────────────────

function generateRiskScoreReport(riskScore: RiskScoreResult): RiskScoreReport {
  const breakdown = Object.entries(riskScore.breakdown).map(([key, factor]) => ({
    factor: factor.name,
    score: factor.score,
    weight: factor.weight,
    description: factor.description
  }))

  const topContributors = riskScore.topContributors.map(contributor => ({
    factor: contributor.factor,
    impact: parseFloat(contributor.impact) || 0,
    description: contributor.category,
    recommendation: contributor.recommendation
  }))

  return {
    overallScore: riskScore.overallScore,
    severity: riskScore.severity,
    trend: riskScore.trend,
    breakdown,
    topContributors
  }
}

// ── OWASP Mapping Generation ───────────────────────────────────────────

function generateOWASPMapping(securityResult: SecurityAnalysisResult): OWASPMapping[] {
  const owaspMap = new Map<string, OWASPMapping>()

  securityResult.findings.forEach(finding => {
    const category = finding.owaspCategory
    if (!owaspMap.has(category)) {
      owaspMap.set(category, {
        category,
        count: 0,
        severity: finding.severity,
        description: getOWASPDescription(category),
        findings: []
      })
    }

    const mapping = owaspMap.get(category)!
    mapping.count++
    mapping.findings.push(finding.title)
    
    // Update severity if this finding is more severe
    const severityOrder = ['Critical', 'High', 'Medium', 'Low']
    if (severityOrder.indexOf(finding.severity) < severityOrder.indexOf(mapping.severity)) {
      mapping.severity = finding.severity
    }
  })

  return Array.from(owaspMap.values()).sort((a, b) => b.count - a.count)
}

function getOWASPDescription(category: string): string {
  const descriptions: Record<string, string> = {
    'API1:2019-Broken Object Level Authorization': 'APIs tend to expose endpoints that handle object identifiers, creating a wide attack surface for Access Control issues.',
    'API2:2019-Broken Authentication': 'Authentication mechanisms are often implemented incorrectly, allowing attackers to compromise authentication tokens or exploit implementation flaws.',
    'API3:2019-Excessive Data Exposure': 'APIs tend to expose more data than is needed by the UI or business logic, leading to data exposure.',
    'API4:2019-Lack of Resources & Rate Limiting': 'APIs do not impose limits on the resources or frequency of requests, leading to denial of service.',
    'API5:2019-Broken Function Level Authorization': 'Complex access control policies with different hierarchies, groups, and roles create confusion about authorization.',
    'API6:2019-Mass Assignment': 'Endpoints that accept data in the request body automatically bind that data to code variables and internal objects.',
    'API7:2019-Security Misconfiguration': 'APIs and supporting infrastructure are often misconfigured, leaving them vulnerable to attacks.',
    'API8:2019-Injection': 'Injection flaws occur when untrusted data is sent to an interpreter as part of a command or query.',
    'API9:2019-Improper Assets Management': 'APIs tend to expose more endpoints than traditional web applications, making proper asset management critical.',
    'API10:2019-Insufficient Logging & Monitoring': 'Insufficient logging and monitoring, along with missing integration with incident response, allows attackers to attack without detection.'
  }

  return descriptions[category] || 'OWASP API Security Top 10 vulnerability category'
}

// ── Dependency Graph Inclusion ─────────────────────────────────────────

function generateDependencyGraphReport(dependencyGraph: DependencyGraph): DependencyGraphReport {
  const services = dependencyGraph.nodes.map(node => ({
    id: node.id,
    name: node.label,
    type: node.type,
    risk: node.risk,
    health: node.health,
    endpoints: node.endpoints,
    isExternal: node.isExternal
  }))

  return {
    totalNodes: dependencyGraph.metadata.totalNodes,
    totalEdges: dependencyGraph.metadata.totalEdges,
    criticalPaths: dependencyGraph.metadata.criticalPaths,
    circularDependencies: dependencyGraph.metadata.circularDependencies,
    disconnectedServices: dependencyGraph.metadata.disconnectedServices,
    singlePointsOfFailure: dependencyGraph.metadata.singlePointsOfFailure,
    services
  }
}

// ── AI Recommendations Integration ───────────────────────────────────

function generateAIRecommendationsReport(
  securityResult: SecurityAnalysisResult,
  aiRecommendations: AIRecommendation[]
): AIRecommendationReport[] {
  return aiRecommendations.map((rec, index) => {
    const finding = securityResult.findings[index]
    return {
      vulnerabilityId: finding?.id || 'unknown',
      vulnerabilityTitle: finding?.title || 'Unknown',
      explanation: rec.explanation,
      businessImpact: rec.businessImpact,
      fix: rec.fix,
      estimatedTime: rec.estimatedTime,
      codeExample: {
        language: rec.codeExample.language,
        before: rec.codeExample.before,
        after: rec.codeExample.after,
        description: rec.codeExample.description
      },
      priority: rec.priority,
      confidence: rec.confidence
    }
  })
}

// ── Main Report Generation ───────────────────────────────────────────

export function generateSecurityReport(
  spec: LegacyParsedAPISpec,
  securityResult: SecurityAnalysisResult,
  riskScore: RiskScoreResult,
  dependencyGraph: DependencyGraph,
  aiRecommendations: AIRecommendation[],
  options: ReportGenerationOptions
): SecurityReport {
  const executiveSummary = options.includeExecutiveSummary
    ? generateExecutiveSummary(spec, securityResult, riskScore)
    : {} as ExecutiveSummary

  const securityFindings = options.includeSecurityFindings
    ? generateSecurityFindingsReport(securityResult)
    : []

  const riskScoreReport = options.includeRiskScore
    ? generateRiskScoreReport(riskScore)
    : {} as RiskScoreReport

  const owaspMapping = options.includeOWASPMapping
    ? generateOWASPMapping(securityResult)
    : []

  const dependencyGraphReport = options.includeDependencyGraph
    ? generateDependencyGraphReport(dependencyGraph)
    : {} as DependencyGraphReport

  const aiRecommendationsReport = options.includeAIRecommendations
    ? generateAIRecommendationsReport(securityResult, aiRecommendations)
    : []

  const metadata: ReportMetadata = {
    reportId: `report_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    generatedBy: 'API Security Analyzer',
    specId: spec.id,
    specName: spec.name,
    specVersion: spec.version || '1.0.0',
    reportType: options.reportType,
    format: options.format
  }

  return {
    executiveSummary,
    securityFindings,
    riskScore: riskScoreReport,
    owaspMapping,
    dependencyGraph: dependencyGraphReport,
    aiRecommendations: aiRecommendationsReport,
    metadata
  }
}

// ── CSV Export ─────────────────────────────────────────────────────

export function exportToCSV(report: SecurityReport): ExportResult {
  try {
    const rows: string[] = []

    // Executive Summary
    rows.push('EXECUTIVE SUMMARY')
    rows.push(`Title,${report.executiveSummary.title}`)
    rows.push(`Generated At,${report.executiveSummary.generatedAt}`)
    rows.push(`Spec Name,${report.executiveSummary.specName}`)
    rows.push(`Overall Risk Score,${report.executiveSummary.overallRiskScore}`)
    rows.push(`Overall Severity,${report.executiveSummary.overallSeverity}`)
    rows.push(`Total Endpoints,${report.executiveSummary.totalEndpoints}`)
    rows.push(`Total Findings,${report.executiveSummary.totalFindings}`)
    rows.push(`Critical Findings,${report.executiveSummary.criticalFindings}`)
    rows.push(`High Findings,${report.executiveSummary.highFindings}`)
    rows.push(`Medium Findings,${report.executiveSummary.mediumFindings}`)
    rows.push(`Low Findings,${report.executiveSummary.lowFindings}`)
    rows.push('')

    // Security Findings
    rows.push('SECURITY FINDINGS')
    rows.push('ID,Title,Severity,OWASP Category,Affected Endpoint,Affected Method,Business Impact,Technical Details,Suggested Fix,Confidence')
    report.securityFindings.forEach(finding => {
      const row = [
        finding.id,
        `"${finding.title}"`,
        finding.severity,
        `"${finding.owaspCategory}"`,
        finding.affectedEndpoint,
        finding.affectedMethod,
        `"${finding.businessImpact.replace(/"/g, '""')}"`,
        `"${finding.technicalDetails.replace(/"/g, '""')}"`,
        `"${finding.suggestedFix.replace(/"/g, '""')}"`,
        finding.confidence
      ]
      rows.push(row.join(','))
    })
    rows.push('')

    // Risk Score Breakdown
    rows.push('RISK SCORE BREAKDOWN')
    rows.push(`Overall Score,${report.riskScore.overallScore}`)
    rows.push(`Severity,${report.riskScore.severity}`)
    rows.push(`Trend,${report.riskScore.trend}`)
    rows.push('')
    rows.push('Factor,Score,Weight,Description')
    report.riskScore.breakdown.forEach(breakdown => {
      rows.push(`${breakdown.factor},${breakdown.score},${breakdown.weight},"${breakdown.description}"`)
    })
    rows.push('')

    // OWASP Mapping
    rows.push('OWASP MAPPING')
    rows.push('Category,Count,Severity,Description')
    report.owaspMapping.forEach(mapping => {
      rows.push(`"${mapping.category}",${mapping.count},${mapping.severity},"${mapping.description}"`)
    })
    rows.push('')

    // Dependency Graph
    rows.push('DEPENDENCY GRAPH')
    rows.push(`Total Nodes,${report.dependencyGraph.totalNodes}`)
    rows.push(`Total Edges,${report.dependencyGraph.totalEdges}`)
    rows.push(`Circular Dependencies,${report.dependencyGraph.circularDependencies.length}`)
    rows.push(`Disconnected Services,${report.dependencyGraph.disconnectedServices.length}`)
    rows.push(`Single Points of Failure,${report.dependencyGraph.singlePointsOfFailure.length}`)
    rows.push('')
    rows.push('Service ID,Service Name,Type,Risk,Health,Endpoints,Is External')
    report.dependencyGraph.services.forEach(service => {
      rows.push(`${service.id},"${service.name}",${service.type},${service.risk},${service.health},${service.endpoints},${service.isExternal}`)
    })
    rows.push('')

    // AI Recommendations
    rows.push('AI RECOMMENDATIONS')
    rows.push('Vulnerability ID,Vulnerability Title,Priority,Estimated Time,Explanation,Business Impact,Fix,Confidence')
    report.aiRecommendations.forEach(rec => {
      const row = [
        rec.vulnerabilityId,
        `"${rec.vulnerabilityTitle}"`,
        rec.priority,
        rec.estimatedTime,
        `"${rec.explanation.replace(/"/g, '""')}"`,
        `"${rec.businessImpact.replace(/"/g, '""')}"`,
        `"${rec.fix.replace(/"/g, '""')}"`,
        rec.confidence
      ]
      rows.push(row.join(','))
    })

    const csvContent = rows.join('\n')
    const filename = `security_report_${report.metadata.specId}_${Date.now()}.csv`

    return {
      success: true,
      data: csvContent,
      filename,
      mimeType: 'text/csv'
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to generate CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ── PDF Export (Text-based for now, can be extended with jsPDF) ───────

export function exportToPDF(report: SecurityReport): ExportResult {
  try {
    const lines: string[] = []

    // Title Page
    lines.push('='.repeat(80))
    lines.push('API SECURITY ASSESSMENT REPORT'.padStart(40))
    lines.push('='.repeat(80))
    lines.push('')
    lines.push(`Generated: ${report.executiveSummary.generatedAt}`)
    lines.push(`Spec: ${report.executiveSummary.specName}`)
    lines.push(`Version: ${report.executiveSummary.specVersion}`)
    lines.push('')

    // Executive Summary
    lines.push('-'.repeat(80))
    lines.push('EXECUTIVE SUMMARY')
    lines.push('-'.repeat(80))
    lines.push('')
    lines.push(`Overall Risk Score: ${report.executiveSummary.overallRiskScore}/100`)
    lines.push(`Severity: ${report.executiveSummary.overallSeverity}`)
    lines.push(`Total Endpoints: ${report.executiveSummary.totalEndpoints}`)
    lines.push(`Total Findings: ${report.executiveSummary.totalFindings}`)
    lines.push('')
    lines.push('Findings by Severity:')
    lines.push(`  Critical: ${report.executiveSummary.criticalFindings}`)
    lines.push(`  High: ${report.executiveSummary.highFindings}`)
    lines.push(`  Medium: ${report.executiveSummary.mediumFindings}`)
    lines.push(`  Low: ${report.executiveSummary.lowFindings}`)
    lines.push('')
    lines.push('Key Risks:')
    report.executiveSummary.keyRisks.forEach(risk => {
      lines.push(`  - ${risk}`)
    })
    lines.push('')
    lines.push('Recommendations:')
    report.executiveSummary.recommendations.forEach(rec => {
      lines.push(`  - ${rec}`)
    })
    lines.push('')

    // Security Findings
    lines.push('-'.repeat(80))
    lines.push('SECURITY FINDINGS')
    lines.push('-'.repeat(80))
    lines.push('')
    report.securityFindings.forEach((finding, index) => {
      lines.push(`${index + 1}. ${finding.title}`)
      lines.push(`   Severity: ${finding.severity}`)
      lines.push(`   OWASP Category: ${finding.owaspCategory}`)
      lines.push(`   Affected Endpoint: ${finding.affectedEndpoint} (${finding.affectedMethod})`)
      lines.push(`   Business Impact: ${finding.businessImpact}`)
      lines.push(`   Technical Details: ${finding.technicalDetails}`)
      lines.push(`   Suggested Fix: ${finding.suggestedFix}`)
      lines.push(`   Confidence: ${finding.confidence}`)
      lines.push('')
    })

    // Risk Score
    lines.push('-'.repeat(80))
    lines.push('RISK SCORE BREAKDOWN')
    lines.push('-'.repeat(80))
    lines.push('')
    lines.push(`Overall Score: ${report.riskScore.overallScore}/100`)
    lines.push(`Severity: ${report.riskScore.severity}`)
    lines.push(`Trend: ${report.riskScore.trend}`)
    lines.push('')
    lines.push('Factor Breakdown:')
    report.riskScore.breakdown.forEach(breakdown => {
      lines.push(`  ${breakdown.factor}: ${breakdown.score} (weight: ${breakdown.weight})`)
      lines.push(`    ${breakdown.description}`)
    })
    lines.push('')
    lines.push('Top Contributors:')
    report.riskScore.topContributors.forEach(contributor => {
      lines.push(`  ${contributor.factor}: ${contributor.impact}`)
      lines.push(`    ${contributor.description}`)
      lines.push(`    Recommendation: ${contributor.recommendation}`)
    })
    lines.push('')

    // OWASP Mapping
    lines.push('-'.repeat(80))
    lines.push('OWASP MAPPING')
    lines.push('-'.repeat(80))
    lines.push('')
    report.owaspMapping.forEach(mapping => {
      lines.push(`${mapping.category}`)
      lines.push(`  Count: ${mapping.count}`)
      lines.push(`  Severity: ${mapping.severity}`)
      lines.push(`  Description: ${mapping.description}`)
      lines.push(`  Findings: ${mapping.findings.join(', ')}`)
      lines.push('')
    })

    // Dependency Graph
    lines.push('-'.repeat(80))
    lines.push('DEPENDENCY GRAPH')
    lines.push('-'.repeat(80))
    lines.push('')
    lines.push(`Total Nodes: ${report.dependencyGraph.totalNodes}`)
    lines.push(`Total Edges: ${report.dependencyGraph.totalEdges}`)
    lines.push(`Circular Dependencies: ${report.dependencyGraph.circularDependencies.length}`)
    lines.push(`Disconnected Services: ${report.dependencyGraph.disconnectedServices.length}`)
    lines.push(`Single Points of Failure: ${report.dependencyGraph.singlePointsOfFailure.length}`)
    lines.push('')
    lines.push('Services:')
    report.dependencyGraph.services.forEach(service => {
      lines.push(`  ${service.name} (${service.type})`)
      lines.push(`    Risk: ${service.risk}, Health: ${service.health}%`)
      lines.push(`    Endpoints: ${service.endpoints}, External: ${service.isExternal}`)
    })
    lines.push('')

    // AI Recommendations
    lines.push('-'.repeat(80))
    lines.push('AI RECOMMENDATIONS')
    lines.push('-'.repeat(80))
    lines.push('')
    report.aiRecommendations.forEach((rec, index) => {
      lines.push(`${index + 1}. ${rec.vulnerabilityTitle}`)
      lines.push(`   Priority: ${rec.priority}`)
      lines.push(`   Estimated Time: ${rec.estimatedTime}`)
      lines.push(`   Explanation: ${rec.explanation}`)
      lines.push(`   Business Impact: ${rec.businessImpact}`)
      lines.push(`   Fix: ${rec.fix}`)
      lines.push(`   Confidence: ${rec.confidence}`)
      lines.push('')
      lines.push('   Code Example:')
      lines.push(`   Language: ${rec.codeExample.language}`)
      lines.push(`   Before: ${rec.codeExample.before}`)
      lines.push(`   After: ${rec.codeExample.after}`)
      lines.push(`   Description: ${rec.codeExample.description}`)
      lines.push('')
    })

    const pdfContent = lines.join('\n')
    const filename = `security_report_${report.metadata.specId}_${Date.now()}.txt`

    return {
      success: true,
      data: pdfContent,
      filename,
      mimeType: 'text/plain'
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ── Export Helper ───────────────────────────────────────────────────

export function exportReport(
  report: SecurityReport,
  format: ReportFormat
): ExportResult {
  if (format === 'csv') {
    return exportToCSV(report)
  } else if (format === 'pdf') {
    return exportToPDF(report)
  }

  return {
    success: false,
    error: `Unsupported format: ${format}`
  }
}
