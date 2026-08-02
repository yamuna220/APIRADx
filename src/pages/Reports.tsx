import { useState, useEffect } from 'react'
import { FileText, Download, Calendar, Shield, AlertTriangle, CheckCircle2, ExternalLink, Share2, Loader2, X, Eye, Trash2, Edit2, Copy, Mail, Users, Filter, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react'
import Logo from '../components/Logo'
import { reportService } from '../services/reportService'
import { exportReport } from '../utils/reportGenerator'
import { useNotifications } from '../context/NotificationContext'
import { useUploads } from '../context/UploadContext'
import { reportsApi } from '../services/reportsApi'
import type { Page } from '../App'

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18 }

const reportCards = [
  { title: 'Executive Summary', desc: 'High-level security posture for leadership', icon: Shield, color: 'var(--info)' },
  { title: 'Technical Findings', desc: 'Detailed vulnerability analysis for engineering', icon: AlertTriangle, color: 'var(--error)' },
  { title: 'Risk Report', desc: 'CVSS scores and risk distribution by service', icon: FileText, color: 'var(--warning)' },
  { title: 'Dependency Analysis', desc: 'Service dependency map and blast radius', icon: FileText, color: '#A78BFA' },
  { title: 'Compliance Summary', desc: 'GDPR, SOC 2, and OWASP compliance status', icon: CheckCircle2, color: 'var(--success)' },
]

const typeColors: Record<string, string> = {
  Executive: 'var(--info)', Technical: 'var(--error)', Audit: 'var(--high)', Compliance: 'var(--success)',
}

export default function Reports({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const { uploadedSpecs } = useUploads()
  const { addNotification } = useNotifications()
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewReport, setPreviewReport] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [reportToRename, setReportToRename] = useState<string | null>(null)
  const [newReportName, setNewReportName] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [reportToShare, setReportToShare] = useState<string | null>(null)
  const [shareMethod, setShareMethod] = useState<'link' | 'email' | 'workspace'>('link')
  const [shareEmail, setShareEmail] = useState('')
  const [generatingPDF, setGeneratingPDF] = useState<Set<string>>(new Set())
  const [generatingCSV, setGeneratingCSV] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const data = await reportService.getAllReports()
        setHistory(data)
      } catch (err) {
        console.error('Failed to load reports:', err)
        setError('Failed to load reports. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-5 max-w-[1400px]">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--brand)' }} />
            <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Loading reports...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-5 max-w-[1400px]">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle size={32} style={{ color: 'var(--error)' }} />
            <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-[12px] text-[13px] font-500 transition-colors"
              style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleGenerateReport = async (reportType: string) => {
    setSelectedReportType(reportType)
    setShowProgressDialog(true)
    setGenerating(true)
    setProgress(0)

    // Simulate report generation progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setProgress(i)
    }

    setGenerating(false)
    setProgress(100)

    // Create a new report entry
    const newReport = {
      id: Date.now(),
      name: `${reportType} - ${new Date().toLocaleDateString()}`,
      type: reportType as 'Executive' | 'Technical' | 'Audit' | 'Compliance',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      size: '2.1 MB',
      summary: {
        title: 'API Security Assessment Report',
        generatedAt: new Date().toISOString(),
        specName: 'Generated Report',
        specVersion: '1.0.0',
        overallRiskScore: 72,
        overallSeverity: 'Medium',
        totalEndpoints: 15,
        totalFindings: 12,
        criticalFindings: 2,
        highFindings: 3,
        mediumFindings: 5,
        lowFindings: 2,
        keyRisks: [
          'Broken Authentication on /api/auth/login',
          'Excessive Data Exposure on /api/users',
          'Lack of Rate Limiting on /api/search'
        ],
        recommendations: [
          'Implement OAuth 2.0 for authentication',
          'Add field-level response filtering',
          'Enable rate limiting on all endpoints'
        ]
      },
      findings: [
        {
          id: 'FIND-001',
          title: 'Broken Authentication',
          severity: 'Critical',
          owaspCategory: 'API1:2023 - Broken Object Level Authorization',
          affectedEndpoint: '/api/auth/login',
          affectedMethod: 'POST',
          businessImpact: 'Unauthorized access to user accounts',
          technicalDetails: 'Login endpoint lacks proper rate limiting and account lockout mechanisms',
          suggestedFix: 'Implement rate limiting and account lockout after failed attempts',
          confidence: 'High'
        }
      ],
      riskScore: {
        overallScore: 72,
        severity: 'Medium',
        trend: 'Improving',
        breakdown: [],
        topContributors: []
      },
      owaspMapping: [],
      dependencyGraph: {
        totalNodes: 8,
        totalEdges: 12,
        criticalPaths: [],
        circularDependencies: [],
        disconnectedServices: [],
        singlePointsOfFailure: [],
        services: []
      },
      aiRecommendations: [],
      metadata: {
        specId: `generated-${Date.now()}`,
        specName: 'Generated Report',
        generatedAt: new Date().toISOString(),
        generatedBy: 'system',
        specVersion: '1.0.0'
      }
    }

    reportService.addReport(newReport)

    // Add notification
    addNotification({
      category: 'report_generated',
      priority: 'normal',
      title: 'Report Generated',
      message: `${reportType} report has been generated successfully`,
      actionUrl: 'reports',
      actionLabel: 'View'
    })

    setTimeout(() => {
      setShowProgressDialog(false)
      setProgress(0)
      setSelectedReportType(null)
    }, 1500)
  }

  const handleExportPDF = async (reportId: string) => {
    if (generatingPDF.has(reportId)) return
    
    setGeneratingPDF(prev => new Set(prev).add(reportId))
    addNotification({
      category: 'general',
      priority: 'normal',
      title: 'PDF Export Started',
      message: 'Generating professional PDF report with company branding'
    })

    try {
      const response = await reportsApi.generatePDF(reportId)
      
      console.log('PDF Response:', response)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate PDF')
      }

      if (!response.data || !response.data.content) {
        throw new Error('No content generated')
      }

      reportsApi.downloadFile(response.data.content, response.data.filename, 'application/pdf')
      
      addNotification({
        category: 'general',
        priority: 'normal',
        title: 'PDF Downloaded',
        message: 'Report PDF has been downloaded successfully'
      })
    } catch (error) {
      console.error('PDF Export Error:', error)
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'PDF Export Failed',
        message: error instanceof Error ? error.message : 'Failed to generate PDF report. Please try again.'
      })
    } finally {
      setGeneratingPDF(prev => {
        const newSet = new Set(prev)
        newSet.delete(reportId)
        return newSet
      })
    }
  }

  const handleExportCSV = async (reportId: string) => {
    if (generatingCSV.has(reportId)) return
    
    setGeneratingCSV(prev => new Set(prev).add(reportId))
    addNotification({
      category: 'general',
      priority: 'normal',
      title: 'CSV Export Started',
      message: 'Exporting all analysis results to CSV'
    })

    try {
      const response = await reportsApi.generateCSV(reportId)
      
      console.log('CSV Response:', response)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate CSV')
      }

      if (!response.data || !response.data.content) {
        throw new Error('No content generated')
      }

      reportsApi.downloadFile(response.data.content, response.data.filename, 'text/csv')
      
      addNotification({
        category: 'general',
        priority: 'normal',
        title: 'CSV Downloaded',
        message: 'Analysis CSV has been downloaded successfully'
      })
    } catch (error) {
      console.error('CSV Export Error:', error)
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'CSV Export Failed',
        message: error instanceof Error ? error.message : 'Failed to export CSV. Please try again.'
      })
    } finally {
      setGeneratingCSV(prev => {
        const newSet = new Set(prev)
        newSet.delete(reportId)
        return newSet
      })
    }
  }

  const handlePreviewReport = (report: any) => {
    setPreviewReport(report)
    setShowPreviewModal(true)
  }

  const handleOpenReport = (reportId: string) => {
    // Store the report ID for the viewer
    sessionStorage.setItem('viewing-report-id', reportId)
    onNavigate('report-viewer')
    addNotification({
      category: 'general',
      priority: 'normal',
      title: 'Opening Report',
      message: 'Report viewer opened'
    })
  }

  const handleShareReport = (reportId: string) => {
    setReportToShare(reportId)
    setShareMethod('link')
    setShareEmail('')
    setShowShareModal(true)
  }

  const handleShareSubmit = async () => {
    if (!reportToShare) return

    try {
      const response = await reportsApi.shareReport(reportToShare, {
        method: shareMethod,
        email: shareEmail || undefined,
        expiresIn: 24
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate share link')
      }

      if (shareMethod === 'link') {
        const copied = await reportsApi.copyToClipboard(response.data!.link)
        if (copied) {
          addNotification({
            category: 'general',
            priority: 'normal',
            title: 'Link Copied',
            message: 'Share link copied to clipboard'
          })
        } else {
          addNotification({
            category: 'general',
            priority: 'high',
            title: 'Copy Failed',
            message: 'Failed to copy link to clipboard'
          })
        }
      } else if (shareMethod === 'email') {
        addNotification({
          category: 'general',
          priority: 'normal',
          title: 'Email Sent',
          message: `Report shared with ${shareEmail}`
        })
      } else {
        addNotification({
          category: 'general',
          priority: 'normal',
          title: 'Shared to Workspace',
          message: 'Report is now available to all workspace members'
        })
      }

      setShowShareModal(false)
    } catch (error) {
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'Share Failed',
        message: error instanceof Error ? error.message : 'Failed to share report'
      })
    }
  }

  const handleDeleteReport = (reportId: string) => {
    setReportToDelete(reportId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteReport = async () => {
    if (!reportToDelete) return

    try {
      const response = await reportsApi.deleteReport(reportToDelete)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete report')
      }

      addNotification({
        category: 'general',
        priority: 'normal',
        title: 'Report Deleted',
        message: 'Report has been deleted successfully'
      })
      setShowDeleteConfirm(false)
      setReportToDelete(null)
    } catch (error) {
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Failed to delete report'
      })
    }
  }

  const handleRenameReport = (reportId: string, currentName: string) => {
    setReportToRename(reportId)
    setNewReportName(currentName)
    setShowRenameModal(true)
  }

  const confirmRenameReport = async () => {
    if (!reportToRename || !newReportName.trim()) return

    try {
      const response = await reportsApi.updateReport(reportToRename, {
        name: newReportName.trim()
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to rename report')
      }

      addNotification({
        category: 'general',
        priority: 'normal',
        title: 'Report Renamed',
        message: `Report renamed to "${newReportName}"`
      })
      setShowRenameModal(false)
      setReportToRename(null)
      setNewReportName('')
    } catch (error) {
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'Rename Failed',
        message: error instanceof Error ? error.message : 'Failed to rename report'
      })
    }
  }
  return (
    <div className="p-6 space-y-6 max-w-[1000px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-700 tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Reports</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>Generate and export security reports for stakeholders.</p>
        </div>
        <button 
          onClick={() => handleGenerateReport('Executive Summary')}
          className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-[13px] font-500 transition-colors"
          style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--brand-hover)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--brand)')}
        >+ Generate Report</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {reportCards.map((r) => {
          const Icon = r.icon
          return (
            <button 
              key={r.title} 
              onClick={() => handleGenerateReport(r.title)}
              className="p-4 rounded-[16px] border text-left transition-all group"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = r.color; (e.currentTarget as HTMLElement).style.background = `color-mix(in srgb, ${r.color} 8%, transparent)` }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--card)' }}
            >
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center mb-3" style={{ background: `color-mix(in srgb, ${r.color} 14%, transparent)` }}>
                <Icon size={15} style={{ color: r.color }} />
              </div>
              <div className="text-[12px] font-600" style={{ color: 'var(--text-primary)' }}>{r.title}</div>
              <div className="text-[10px] mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{r.desc}</div>
            </button>
          )
        })}
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        {/* Report header — mirrors PDF export header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--brand) 4%, var(--card))' }}>
          <Logo size={28} showText={true} />
          <div className="h-5 w-px" style={{ background: 'var(--border)' }} />
          <div className="flex-1 px-5">
            <h2 className="text-[15px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>August 2026 Executive Summary</h2>
            <p className="text-[11px] mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Calendar size={9} /> Generated Aug 1, 2026 &nbsp;·&nbsp; Confidential
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => addNotification({
                category: 'general',
                priority: 'normal',
                title: 'Share Report',
                message: 'Share link copied to clipboard'
              })}
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-500 rounded-[8px] border transition-colors"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)', background: 'transparent' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            ><Share2 size={12} /> Share</button>
            <button 
              onClick={() => handleExportPDF('1')}
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-500 rounded-[8px] border transition-colors"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)', background: 'transparent' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            ><Download size={12} /> PDF</button>
            <button 
              onClick={() => handleExportCSV('1')}
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-500 rounded-[8px] border transition-colors"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)', background: 'transparent' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            ><Download size={12} /> CSV</button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b" style={{ borderColor: 'var(--border)' }}>
          {[
            { icon: Shield, label: 'Security Score', value: '91/100', color: 'var(--success)' },
            { icon: AlertTriangle, label: 'Critical Issues', value: '12', color: 'var(--error)' },
            { icon: CheckCircle2, label: 'Issues Resolved', value: '47', color: 'var(--info)' },
            { icon: FileText, label: 'APIs Scanned', value: '284', color: '#A78BFA' },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="p-4 rounded-[14px]" style={{ background: `color-mix(in srgb, ${s.color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${s.color} 22%, transparent)` }}>
                <Icon size={14} style={{ color: s.color }} />
                <div className="text-[24px] font-800 mt-2 leading-none" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[11px] font-500 mt-1.5" style={{ color: s.color, opacity: 0.85 }}>{s.label}</div>
              </div>
            )
          })}
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-[12px] font-600 mb-3" style={{ color: 'var(--text-primary)' }}>Key Findings</h4>
            <div className="space-y-2">
              {[
                ['Critical', 'Broken authentication on primary auth endpoint (CVSS 8.8)'],
                ['Critical', 'Unauthenticated analytics export endpoint'],
                ['High', 'API keys transmitted in query strings (4 endpoints)'],
                ['High', 'Excessive data exposure in user profile responses'],
                ['Medium', 'Missing rate limiting on batch operations'],
              ].map(([sev, text], i) => {
                const c: Record<string, string> = { Critical: 'var(--error)', High: 'var(--high)', Medium: 'var(--warning)' }
                const color = c[sev] ?? 'var(--text-secondary)'
                return (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                    <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{text}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div>
            <h4 className="text-[12px] font-600 mb-3" style={{ color: 'var(--text-primary)' }}>Recommendations</h4>
            <div className="space-y-2">
              {[
                'Implement rate limiting on all auth endpoints immediately',
                'Add authentication middleware to analytics export routes',
                'Migrate API keys to Authorization headers',
                'Deploy input validation on all POST/PUT endpoints',
                'Schedule penetration test for Q4 2026',
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Report History</h3>
        </div>
        {history.map((r) => {
          const tc = typeColors[r.type] ?? 'var(--text-muted)'
          return (
            <div key={r.id} className="flex items-center gap-4 px-5 py-4 border-b transition-colors" style={{ borderColor: 'var(--border-subtle)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--card-hover)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <div className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${tc} 14%, transparent)` }}>
                <FileText size={14} style={{ color: tc }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-500" style={{ color: 'var(--text-primary)' }}>{r.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-500 px-1.5 py-0.5 rounded-[4px]" style={{ color: tc, background: `color-mix(in srgb, ${tc} 14%, transparent)` }}>{r.type}</span>
                  <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Calendar size={9} />{r.date}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{r.size}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePreviewReport(r)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-500 rounded-[7px] border transition-colors"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                ><Eye size={11} /> Preview</button>
                <button 
                  onClick={() => handleExportPDF(r.id.toString())}
                  disabled={generatingPDF.has(r.id.toString())}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-500 rounded-[7px] border transition-colors disabled:opacity-50"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  {generatingPDF.has(r.id.toString()) ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                  {generatingPDF.has(r.id.toString()) ? 'Generating...' : 'PDF'}
                </button>
                <button 
                  onClick={() => handleExportCSV(r.id.toString())}
                  disabled={generatingCSV.has(r.id.toString())}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-500 rounded-[7px] border transition-colors disabled:opacity-50"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  {generatingCSV.has(r.id.toString()) ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                  {generatingCSV.has(r.id.toString()) ? 'Generating...' : 'CSV'}
                </button>
                <button 
                  onClick={() => handleShareReport(r.id.toString())}
                  className="p-1.5 rounded-[6px] transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--brand)'; (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 14%, transparent)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                ><Share2 size={12} /></button>
                <button 
                  onClick={() => handleRenameReport(r.id.toString(), r.name)}
                  className="p-1.5 rounded-[6px] transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--brand)'; (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 14%, transparent)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                ><Edit2 size={12} /></button>
                <button 
                  onClick={() => handleDeleteReport(r.id.toString())}
                  className="p-1.5 rounded-[6px] transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--error)'; (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--error) 14%, transparent)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                ><Trash2 size={12} /></button>
                <button 
                  onClick={() => handleOpenReport(r.id.toString())}
                  className="p-1.5 rounded-[6px] transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--brand)'; (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 14%, transparent)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                ><ExternalLink size={12} /></button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Report Preview Modal */}
      {showPreviewModal && previewReport && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-[800px] max-h-[90vh] rounded-[12px] border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)' }}>Report Preview</h3>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-[6px] transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <Logo size={32} showText={true} />
                  <div>
                    <h2 className="text-[16px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>{previewReport.name}</h2>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{previewReport.date} · {previewReport.type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Shield, label: 'Security Score', value: '91/100', color: 'var(--success)' },
                    { icon: AlertTriangle, label: 'Critical Issues', value: '12', color: 'var(--error)' },
                    { icon: CheckCircle2, label: 'Issues Resolved', value: '47', color: 'var(--info)' },
                    { icon: FileText, label: 'APIs Scanned', value: '284', color: '#A78BFA' },
                  ].map((s) => {
                    const Icon = s.icon
                    return (
                      <div key={s.label} className="p-3 rounded-[12px]" style={{ background: `color-mix(in srgb, ${s.color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${s.color} 22%, transparent)` }}>
                        <Icon size={12} style={{ color: s.color }} />
                        <div className="text-[18px] font-700 mt-1 leading-none" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[10px] font-500 mt-1" style={{ color: s.color, opacity: 0.85 }}>{s.label}</div>
                      </div>
                    )
                  })}
                </div>
                <div>
                  <h4 className="text-[12px] font-600 mb-2" style={{ color: 'var(--text-primary)' }}>Key Findings</h4>
                  <div className="space-y-1">
                    {[
                      ['Critical', 'Broken authentication on primary auth endpoint (CVSS 8.8)'],
                      ['Critical', 'Unauthenticated analytics export endpoint'],
                      ['High', 'API keys transmitted in query strings (4 endpoints)'],
                    ].map(([sev, text], i) => {
                      const c: Record<string, string> = { Critical: 'var(--error)', High: 'var(--high)', Medium: 'var(--warning)' }
                      const color = c[sev] ?? 'var(--text-secondary)'
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                          <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{text}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => { handleExportPDF(previewReport.id.toString()); setShowPreviewModal(false) }}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-500 transition-colors"
                style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
              >
                Download PDF
              </button>
              <button
                onClick={() => { handleExportCSV(previewReport.id.toString()); setShowPreviewModal(false) }}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-500 transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-96 rounded-[12px] border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--error) 14%, transparent)' }}>
                <Trash2 size={18} style={{ color: 'var(--error)' }} />
              </div>
              <div>
                <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)' }}>Delete Report</h3>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>This action cannot be undone</p>
              </div>
            </div>
            <p className="text-[12px] mb-6" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete this report? This will permanently remove the report and all associated data.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-500 transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteReport}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-500 transition-colors"
                style={{ background: 'var(--error)', color: 'var(--brand-text)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-[450px] rounded-[12px] border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)' }}>Share Report</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-[6px] transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="space-y-3 mb-4">
              <button
                onClick={() => setShareMethod('link')}
                className={`w-full flex items-center gap-3 p-3 rounded-[8px] border transition-colors ${shareMethod === 'link' ? 'border-2' : ''}`}
                style={{
                  borderColor: shareMethod === 'link' ? 'var(--brand)' : 'var(--border)',
                  background: shareMethod === 'link' ? 'color-mix(in srgb, var(--brand) 8%, transparent)' : 'transparent'
                }}
              >
                <div className="w-8 h-8 rounded-[6px] flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--brand) 14%, transparent)' }}>
                  <Copy size={14} style={{ color: 'var(--brand)' }} />
                </div>
                <div className="text-left">
                  <div className="text-[12px] font-500" style={{ color: 'var(--text-primary)' }}>Copy Link</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Generate shareable link</div>
                </div>
              </button>
              
              <button
                onClick={() => setShareMethod('email')}
                className={`w-full flex items-center gap-3 p-3 rounded-[8px] border transition-colors ${shareMethod === 'email' ? 'border-2' : ''}`}
                style={{
                  borderColor: shareMethod === 'email' ? 'var(--brand)' : 'var(--border)',
                  background: shareMethod === 'email' ? 'color-mix(in srgb, var(--brand) 8%, transparent)' : 'transparent'
                }}
              >
                <div className="w-8 h-8 rounded-[6px] flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--brand) 14%, transparent)' }}>
                  <Mail size={14} style={{ color: 'var(--brand)' }} />
                </div>
                <div className="text-left">
                  <div className="text-[12px] font-500" style={{ color: 'var(--text-primary)' }}>Email Report</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Send via email</div>
                </div>
              </button>
              
              <button
                onClick={() => setShareMethod('workspace')}
                className={`w-full flex items-center gap-3 p-3 rounded-[8px] border transition-colors ${shareMethod === 'workspace' ? 'border-2' : ''}`}
                style={{
                  borderColor: shareMethod === 'workspace' ? 'var(--brand)' : 'var(--border)',
                  background: shareMethod === 'workspace' ? 'color-mix(in srgb, var(--brand) 8%, transparent)' : 'transparent'
                }}
              >
                <div className="w-8 h-8 rounded-[6px] flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--brand) 14%, transparent)' }}>
                  <Users size={14} style={{ color: 'var(--brand)' }} />
                </div>
                <div className="text-left">
                  <div className="text-[12px] font-500" style={{ color: 'var(--text-primary)' }}>Workspace Share</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Share with team members</div>
                </div>
              </button>
            </div>

            {shareMethod === 'email' && (
              <div className="mb-4">
                <label className="block text-[11px] font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Email Address</label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full px-4 py-2.5 text-[13px] rounded-[12px] border focus:outline-none transition-colors"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                  placeholder="recipient@example.com"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-500 transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleShareSubmit}
                disabled={shareMethod === 'email' && !shareEmail.trim()}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-500 transition-colors disabled:opacity-50"
                style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
              >
                {shareMethod === 'link' ? 'Copy Link' : shareMethod === 'email' ? 'Send Email' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-96 rounded-[12px] border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)' }}>Rename Report</h3>
              <button 
                onClick={() => setShowRenameModal(false)}
                className="p-1 rounded-[6px] transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
              >
                <X size={14} />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-[11px] font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Report Name</label>
              <input
                type="text"
                value={newReportName}
                onChange={(e) => setNewReportName(e.target.value)}
                className="w-full px-4 py-2.5 text-[13px] rounded-[12px] border focus:outline-none transition-colors"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                placeholder="Enter new report name"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRenameModal(false)}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-500 transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRenameReport}
                disabled={!newReportName.trim()}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-500 transition-colors disabled:opacity-50"
                style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Generation Progress Dialog */}
      {showProgressDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-96 rounded-[12px] border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)' }}>
                {generating ? 'Generating Report...' : 'Report Generated'}
              </h3>
              {!generating && (
                <button 
                  onClick={() => setShowProgressDialog(false)}
                  className="p-1 rounded-[6px] transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            {generating ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 size={20} className="animate-spin" style={{ color: 'var(--brand)' }} />
                  <div className="flex-1">
                    <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                      Generating {selectedReportType} report...
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      Analyzing security findings, compiling data, formatting output
                    </p>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, background: 'var(--brand)' }}
                  />
                </div>
                <p className="text-[11px] mt-2 text-right" style={{ color: 'var(--text-muted)' }}>{progress}%</p>
              </>
            ) : (
              <div className="text-center py-4">
                <CheckCircle2 size={32} style={{ color: 'var(--success)' }} />
                <p className="text-[12px] mt-3" style={{ color: 'var(--text-secondary)' }}>
                  {selectedReportType} report generated successfully
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { handleExportPDF('generated'); setShowProgressDialog(false) }}
                    className="flex-1 py-2 rounded-[8px] text-[12px] font-500 transition-colors"
                    style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={() => { handleExportCSV('generated'); setShowProgressDialog(false) }}
                    className="flex-1 py-2 rounded-[8px] text-[12px] font-500 transition-colors"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                  >
                    Download CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
