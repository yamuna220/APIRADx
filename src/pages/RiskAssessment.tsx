import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react'
import { riskAssessmentService } from '../services/riskAssessmentService'

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18 }

function RiskGauge() {
  const score = 91
  const r = 60, cx = 80, cy = 80
  const startAngle = 225, sweepAngle = 270
  const toRad = (d: number) => (d - 90) * (Math.PI / 180)
  const sx = cx + r * Math.cos(toRad(startAngle))
  const sy = cy + r * Math.sin(toRad(startAngle))
  const ex = cx + r * Math.cos(toRad(startAngle + sweepAngle * (score / 100)))
  const ey = cy + r * Math.sin(toRad(startAngle + sweepAngle * (score / 100)))
  const arc = sweepAngle * (score / 100) > 180 ? 1 : 0
  const bgEx = cx + r * Math.cos(toRad(startAngle + sweepAngle))
  const bgEy = cy + r * Math.sin(toRad(startAngle + sweepAngle))

  return (
    <div style={card} className="p-5 flex items-center gap-6">
      <div className="flex-shrink-0">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <path d={`M ${sx} ${sy} A ${r} ${r} 0 1 1 ${bgEx} ${bgEy}`} fill="none" stroke="var(--border)" strokeWidth="12" strokeLinecap="round" />
          <path d={`M ${sx} ${sy} A ${r} ${r} 0 ${arc} 1 ${ex} ${ey}`} fill="none" stroke="var(--success)" strokeWidth="12" strokeLinecap="round" />
          <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Alegreya, serif', fill: 'var(--success)' }}>{score}</text>
          <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 11, fontFamily: 'Alegreya, serif', fill: 'var(--text-muted)' }}>/ 100</text>
          <text x={cx} y={cy + 30} textAnchor="middle" style={{ fontSize: 10, fontFamily: 'Alegreya, serif', fill: 'var(--text-secondary)' }}>Security Score</text>
        </svg>
      </div>
      <div className="flex-1 space-y-3">
        <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Risk Gauge</h3>
        {[
          { label: 'Critical', count: 12, color: 'var(--error)' },
          { label: 'High', count: 31, color: 'var(--high)' },
          { label: 'Medium', count: 27, color: 'var(--warning)' },
          { label: 'Low', count: 214, color: 'var(--success)' },
        ].map((r) => (
          <div key={r.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
              <span className="text-[11px] font-600" style={{ color: 'var(--text-primary)' }}>{r.count}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${(r.count / 284) * 100}%`, background: r.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScoreTrend({ trendPts, months }: { trendPts: number[], months: string[] }) {
  const W = 400, H = 100, pad = { t: 10, r: 10, b: 24, l: 28 }
  const min = 60, max = 100
  const pts = trendPts.map((v, i) => ({
    x: pad.l + (i / (trendPts.length - 1)) * (W - pad.l - pad.r),
    y: pad.t + ((max - v) / (max - min)) * (H - pad.t - pad.b),
  }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = path + ` L${pts.at(-1)!.x},${H - pad.b} L${pts[0].x},${H - pad.b} Z`

  return (
    <div style={card} className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Score Trend</h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>12-month rolling</p>
        </div>
        <div className="text-right">
          <div className="text-[26px] font-800 leading-none" style={{ color: 'var(--success)' }}>91</div>
          <div className="flex items-center gap-1 mt-0.5 justify-end" style={{ color: 'var(--success)' }}>
            <TrendingUp size={10} />
            <span className="text-[10px]">+19 pts</span>
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {[70, 80, 90].map((v) => {
          const y = pad.t + ((max - v) / (max - min)) * (H - pad.t - pad.b)
          return (
            <g key={v}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
              <text x={pad.l - 4} y={y + 3} textAnchor="end" style={{ fontSize: 8, fill: 'var(--text-muted)', fontFamily: 'Alegreya, serif' }}>{v}</text>
            </g>
          )
        })}
        <path d={area} fill="var(--success)" fillOpacity={0.07} />
        <path d={path} fill="none" stroke="var(--success)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {pts.filter((_, i) => i % 3 === 0 || i === pts.length - 1).map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill="var(--success)" />
            <text x={p.x} y={H - pad.b + 12} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--text-muted)', fontFamily: 'Alegreya, serif' }}>
              {months[i * 3]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function cellBg(val: number, type: 'critical' | 'high' | 'medium' | 'low') {
  if (val === 0) return { bg: 'var(--bg-secondary)', text: 'var(--border)' }
  const varMap = {
    critical: 'var(--error)',
    high: 'var(--high)',
    medium: 'var(--warning)',
    low: 'var(--success)',
  }
  const opacities = ['20%', '40%', '60%', '80%', '100%']
  const idx = Math.min(val - 1, opacities.length - 1)
  const opacity = opacities[idx]
  return {
    bg: `color-mix(in srgb, ${varMap[type]} ${opacity}, transparent)`,
    text: val > 2 ? 'var(--brand-text)' : 'var(--text-secondary)',
  }
}

function Heatmap({ heatmap }: { heatmap: any[] }) {
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Risk Heatmap by Service</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <th className="text-left text-[10px] font-600 uppercase tracking-wider px-5 py-3" style={{ color: 'var(--text-muted)' }}>Service</th>
              {['Critical', 'High', 'Medium', 'Low'].map((h) => (
                <th key={h} className="text-center text-[10px] font-600 uppercase tracking-wider px-3 py-3" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
              <th className="text-center text-[10px] font-600 uppercase tracking-wider px-3 py-3" style={{ color: 'var(--text-muted)' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {heatmap.map((row) => {
              const total = row.critical + row.high + row.medium + row.low
              return (
                <tr key={row.service} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--card-hover)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <td className="px-5 py-3 text-[13px] font-500" style={{ color: 'var(--text-primary)' }}>{row.service}</td>
                  {(['critical', 'high', 'medium', 'low'] as const).map((key) => {
                    const c = cellBg(row[key], key)
                    return (
                      <td key={key} className="px-3 py-2 text-center">
                        <div className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[13px] font-700 mx-auto"
                          style={{ background: c.bg, color: c.text }}>{row[key]}</div>
                      </td>
                    )
                  })}
                  <td className="px-3 py-3 text-center text-[13px] font-600" style={{ color: 'var(--text-primary)' }}>{total}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TopVulnerable({ topVuln }: { topVuln: any[] }) {
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-[14px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Critical Assets</h3>
      </div>
      {topVuln.map((api, i) => (
        <div key={api.name} className="flex items-center gap-4 px-5 py-4 border-b transition-colors" style={{ borderColor: 'var(--border-subtle)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--card-hover)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-700 flex-shrink-0" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>{i + 1}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-500 font-mono truncate" style={{ color: 'var(--text-primary)' }}>{api.name}</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{api.service} · {api.issues} issues</div>
          </div>
          <div className="flex items-center gap-1.5">
            {api.trend === 'up' && <TrendingUp size={11} style={{ color: 'var(--error)' }} />}
            {api.trend === 'down' && <TrendingDown size={11} style={{ color: 'var(--success)' }} />}
            <span className="text-[15px] font-800" style={{ color: api.score >= 9 ? 'var(--error)' : api.score >= 7 ? 'var(--high)' : 'var(--warning)' }}>{api.score}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function RiskContributors({ contributors }: { contributors: any[] }) {
  return (
    <div style={card} className="p-5">
      <h3 className="text-[14px] font-600 mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Risk Contributors</h3>
      <div className="space-y-3">
        {contributors.map((r) => (
          <div key={r.cat}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{r.cat}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{r.count} issues</span>
                <span className="text-[12px] font-600" style={{ color: r.color }}>{r.pct}%</span>
              </div>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BusinessImpact({ impactItems }: { impactItems: any[] }) {
  return (
    <div style={card} className="p-5">
      <h3 className="text-[14px] font-600 mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Business Impact</h3>
      <div className="grid grid-cols-2 gap-3">
        {impactItems.map((item) => (
          <div key={item.label} className="p-4 rounded-[12px]" style={{ background: `color-mix(in srgb, ${item.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${item.color} 22%, transparent)` }}>
            <div className="text-[22px] font-800 leading-none" style={{ color: item.color }}>{item.value}</div>
            <div className="text-[11px] mt-1.5" style={{ color: item.color, opacity: 0.85 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RiskAssessment() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [heatmap, setHeatmap] = useState<any>(null)
  const [topVulnerable, setTopVulnerable] = useState<any>(null)
  const [trendPoints, setTrendPoints] = useState<any>(null)
  const [trendMonths, setTrendMonths] = useState<any>(null)
  const [riskContributors, setRiskContributors] = useState<any>(null)
  const [businessImpact, setBusinessImpact] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        
        const [
          heatmapData,
          topVuln,
          trendP,
          trendM,
          riskContrib,
          busImpact
        ] = await Promise.all([
          riskAssessmentService.getHeatmap(),
          riskAssessmentService.getTopVulnerable(),
          riskAssessmentService.getTrendPoints(),
          riskAssessmentService.getTrendMonths(),
          riskAssessmentService.getRiskContributors(),
          riskAssessmentService.getBusinessImpact()
        ])

        setHeatmap(heatmapData)
        setTopVulnerable(topVuln)
        setTrendPoints(trendP)
        setTrendMonths(trendM)
        setRiskContributors(riskContrib)
        setBusinessImpact(busImpact)
      } catch (err) {
        console.error('Failed to load risk assessment data:', err)
        setError('Failed to load risk assessment data. Please try again.')
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
            <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Loading risk assessment...</p>
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

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-[22px] font-700 tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Risk Assessment</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>Overall security posture and risk metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RiskGauge />
        <div className="lg:col-span-2"><ScoreTrend trendPts={trendPoints} months={trendMonths} /></div>
      </div>

      <Heatmap heatmap={heatmap} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopVulnerable topVuln={topVulnerable} />
        <RiskContributors contributors={riskContributors} />
        <BusinessImpact impactItems={businessImpact} />
      </div>
    </div>
  )
}
