import { useState, useEffect, useRef, Fragment } from 'react'
import {
  TrendingUp, TrendingDown, RefreshCw, ExternalLink, Clock, Zap,
  AlertCircle, CheckCircle2, FileText, Upload, Shield, BarChart2,
  Database, ChevronRight, ArrowUpRight, Sparkles, User, ZoomIn, ZoomOut
} from 'lucide-react'
import { dashboardService } from '../services'
import { useUploads } from '../context/UploadContext'
import { useNotifications } from '../context/NotificationContext'
import { useUser } from '../context/UserContext'
import type { Page } from '../App'

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18 }

const methodC: Record<string, string> = {
  GET: 'var(--info)', POST: 'var(--success)', PUT: 'var(--warning)',
  DELETE: 'var(--error)', PATCH: '#A78BFA'
}
const riskC: Record<string, string> = {
  Critical: 'var(--error)', High: 'var(--high)', Medium: 'var(--warning)', Low: 'var(--success)'
}
const statusC: Record<string, string> = {
  Vulnerable: 'var(--error)', Reviewing: 'var(--warning)', Secure: 'var(--success)'
}

// ── Animated counter ─────────────────────────────────────────────
function Counter({ to, duration = 900 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(to * eased))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [to, duration])
  return <>{val}</>
}

// ── Mini sparkline ───────────────────────────────────────────────
function Spark({ data, color, h = 36 }: { data: number[]; color: string; h?: number }) {
  const W = 80
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = path + ` L${pts.at(-1)!.x},${h} L0,${h} Z`
  return (
    <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace(/[^a-z]/gi, '')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── KPI card ─────────────────────────────────────────────────────

interface KPIProps {
  id: string; label: string; value: number; display?: string
  sub: string; trend: 'up' | 'down'; trendPct: string
  color: string; accentColor: string; icon: React.ComponentType<{ size?: number }>
  goodTrend: 'up' | 'down'
  sparkData: number[]
  onClick?: () => void
}
function KPICard({ id, label, value, display, sub, trend, trendPct, color, accentColor, icon: Icon, goodTrend, sparkData, onClick }: KPIProps) {
  const [hovered, setHovered] = useState(false)
  const good = trend === goodTrend
  return (
    <div 
      style={{ ...card, position: 'relative', overflow: 'hidden', transition: 'transform 0.18s ease, box-shadow 0.18s ease', transform: hovered ? 'translateY(-2px)' : 'translateY(0)', boxShadow: hovered ? '0 8px 28px color-mix(in srgb, var(--brand) 12%, transparent)' : 'none', cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={() => setHovered(true)} 
      onMouseLeave={() => setHovered(false)} 
      onClick={onClick}
    >
      {/* Accent strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[18px]" style={{ background: accentColor }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center" style={{ background: `color-mix(in srgb, ${accentColor} 14%, transparent)` }}>
              <Icon size={14} />
            </div>
            <span className="text-[11px] font-600 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
          </div>
          <div className={`flex items-center gap-1 text-[11px] font-600 px-2 py-0.5 rounded-full`}
            style={{ color: good ? 'var(--success)' : 'var(--error)', background: good ? 'color-mix(in srgb, var(--success) 12%, transparent)' : 'color-mix(in srgb, var(--error) 12%, transparent)' }}>
            {trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trendPct}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[36px] font-800 tracking-tight leading-none" style={{ color }}>
              {display ?? <Counter to={value} />}
            </div>
            <div className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>{sub}</div>
          </div>
          <Spark data={sparkData} color={accentColor} h={40} />
        </div>
      </div>
    </div>
  )
}

// ── Donut chart ──────────────────────────────────────────────────
function DonutChart({ segs, score }: { segs: any[], score: number }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const r = 52, cx = 68, cy = 68, circ = 2 * Math.PI * r, gap = 3
  let off = 0
  const arcs = segs.map((s, i) => {
    const dash = (s.pct / 100) * circ - gap
    const arc = { ...s, dash, off, i }
    off += (s.pct / 100) * circ
    return arc
  })

  return (
    <div style={card} className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-700" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>OWASP Distribution</h3>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>284 APIs · API2:2023 top violated</p>
        </div>
        <span className="text-[10px] font-600 px-2 py-1 rounded-full" style={{ background: 'color-mix(in srgb, var(--success) 14%, transparent)', color: 'var(--success)' }}>
          Score {score}/100
        </span>
      </div>
      <div className="flex items-center gap-5 flex-wrap">
        <div className="relative flex-shrink-0" style={{ width: 136, height: 136, minWidth: 136, minHeight: 136 }}>
          <svg width="136" height="136" viewBox="0 0 136 136" style={{ width: '100%', height: '100%' }}>
            {arcs.map((arc) => {
              const isH = hovered === arc.i
              return (
                <circle key={arc.label} cx={cx} cy={cy} r={isH ? r + 3 : r} fill="none"
                  stroke={arc.color} strokeWidth={isH ? 16 : 13}
                  strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
                  strokeDashoffset={-arc.off + circ * 0.25}
                  style={{ cursor: 'pointer', transition: 'r 0.15s, stroke-width 0.15s' }}
                  onMouseEnter={() => setHovered(arc.i)}
                  onMouseLeave={() => setHovered(null)}
                />
              )
            })}
            <text x={cx} y={cy - 7} textAnchor="middle" style={{ fontSize: 'clamp(18px, 5vw, 23px)', fontWeight: 800, fontFamily: 'Alegreya, serif', fill: 'var(--text-primary)' }}>{score}</text>
            <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: 'clamp(8px, 2vw, 10px)', fontFamily: 'Alegreya, serif', fill: 'var(--text-muted)' }}>Score</text>
            {hovered !== null && (
              <text x={cx} y={cy + 26} textAnchor="middle" style={{ fontSize: 'clamp(7px, 1.5vw, 9px)', fontFamily: 'Alegreya, serif', fill: arcs[hovered].color }}>
                {arcs[hovered].value} ({arcs[hovered].pct}%)
              </text>
            )}
          </svg>
        </div>
        <div className="flex-1 space-y-2.5 min-w-0">
          {segs.map((s, i) => (
            <div key={s.label} className="flex items-center justify-between cursor-pointer rounded-[8px] px-2 py-1.5 -mx-2 transition-colors"
              style={{ background: hovered === i ? `color-mix(in srgb, ${s.color} 8%, transparent)` : 'transparent' }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-[12px] truncate" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
                <span className="text-[11px] font-700 w-5 text-right" style={{ color: s.color }}>{s.value}</span>
                <span className="text-[10px] w-7 text-right" style={{ color: 'var(--text-muted)' }}>{s.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Risk trend area chart ─────────────────────────────────────────
function RiskTrend({ trendData, score }: { trendData: any[], score: number }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; v: number; label: string } | null>(null)
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '12m'>('12m')
  const [zoom, setZoom] = useState(1)
  const W = 400, H = 110, pad = { t: 12, r: 12, b: 28, l: 30 }
  const min = 50, max = 100
  
  // Filter data based on time range
  const monthsToShow = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12
  const filteredData = trendData.slice(-monthsToShow)
  const trendPts = filteredData.map(d => d.value)
  const trendMonths = filteredData.map(d => d.month)
  
  const pts = trendPts.map((v, i) => ({
    x: pad.l + (i / (trendPts.length - 1)) * (W - pad.l - pad.r),
    y: pad.t + ((max - v) / (max - min)) * (H - pad.t - pad.b),
    v, label: trendMonths[i],
  }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = path + ` L${pts.at(-1)!.x},${H - pad.b} L${pts[0].x},${H - pad.b} Z`
  const gradId = 'trendGrad'

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.25, 2))
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.25, 0.75))

  return (
    <div style={card} className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-700" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Security Score Trend</h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>12-month rolling average</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(['3m', '6m', '12m'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className="px-2 py-1 rounded-[6px] text-[10px] font-500 transition-colors"
                style={{
                  background: timeRange === range ? 'var(--brand)' : 'transparent',
                  color: timeRange === range ? 'var(--brand-text)' : 'var(--text-secondary)'
                }}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="flex gap-1 ml-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.75}
              className="p-1 rounded-[6px] transition-colors disabled:opacity-30"
              style={{ color: 'var(--text-muted)' }}
            >
              <ZoomOut size={12} />
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 2}
              className="p-1 rounded-[6px] transition-colors disabled:opacity-30"
              style={{ color: 'var(--text-muted)' }}
            >
              <ZoomIn size={12} />
            </button>
          </div>
        </div>
      </div>
      <div className="text-right mb-2">
        <div className="text-[30px] font-800 leading-none" style={{ color: 'var(--success)' }}>{score}</div>
        <div className="flex items-center gap-1 mt-1 justify-end" style={{ color: 'var(--success)' }}>
          <TrendingUp size={10} /><span className="text-[10px]">+33 pts YoY</span>
        </div>
      </div>
      <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[60, 75, 90].map((v) => {
            const y = pad.t + ((max - v) / (max - min)) * (H - pad.t - pad.b)
            return (
              <g key={v}>
                <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
                <text x={pad.l - 5} y={y + 3.5} textAnchor="end" style={{ fontSize: 8, fill: 'var(--text-muted)', fontFamily: 'Alegreya, serif' }}>{v}</text>
              </g>
            )
          })}
          <path d={area} fill={`url(#${gradId})`} />
          <path d={path} fill="none" stroke="var(--brand)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => (
            <g key={i}>
              {(i % 4 === 0 || i === pts.length - 1) && (
                <text x={p.x} y={H - pad.b + 14} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--text-muted)', fontFamily: 'Alegreya, serif' }}>{p.label}</text>
              )}
              <circle cx={p.x} cy={p.y} r={14} fill="transparent" style={{ cursor: 'pointer' }}
                onMouseEnter={() => setTooltip(p)}
                onMouseLeave={() => setTooltip(null)}
              />
              <circle cx={p.x} cy={p.y} r={tooltip?.x === p.x ? 4.5 : 3}
                fill="var(--brand)" style={{ transition: 'r 0.12s', pointerEvents: 'none' }}
              />
            </g>
          ))}
          {tooltip && (
            <g>
              <rect x={tooltip.x - 22} y={tooltip.y - 26} width={44} height={18} rx={5}
                fill="var(--card-elevated)" stroke="var(--border)" strokeWidth={1} />
              <text x={tooltip.x} y={tooltip.y - 13} textAnchor="middle"
                style={{ fontSize: 10, fontWeight: 700, fill: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>
                {tooltip.v}
              </text>
              <text x={tooltip.x} y={tooltip.y - 2} textAnchor="middle"
                style={{ fontSize: 8, fill: 'var(--text-muted)', fontFamily: 'Alegreya, serif' }}>
                {tooltip.label}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}

// ── Recent analysis table ─────────────────────────────────────────
const ownerColors = ['var(--brand)', 'var(--info)', 'var(--success)', '#A78BFA', 'var(--warning)']

function RecentAnalysis({ rows }: { rows: any[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-[14px] font-700" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Recent API Analysis</h3>
        <button className="flex items-center gap-1 text-[12px] font-500" style={{ color: 'var(--brand)' }}>
          View all <ArrowUpRight size={11} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 1 }}>
              {['API Endpoint', 'Service', 'Method', 'Auth', 'Owner', 'Risk', 'Status', 'Last Scan', ''].map((h) => (
                <th key={h} className="text-left text-[10px] font-600 uppercase tracking-wider px-4 py-3" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const mc = methodC[row.method] ?? 'var(--text-muted)'
              const rc = riskC[row.risk]
              const sc = statusC[row.status]
              const isOpen = expanded === i
              return (
                <Fragment key={i}>
                  <tr onClick={() => setExpanded(isOpen ? null : i)}
                    className="border-b transition-colors cursor-pointer"
                    style={{ borderColor: 'var(--border-subtle)', background: isOpen ? 'color-mix(in srgb, var(--brand) 6%, transparent)' : 'transparent' }}
                    onMouseEnter={(e) => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isOpen ? 'color-mix(in srgb, var(--brand) 6%, transparent)' : 'transparent' }}
                  >
                    <td className="px-4 py-3"><span className="text-[12px] font-500 font-mono" style={{ color: 'var(--text-primary)' }}>{row.name}</span></td>
                    <td className="px-4 py-3"><span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{row.service}</span></td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-700 px-2 py-0.5 rounded-[5px]" style={{ color: mc, background: `color-mix(in srgb, ${mc} 14%, transparent)` }}>{row.method}</span>
                    </td>
                    <td className="px-4 py-3"><span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{row.auth}</span></td>
                    <td className="px-4 py-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-700" style={{ background: ownerColors[i % ownerColors.length], color: 'var(--brand-text)' }}>{row.owner}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-600 px-2 py-0.5 rounded-[5px]" style={{ color: rc, background: `color-mix(in srgb, ${rc} 14%, transparent)` }}>{row.risk}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {row.status === 'Vulnerable' && <AlertCircle size={11} style={{ color: sc }} />}
                        {row.status === 'Secure' && <CheckCircle2 size={11} style={{ color: sc }} />}
                        {row.status === 'Reviewing' && <Clock size={11} style={{ color: sc }} />}
                        <span className="text-[11px] font-500" style={{ color: sc }}>{row.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{row.scan}</span></td>
                    <td className="px-4 py-3">
                      <ChevronRight size={13} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} style={{ color: 'var(--text-muted)' }} />
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                      <td colSpan={9} className="px-4 py-4" style={{ background: 'color-mix(in srgb, var(--brand) 4%, transparent)' }}>
                        <div className="flex items-center gap-6">
                          <div>
                            <div className="text-[10px] font-600 uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Endpoint</div>
                            <code className="text-[11px] font-mono" style={{ color: 'var(--text-primary)' }}>{row.name}</code>
                          </div>
                          <div>
                            <div className="text-[10px] font-600 uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Authentication</div>
                            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{row.auth}</span>
                          </div>
                          <div>
                            <div className="text-[10px] font-600 uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Service</div>
                            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{row.service}</span>
                          </div>
                          <div className="ml-auto flex gap-2">
                            <button className="text-[11px] font-600 px-3 py-1.5 rounded-[8px] border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>Quick View</button>
                            <button className="text-[11px] font-600 px-3 py-1.5 rounded-[8px]" style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}>View Analysis</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Most Vulnerable APIs ─────────────────────────────────────────
function MostVulnerable({ vuln }: { vuln: any[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  return (
    <div style={card} className="p-5">
      <h3 className="text-[14px] font-700 mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Most Vulnerable APIs</h3>
      <div className="space-y-3">
        {vuln.map((v, i) => {
          const scoreColor = v.score >= 9 ? 'var(--error)' : v.score >= 7 ? 'var(--high)' : 'var(--warning)'
          const isH = hovered === i
          return (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-[10px] transition-colors cursor-pointer"
              style={{ background: isH ? 'var(--card-hover)' : 'transparent' }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-700 flex-shrink-0" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-500 font-mono truncate" style={{ color: 'var(--text-primary)' }}>{v.name}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{v.service}</div>
                <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(v.score / 10) * 100}%`, background: scoreColor }} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {v.delta === 'up' && <TrendingUp size={10} style={{ color: 'var(--error)' }} />}
                {v.delta === 'down' && <TrendingDown size={10} style={{ color: 'var(--success)' }} />}
                <span className="text-[13px] font-700" style={{ color: scoreColor }}>{v.score}</span>
              </div>
              {isH && <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── AI Insights panel ─────────────────────────────────────────────
function AIInsights({ insights, onNavigate }: { insights: any[]; onNavigate: (page: Page) => void }) {
  const sevC: Record<string, string> = { Critical: 'var(--error)', High: 'var(--high)', Medium: 'var(--warning)' }
  const [expanded, setExpanded] = useState<number | null>(null)
  
  const handleViewDetails = (insight: any) => {
    // Navigate to security analysis page with the insight details
    onNavigate('security-analysis')
  }
  
  return (
    <div style={card} className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-[7px] flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--brand) 18%, transparent)' }}>
          <Sparkles size={12} style={{ color: 'var(--brand)' }} />
        </div>
        <h3 className="text-[14px] font-700" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>AI Insights</h3>
        <span className="ml-auto text-[10px] font-600 px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--brand) 12%, transparent)', color: 'var(--brand)' }}>
          {insights?.length || 0} issues
        </span>
      </div>
      <div className="space-y-2">
        {insights?.map((ins, i) => {
          const c = sevC[ins.sev]
          const open = expanded === i
          return (
            <div key={i} className="rounded-[12px] overflow-hidden border" style={{ background: `color-mix(in srgb, ${c} 6%, transparent)`, borderColor: `color-mix(in srgb, ${c} 20%, transparent)` }}>
              <button className="w-full flex items-start gap-3 p-3 text-left" onClick={() => setExpanded(open ? null : i)}>
                <AlertCircle size={13} style={{ color: c, flexShrink: 0, marginTop: 1 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-700 px-1.5 py-0.5 rounded-[4px]" style={{ color: c, background: `color-mix(in srgb, ${c} 14%, transparent)` }}>{ins.sev}</span>
                    <span className="text-[12px] font-500" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>{ins.text}</span>
                  </div>
                </div>
                <ChevronRight size={12} className={`transition-transform flex-shrink-0 mt-0.5 ${open ? 'rotate-90' : ''}`} style={{ color: 'var(--text-muted)' }} />
              </button>
              {open && (
                <div className="px-4 pb-3 space-y-2.5 border-t" style={{ borderColor: `color-mix(in srgb, ${c} 15%, transparent)` }}>
                  <div className="pt-2.5 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9px] font-600 uppercase tracking-wider mb-1" style={{ color: c }}>Business Impact</div>
                      <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{ins.impact}</p>
                    </div>
                    <div>
                      <div className="text-[9px] font-600 uppercase tracking-wider mb-1" style={{ color: 'var(--success)' }}>Suggested Fix</div>
                      <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{ins.fix}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={10} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Estimated fix time: {ins.time}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-[11px] font-600 px-3 py-1.5 rounded-[8px] flex-1" style={{ background: c, color: 'var(--brand-text)' }}>{ins.action}</button>
                    <button 
                      onClick={() => handleViewDetails(ins)}
                      className="text-[11px] font-600 px-3 py-1.5 rounded-[8px] border" 
                      style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                    >View Details</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ... (rest of the code remains the same)

function ActivityTimeline({ timeline, onNavigate }: { timeline: any[]; onNavigate: (page: Page) => void }) {
  const handleItemClick = (item: any) => {
    // Navigate based on the activity type
    if (item.type === 'upload') {
      onNavigate('upload-apis')
    } else if (item.type === 'scan') {
      onNavigate('security-analysis')
    } else if (item.type === 'report') {
      onNavigate('reports')
    } else if (item.type === 'api') {
      onNavigate('api-inventory')
    }
  }

  return (
    <div style={card} className="p-5">
      <h3 className="text-[14px] font-700 mb-5" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>API Activity Timeline</h3>
      <div>
        {timeline.map((item, i) => {
          const Icon = item.icon
          return (
            <div 
              key={i} 
              className="flex gap-4 relative cursor-pointer group"
              onClick={() => handleItemClick(item)}
            >
              {i < timeline.length - 1 && (
                <div className="absolute left-[15px] top-9 w-px" style={{ bottom: 0, background: 'var(--border-subtle)' }} />
              )}
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 mt-0.5 transition-colors" style={{ background: `color-mix(in srgb, ${item.colorVar} 16%, transparent)`, border: `1.5px solid color-mix(in srgb, ${item.colorVar} 30%, transparent)` }}>
                <Icon size={13} style={{ color: item.colorVar }} />
              </div>
              <div className="pb-5 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[13px] font-600 group-hover:underline" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                    <span className="text-[10px] font-600 px-2 py-0.5 rounded-full ml-2" style={{ background: `color-mix(in srgb, ${item.colorVar} 12%, transparent)`, color: item.colorVar }}>{item.status}</span>
                  </div>
                  <span className="text-[10px] whitespace-nowrap flex items-center gap-1 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={9} /> {item.time}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.sub}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                    <User size={9} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.user}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Upload mini card ──────────────────────────────────────────────
function UploadCard({ uploadHistory, onUpload }: { uploadHistory: any[], onUpload: () => void }) {
  const [drag, setDrag] = useState(false)
  return (
    <div style={card} className="p-5">
      <h3 className="text-[14px] font-700 mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Recent Uploads</h3>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false) }}
        onClick={onUpload}
        className="flex flex-col items-center py-7 rounded-[14px] border-2 border-dashed cursor-pointer transition-all mb-4"
        style={{ borderColor: drag ? 'var(--brand)' : 'var(--border)', background: drag ? 'color-mix(in srgb, var(--brand) 6%, transparent)' : 'var(--bg-secondary)' }}
      >
        <div className="w-12 h-12 rounded-[12px] flex items-center justify-center mb-3" style={{ background: drag ? 'var(--brand)' : 'color-mix(in srgb, var(--brand) 14%, transparent)' }}>
          <Upload size={20} style={{ color: drag ? 'var(--brand-text)' : 'var(--brand)' }} />
        </div>
        <p className="text-[13px] font-600" style={{ color: 'var(--text-primary)' }}>{drag ? 'Drop to upload' : 'Drag & drop API spec'}</p>
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
          or <span className="font-500" style={{ color: 'var(--brand)' }}>browse files</span>
        </p>
        <div className="flex items-center gap-1.5 mt-3">
          {['JSON', 'YAML', 'Swagger', 'OpenAPI'].map((t) => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-[4px] border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>{t}</span>
          ))}
        </div>
      </div>
      {uploadHistory.map((f) => (
        <div key={f.name} className="flex items-center gap-3 py-2.5 border-b last:border-b-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--brand) 12%, transparent)' }}>
            <FileText size={12} style={{ color: 'var(--brand)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-500 truncate" style={{ color: 'var(--text-primary)' }}>{f.name}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{f.size} · {f.time}</div>
          </div>
          <span className="text-[10px] font-600 px-2 py-0.5 rounded-full" style={{ color: 'var(--success)', background: 'color-mix(in srgb, var(--success) 12%, transparent)' }}>Analyzed</span>
        </div>
      ))}
    </div>
  )
}

// ── Hero section ────────────────────────────────────────────────────
function Hero({ onScan, onUpload, onNavigate, stats }: { onScan: () => void; onUpload: () => void; onNavigate: (page: Page) => void, stats: any }) {
  const { user } = useUser()
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const { addNotification } = useNotifications()

  const handleScan = () => {
    setScanning(true)
    setProgress(0)
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    setTimeout(() => {
      setScanning(false)
      setProgress(0)
      addNotification({
        category: 'scan_finished',
        priority: 'normal',
        title: 'Scan Complete',
        message: 'Security scan completed successfully',
        actionUrl: 'security-analysis',
        actionLabel: 'View Results'
      })
    }, 2200)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const userName = user?.fullName || user?.username || 'there'

  return (
    <div className="relative rounded-[20px] overflow-hidden p-7" style={{ background: 'color-mix(in srgb, var(--brand) 8%, var(--card))', border: '1px solid var(--border)' }}>
      {/* Subtle mesh bg */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(var(--brand) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[26px] font-800 tracking-tight leading-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>
              {getGreeting()}, {userName} 👋
            </h1>
            <p className="text-[14px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              Your API ecosystem is <span className="font-600" style={{ color: 'var(--success)' }}>healthy</span>. Last full scan 2 minutes ago.
            </p>

            <div className="flex items-center gap-5 mt-4">
              {[
                { label: `${stats?.totalAPIs || 0} APIs`, sub: 'Monitored', color: 'var(--info)' },
                { label: `${stats?.criticalIssues || 0} Critical`, sub: 'Need attention', color: 'var(--error)' },
                { label: `Score ${stats?.securityScore || 0}`, sub: 'Security grade', color: 'var(--success)' },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-[18px] font-800 leading-none" style={{ color: m.color }}>{m.label}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button onClick={handleScan} disabled={scanning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-600 transition-all disabled:opacity-70"
              style={{ background: 'var(--brand)', color: 'var(--brand-text)', transform: scanning ? 'scale(0.97)' : 'scale(1)' }}
              onMouseEnter={(e) => { if (!scanning) (e.currentTarget as HTMLElement).style.background = 'var(--brand-hover)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--brand)' }}
            >
              <RefreshCw size={13} className={scanning ? 'animate-spin' : ''} />
              {scanning ? `Scanning... ${progress}%` : 'Run Scan'}
            </button>
            <button 
              onClick={onUpload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-600 border transition-all"
              style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', background: 'var(--card)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--card)' }}
            >
              <Upload size={13} /> Upload Spec
            </button>
            <button 
              onClick={() => onNavigate('reports')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-600 border transition-all"
              style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', background: 'var(--card)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--card)' }}
            >
              <FileText size={13} /> Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────


export default function Dashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { uploadedSpecs, getTotalEndpoints, getTotalRisks } = useUploads()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    dashboardService.getDashboardData().then(res => {
        setData(res)
        setLoading(false)
    })
  }, [uploadedSpecs])
  
  if (loading || !data) {
      return <div className="p-6">Loading dashboard data from real backend...</div>
  }
  
  const kpiSparkData = dashboardService.getKPISparkData()
  const { stats, owaspDistribution, vulnerableAPIs, recentAnalysis, aiInsights, uploadHistory, activityTimeline } = data
  const trendData = [] // Implement trend if needed
  
  const totalAPIs = stats.totalAPIs
  const totalCritical = stats.criticalIssues
  const handleUpload = () => onNavigate('upload-apis')
return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <Hero onScan={() => {}} onUpload={handleUpload} onNavigate={onNavigate} stats={stats} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          id="apis" 
          label="Total APIs" 
          value={totalAPIs} 
          sub="Across 12 services" 
          trend="up" 
          trendPct="+12%" 
          color="var(--text-primary)" 
          accentColor="var(--info)" 
          icon={Database} 
          goodTrend="up" 
          sparkData={kpiSparkData.apis}
          onClick={() => onNavigate('api-inventory')}
        />
        <KPICard 
          id="critical" 
          label="Critical APIs" 
          value={totalCritical} 
          sub="Immediate attention needed" 
          trend="down" 
          trendPct="-8%" 
          color="var(--error)" 
          accentColor="var(--error)" 
          icon={AlertCircle} 
          goodTrend="down" 
          sparkData={kpiSparkData.critical}
          onClick={() => onNavigate('security-analysis')}
        />
        <KPICard 
          id="score" 
          label="Security Score" 
          value={stats.securityScore || 91} 
          sub="↑ 3 pts from last scan" 
          trend="up" 
          trendPct="+3.4%" 
          color="var(--success)" 
          accentColor="var(--success)" 
          icon={Shield} 
          goodTrend="up" 
          sparkData={kpiSparkData.score}
          onClick={() => onNavigate('risk-assessment')}
        />
        <KPICard 
          id="risk" 
          label="Risk Score" 
          value={32} 
          display="3.2" 
          sub="Low — within SLA targets" 
          trend="down" 
          trendPct="-5%" 
          color="var(--info)" 
          accentColor="var(--brand)" 
          icon={BarChart2} 
          goodTrend="down" 
          sparkData={kpiSparkData.risk}
          onClick={() => onNavigate('risk-assessment')}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><RiskTrend trendData={trendData} score={stats.securityScore || 0} /></div>
        <DonutChart segs={owaspDistribution} score={stats.securityScore || 0} />
      </div>

      {/* Table */}
      <RecentAnalysis rows={recentAnalysis} />

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <UploadCard uploadHistory={uploadHistory} onUpload={handleUpload} />
        <MostVulnerable vuln={vulnerableAPIs} />
        <AIInsights insights={aiInsights} onNavigate={onNavigate} />
      </div>

      {/* Timeline */}
      <ActivityTimeline timeline={activityTimeline} onNavigate={onNavigate} />
    </div>
  )
}
