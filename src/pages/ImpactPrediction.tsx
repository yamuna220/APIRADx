import { useState, useEffect } from 'react'
import { Zap, ArrowRight, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, RefreshCw, AlertCircle, ChevronDown, GitBranch } from 'lucide-react'
import { impactService } from '../services/impactService'

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18 }

interface ImpactResult {
  affectedServices: { name: string; impact: 'Critical' | 'High' | 'Medium' | 'Low'; reason: string }[]
  downstreamAPIs: { path: string; consumers: number }[]
  businessImpact: { area: string; severity: string; detail: string }[]
  deploymentRisk: 'Critical' | 'High' | 'Medium' | 'Low'
  recommendedTests: string[]
  chain: string[]
}

const riskVars: Record<string, { text: string; bg: string }> = {
  Critical: { text: 'var(--error)', bg: 'color-mix(in srgb, var(--error) 12%, transparent)' },
  High: { text: 'var(--high)', bg: 'color-mix(in srgb, var(--high) 12%, transparent)' },
  Medium: { text: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 12%, transparent)' },
  Low: { text: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 12%, transparent)' },
}

function Select({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none pl-4 pr-9 py-3 text-[13px] rounded-[12px] border focus:outline-none transition-colors"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  )
}

import type { Page } from '../App'

export default function ImpactPrediction({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apis, setApis] = useState<string[]>([])
  const [versions, setVersions] = useState<string[]>([])
  const [changeTypes, setChangeTypes] = useState<string[]>([])
  const [mockResult, setMockResult] = useState<ImpactResult | null>(null)
  
  const [api, setApi] = useState('')
  const [version, setVersion] = useState('')
  const [changeType, setChangeType] = useState('')
  const [result, setResult] = useState<ImpactResult | null>(null)
  const [analyzeLoading, setAnalyzeLoading] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        
        const [apisData, versionsData, changeTypesData, mockResultData] = await Promise.all([
          impactService.getAPIs(),
          impactService.getVersions(),
          impactService.getChangeTypes(),
          impactService.getMockResult()
        ])

        setApis(apisData)
        setVersions(versionsData)
        setChangeTypes(changeTypesData)
        setMockResult(mockResultData)
        setApi(apisData[0])
        setVersion(versionsData[4] || versionsData[0])
        setChangeType(changeTypesData[0])
      } catch (err) {
        console.error('Failed to load impact prediction data:', err)
        setError('Failed to load impact prediction data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const analyze = () => {
    setAnalyzeLoading(true)
    setTimeout(() => { setResult(mockResult); setAnalyzeLoading(false) }, 1200)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-5 max-w-[1400px]">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--brand)' }} />
            <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Loading impact prediction...</p>
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

  const dr = result ? riskVars[result.deploymentRisk] : null

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-[22px] font-700 tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Impact Prediction</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>Simulate API changes and predict downstream service impact before deploying.</p>
      </div>

      <div style={card} className="p-6">
        <h2 className="text-[14px] font-600 mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Configure Change</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <Select label="API Endpoint" options={apis} value={api} onChange={setApi} />
          <Select label="Version" options={versions} value={version} onChange={setVersion} />
          <Select label="Change Type" options={changeTypes} value={changeType} onChange={setChangeType} />
        </div>
        <button onClick={analyze} disabled={analyzeLoading}
          className="flex items-center gap-2 px-6 py-3 rounded-[14px] font-600 text-[14px] transition-colors disabled:opacity-60"
          style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
          onMouseEnter={(e) => { if (!analyzeLoading) (e.currentTarget as HTMLElement).style.background = 'var(--brand-hover)' }}
          onMouseLeave={(e) => { if (!analyzeLoading) (e.currentTarget as HTMLElement).style.background = 'var(--brand)' }}
        >
          {analyzeLoading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Predicting impact...</>
          ) : (
            <><Zap size={15} />Predict Impact</>
          )}
        </button>
      </div>

      {result && (
        <>
          <div className="flex items-center gap-4 p-4 rounded-[14px] border" style={{ background: dr!.bg, borderColor: `color-mix(in srgb, ${dr!.text} 40%, transparent)` }}>
            <AlertTriangle size={20} style={{ color: dr!.text }} />
            <div>
              <div className="text-[14px] font-700" style={{ color: dr!.text }}>Deployment Risk: {result.deploymentRisk}</div>
              <div className="text-[12px] mt-0.5" style={{ color: dr!.text, opacity: 0.85 }}>
                Changing <code className="font-mono">{api}</code> with a {changeType} impacts {result.affectedServices.length} services.
              </div>
            </div>
          </div>

          <div style={card} className="p-5">
            <h3 className="text-[13px] font-600 mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>
              <GitBranch size={14} style={{ color: 'var(--brand)' }} />
              Dependency Chain
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {result.chain.map((node, i) => (
                <div key={i} className="flex items-center gap-2">
                  {node === '→' ? (
                    <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                  ) : (
                    <div className={`px-4 py-2 rounded-[10px] text-[12px] font-600 border`}
                      style={i === 0
                        ? { color: 'var(--brand)', borderColor: 'color-mix(in srgb, var(--brand) 40%, transparent)', background: 'color-mix(in srgb, var(--brand) 12%, transparent)' }
                        : { color: 'var(--text-primary)', borderColor: 'var(--border)', background: 'var(--bg-secondary)' }
                      }>
                      {node}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div style={{ ...card, overflow: 'hidden' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Affected Services</h3>
              </div>
              {result.affectedServices.map((svc) => {
                const sc = riskVars[svc.impact]
                return (
                  <div key={svc.name} className="flex items-start gap-4 px-5 py-4 border-b transition-colors" style={{ borderColor: 'var(--border-subtle)' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--card-hover)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <span className="text-[10px] font-700 px-2 py-1 rounded-[6px] flex-shrink-0 mt-0.5" style={{ color: sc.text, background: sc.bg }}>{svc.impact}</span>
                    <div>
                      <div className="text-[13px] font-600" style={{ color: 'var(--text-primary)' }}>{svc.name}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{svc.reason}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ ...card, overflow: 'hidden' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Downstream APIs</h3>
              </div>
              <div className="p-5 space-y-3">
                {result.downstreamAPIs.map((d) => (
                  <div key={d.path} className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="w-6 h-6 rounded-[5px] flex items-center justify-center flex-shrink-0" style={{ background: 'var(--border)' }}>
                      <ArrowRight size={11} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="flex-1 font-mono text-[12px]" style={{ color: 'var(--text-primary)' }}>{d.path}</div>
                    <span className="text-[11px] font-500" style={{ color: 'var(--text-muted)' }}>{d.consumers} consumer{d.consumers !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5">
                <h4 className="text-[12px] font-600 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Business Impact</h4>
                <div className="space-y-2">
                  {result.businessImpact.map((b) => {
                    const sc = riskVars[b.severity]
                    return (
                      <div key={b.area} className="p-3 rounded-[10px] border" style={{ background: sc.bg, borderColor: `color-mix(in srgb, ${sc.text} 30%, transparent)` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-700" style={{ color: sc.text }}>{b.severity}</span>
                          <span className="text-[11px] font-600" style={{ color: 'var(--text-primary)' }}>{b.area}</span>
                        </div>
                        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{b.detail}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div style={card} className="p-5">
            <h3 className="text-[14px] font-600 mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Recommended Testing</h3>
            <div className="space-y-2">
              {result.recommendedTests.map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!result && !loading && (
        <div style={card} className="flex flex-col items-center justify-center py-20">
          <Zap size={36} style={{ color: 'var(--border)', marginBottom: 12 }} />
          <p className="text-[14px] font-500 mb-2" style={{ color: 'var(--text-primary)' }}>Configure your change above</p>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Select an API, version, and change type, then run prediction</p>
        </div>
      )}
    </div>
  )
}
