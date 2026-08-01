import { useState, useEffect } from 'react'
import { FileText, Download, Calendar, Shield, AlertTriangle, CheckCircle2, Search, Printer, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import Logo from '../components/Logo'
import { reportsApi } from '../services/reportsApi'
import { useNotifications } from '../context/NotificationContext'
import type { Page } from '../App'

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18 }

interface ReportViewerProps {
  onNavigate: (page: Page) => void
}

export default function ReportViewer({ onNavigate }: ReportViewerProps) {
  const { addNotification } = useNotifications()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    executive: true,
    findings: true,
    risk: true,
    owasp: true,
    dependencies: true,
    ai: true
  })
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [generatingCSV, setGeneratingCSV] = useState(false)

  const reportId = sessionStorage.getItem('viewing-report-id') || ''

  useEffect(() => {
    const loadReport = async () => {
      if (!reportId) return

      try {
        const response = await reportsApi.getReportById(reportId)
        if (response.success && response.data) {
          setReport(response.data)
        } else {
          addNotification({
            category: 'general',
            priority: 'high',
            title: 'Report Not Found',
            message: response.error || 'Unable to load report'
          })
        }
      } catch (error) {
        addNotification({
          category: 'general',
          priority: 'high',
          title: 'Load Failed',
          message: 'Failed to load report'
        })
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [reportId, addNotification])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!reportId || generatingPDF) return
    
    setGeneratingPDF(true)
    addNotification({
      category: 'general',
      priority: 'normal',
      title: 'PDF Export Started',
      message: 'Generating professional PDF report'
    })

    try {
      const response = await reportsApi.generatePDF(reportId)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate PDF')
      }

      reportsApi.downloadFile(response.data!.content, response.data!.filename, 'application/pdf')
      
      addNotification({
        category: 'general',
        priority: 'normal',
        title: 'PDF Downloaded',
        message: 'Report PDF has been downloaded successfully'
      })
    } catch (error) {
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'PDF Export Failed',
        message: error instanceof Error ? error.message : 'Failed to generate PDF'
      })
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleDownloadCSV = async () => {
    if (!reportId || generatingCSV) return
    
    setGeneratingCSV(true)
    addNotification({
      category: 'general',
      priority: 'normal',
      title: 'CSV Export Started',
      message: 'Exporting analysis results to CSV'
    })

    try {
      const response = await reportsApi.generateCSV(reportId)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate CSV')
      }

      reportsApi.downloadFile(response.data!.content, response.data!.filename, 'text/csv')
      
      addNotification({
        category: 'general',
        priority: 'normal',
        title: 'CSV Downloaded',
        message: 'Analysis CSV has been downloaded successfully'
      })
    } catch (error) {
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'CSV Export Failed',
        message: error instanceof Error ? error.message : 'Failed to export CSV'
      })
    } finally {
      setGeneratingCSV(false)
    }
  }

  const filteredContent = (content: string) => {
    if (!searchQuery) return content
    const regex = new RegExp(`(${searchQuery})`, 'gi')
    return content.replace(regex, '<mark style="background: color-mix(in srgb, var(--brand) 30%, transparent); padding: 0 2px; border-radius: 2px;">$1</mark>')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }} />
          <p className="text-[13px] mt-4" style={{ color: 'var(--text-muted)' }}>Loading report...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <FileText size={48} style={{ color: 'var(--text-muted)' }} />
          <p className="text-[13px] mt-4" style={{ color: 'var(--text-muted)' }}>Report not found</p>
          <button
            onClick={() => onNavigate('reports')}
            className="mt-4 px-4 py-2 rounded-[8px] text-[12px] font-500 transition-colors"
            style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
          >
            Back to Reports
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('reports')}
                className="p-2 rounded-[8px] transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-[18px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>{report.name}</h1>
                <p className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Calendar size={11} /> {report.date} · {report.type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-500 rounded-[8px] border transition-colors"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <Printer size={12} /> Print
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
                className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-500 rounded-[8px] border transition-colors disabled:opacity-50"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                {generatingPDF ? <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }} /> : <Download size={12} />}
                {generatingPDF ? 'Generating...' : 'PDF'}
              </button>
              <button
                onClick={handleDownloadCSV}
                disabled={generatingCSV}
                className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-500 rounded-[8px] border transition-colors disabled:opacity-50"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                {generatingCSV ? <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }} /> : <Download size={12} />}
                {generatingCSV ? 'Generating...' : 'CSV'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report content..."
            className="w-full pl-10 pr-4 py-2.5 text-[13px] rounded-[12px] border focus:outline-none transition-colors"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-5xl mx-auto px-6 pb-12 space-y-6">
        {/* Executive Summary */}
        <div style={card}>
          <button
            onClick={() => toggleSection('executive')}
            className="w-full flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <Shield size={16} style={{ color: 'var(--info)' }} />
              <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)' }}>Executive Summary</h3>
            </div>
            {expandedSections.executive ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
          </button>
          {expandedSections.executive && (
            <div className="p-6">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { icon: Shield, label: 'Security Score', value: '91/100', color: 'var(--success)' },
                  { icon: AlertTriangle, label: 'Critical Issues', value: '12', color: 'var(--error)' },
                  { icon: CheckCircle2, label: 'Issues Resolved', value: '47', color: 'var(--info)' },
                  { icon: FileText, label: 'APIs Scanned', value: '284', color: '#A78BFA' },
                ].map((s) => {
                  const Icon = s.icon
                  return (
                    <div key={s.label} className="p-4 rounded-[12px]" style={{ background: `color-mix(in srgb, ${s.color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${s.color} 22%, transparent)` }}>
                      <Icon size={14} style={{ color: s.color }} />
                      <div className="text-[24px] font-700 mt-2 leading-none" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[11px] font-500 mt-1.5" style={{ color: s.color, opacity: 0.85 }}>{s.label}</div>
                    </div>
                  )
                })}
              </div>
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
                        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: filteredContent(text) }} />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Findings */}
        <div style={card}>
          <button
            onClick={() => toggleSection('findings')}
            className="w-full flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} style={{ color: 'var(--error)' }} />
              <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)' }}>Security Findings</h3>
            </div>
            {expandedSections.findings ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
          </button>
          {expandedSections.findings && (
            <div className="p-6">
              <div className="space-y-3">
                {[
                  { sev: 'Critical', endpoint: '/api/auth/login', issue: 'Broken authentication', cvss: '8.8' },
                  { sev: 'Critical', endpoint: '/api/analytics/export', issue: 'Unauthenticated access', cvss: '8.5' },
                  { sev: 'High', endpoint: '/api/users/*', issue: 'API keys in query', cvss: '7.2' },
                  { sev: 'High', endpoint: '/api/profile', issue: 'Data exposure', cvss: '6.8' },
                ].map((finding, i) => {
                  const c: Record<string, string> = { Critical: 'var(--error)', High: 'var(--high)', Medium: 'var(--warning)', Low: 'var(--info)' }
                  const color = c[finding.sev] ?? 'var(--text-secondary)'
                  return (
                    <div key={i} className="p-4 rounded-[10px] border" style={{ borderColor: `color-mix(in srgb, ${color} 30%, transparent)`, background: `color-mix(in srgb, ${color} 8%, transparent)` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-600 px-2 py-0.5 rounded-[4px]" style={{ color: color, background: `color-mix(in srgb, ${color} 20%, transparent)` }}>{finding.sev}</span>
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>CVSS {finding.cvss}</span>
                      </div>
                      <div className="text-[12px] font-500 mb-1" style={{ color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: filteredContent(finding.endpoint) }} />
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: filteredContent(finding.issue) }} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Risk Assessment */}
        <div style={card}>
          <button
            onClick={() => toggleSection('risk')}
            className="w-full flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <Shield size={16} style={{ color: 'var(--warning)' }} />
              <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)' }}>Risk Assessment</h3>
            </div>
            {expandedSections.risk ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
          </button>
          {expandedSections.risk && (
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Critical Risk', count: 12, color: 'var(--error)' },
                  { label: 'High Risk', count: 28, color: 'var(--high)' },
                  { label: 'Medium Risk', count: 45, color: 'var(--warning)' },
                  { label: 'Low Risk', count: 67, color: 'var(--info)' },
                  { label: 'Informational', count: 132, color: 'var(--text-muted)' },
                ].map((risk, i) => (
                  <div key={i} className="p-4 rounded-[10px] text-center" style={{ background: `color-mix(in srgb, ${risk.color} 10%, transparent)` }}>
                    <div className="text-[28px] font-700 leading-none" style={{ color: risk.color }}>{risk.count}</div>
                    <div className="text-[11px] mt-1" style={{ color: risk.color, opacity: 0.8 }}>{risk.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* OWASP Findings */}
        <div style={card}>
          <button
            onClick={() => toggleSection('owasp')}
            className="w-full flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <Shield size={16} style={{ color: 'var(--success)' }} />
              <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)' }}>OWASP API Security Top 10</h3>
            </div>
            {expandedSections.owasp ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
          </button>
          {expandedSections.owasp && (
            <div className="p-6">
              <div className="space-y-2">
                {[
                  { category: 'API1:2019 Broken Object Level Authorization', count: 15, severity: 'Critical' },
                  { category: 'API2:2019 Broken User Authentication', count: 8, severity: 'Critical' },
                  { category: 'API3:2019 Excessive Data Exposure', count: 12, severity: 'High' },
                  { category: 'API4:2019 Lack of Resources & Rate Limiting', count: 6, severity: 'High' },
                  { category: 'API5:2019 Broken Function Level Authorization', count: 4, severity: 'Medium' },
                ].map((owasp, i) => {
                  const c: Record<string, string> = { Critical: 'var(--error)', High: 'var(--high)', Medium: 'var(--warning)', Low: 'var(--info)' }
                  const color = c[owasp.severity] ?? 'var(--text-secondary)'
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-[8px]" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-[12px]" style={{ color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: filteredContent(owasp.category) }} />
                      </div>
                      <span className="text-[11px] font-600" style={{ color: color }}>{owasp.count} findings</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        <div style={card}>
          <button
            onClick={() => toggleSection('ai')}
            className="w-full flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} style={{ color: '#A78BFA' }} />
              <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)' }}>AI Recommendations</h3>
            </div>
            {expandedSections.ai ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
          </button>
          {expandedSections.ai && (
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { priority: 'High', title: 'Implement rate limiting on auth endpoints', desc: 'Add rate limiting to prevent brute force attacks on authentication endpoints.' },
                  { priority: 'Medium', title: 'Migrate API keys to headers', desc: 'Move API keys from query parameters to Authorization headers for better security.' },
                  { priority: 'High', title: 'Add input validation', desc: 'Implement comprehensive input validation on all POST/PUT endpoints.' },
                ].map((rec, i) => {
                  const c: Record<string, string> = { Critical: 'var(--error)', High: 'var(--high)', Medium: 'var(--warning)', Low: 'var(--info)' }
                  const color = c[rec.priority] ?? 'var(--text-secondary)'
                  return (
                    <div key={i} className="p-4 rounded-[10px] border" style={{ borderColor: `color-mix(in srgb, ${color} 30%, transparent)` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-600 px-2 py-0.5 rounded-[4px]" style={{ color: color, background: `color-mix(in srgb, ${color} 20%, transparent)` }}>{rec.priority}</span>
                      </div>
                      <div className="text-[12px] font-500 mb-1" style={{ color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: filteredContent(rec.title) }} />
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: filteredContent(rec.desc) }} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
