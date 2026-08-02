import { useState, Fragment, useEffect } from 'react'
import {
  Search, ZoomIn, ZoomOut, RefreshCw, Download, X,
  AlertCircle, CheckCircle2, Activity, Sparkles, ChevronRight,
  GitBranch, Info, Server, Database, Globe, Shield, Layers, Zap
} from 'lucide-react'
import { serviceService } from '../services/serviceService'

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const NW = 138, NH = 82
const VW = 1260, VH = 570

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
type Risk     = 'Critical' | 'High' | 'Medium' | 'Low' | 'Healthy' | 'Inactive'
type Traffic  = 'high' | 'medium' | 'low'
type SvcType  = 'Core' | 'Security' | 'Commerce' | 'Data' | 'Infrastructure' | 'External' | 'Platform'

interface SNode {
  id: string; label: string; type: SvcType; owner: string; version: string
  endpoints: number; health: number; latency: number; auth: string
  risk: Risk; isExternal?: boolean; cx: number; cy: number
  findings: string[]
}
interface SEdge { from: string; to: string; traffic: Traffic; isExternal?: boolean }

/* ═══════════════════════════════════════════════════════
   STYLE MAPS
═══════════════════════════════════════════════════════ */
const RISK_S: Record<Risk, { bg: string; border: string; text: string; strip: string }> = {
  Critical: { bg: 'color-mix(in srgb, var(--error) 13%, var(--card))',   border: 'var(--error)',         text: 'var(--error)',         strip: 'var(--error)' },
  High:     { bg: 'color-mix(in srgb, var(--high) 13%, var(--card))',    border: 'var(--high)',          text: 'var(--high)',          strip: 'var(--high)' },
  Medium:   { bg: 'color-mix(in srgb, var(--warning) 12%, var(--card))', border: 'var(--warning)',       text: 'var(--warning)',       strip: 'var(--warning)' },
  Low:      { bg: 'color-mix(in srgb, var(--success) 10%, var(--card))', border: 'var(--success)',       text: 'var(--success)',       strip: 'var(--success)' },
  Healthy:  { bg: 'var(--card)',                                          border: 'var(--border)',        text: 'var(--text-muted)',    strip: 'var(--success)' },
  Inactive: { bg: 'var(--bg-secondary)',                                  border: 'var(--border-subtle)', text: 'var(--text-muted)',    strip: 'var(--border)' },
}

const TYPE_C: Record<SvcType, string> = {
  Core: 'var(--brand)', Security: 'var(--error)', Commerce: 'var(--high)',
  Data: 'var(--info)', Infrastructure: 'var(--text-muted)', External: '#A78BFA', Platform: 'var(--warning)',
}

const TRAFFIC_W: Record<Traffic, number> = { high: 2.6, medium: 1.7, low: 1.0 }
const FLOW_SPD:  Record<Traffic, number> = { high: 1.6, medium: 2.8, low: 4.5 }

/* ═══════════════════════════════════════════════════════
   GEOMETRY
═══════════════════════════════════════════════════════ */
const ff = (n: number) => n.toFixed(1)

function borderPt(cx: number, cy: number, tx: number, ty: number, gap = 10) {
  const dx = tx - cx, dy = ty - cy
  const hw = NW / 2 + gap, hh = NH / 2 + gap
  const sX = Math.abs(dx) > 0.01 ? hw / Math.abs(dx) : 1e9
  const sY = Math.abs(dy) > 0.01 ? hh / Math.abs(dy) : 1e9
  const sc = Math.min(sX, sY)
  return { x: cx + dx * sc, y: cy + dy * sc }
}

interface EGeom { path: string; arrowPath: string }

function computeEdge(a: SNode, b: SNode): EGeom {
  const s = borderPt(a.cx, a.cy, b.cx, b.cy)
  const e = borderPt(b.cx, b.cy, a.cx, a.cy)
  const dx = e.x - s.x, dy = e.y - s.y
  const c1x = s.x + dx * 0.46, c1y = s.y + dy * 0.04
  const c2x = e.x - dx * 0.46, c2y = e.y - dy * 0.04
  const path = `M${ff(s.x)},${ff(s.y)} C${ff(c1x)},${ff(c1y)} ${ff(c2x)},${ff(c2y)} ${ff(e.x)},${ff(e.y)}`
  const adx = e.x - c2x, ady = e.y - c2y
  const al  = Math.sqrt(adx * adx + ady * ady) || 1
  const nx = adx / al, ny = ady / al, px = -ny, py = nx
  const aL = 9, aW = 3.5
  const arrowPath = `M${ff(e.x - nx*aL + px*aW)},${ff(e.y - ny*aL + py*aW)} L${ff(e.x)},${ff(e.y)} L${ff(e.x - nx*aL - px*aW)},${ff(e.y - ny*aL - py*aW)}`
  return { path, arrowPath }
}

/* ═══════════════════════════════════════════════════════
   SVG NODE
═══════════════════════════════════════════════════════ */
function GraphNode({
  node, isSelected, isHovered, isHighlighted, hasHighlight, showCrit, critPath,
  onSelect, onHover, onContextMenu,
}: {
  node: SNode; isSelected: boolean; isHovered: boolean
  isHighlighted: boolean; hasHighlight: boolean; showCrit: boolean; critPath: Set<string>
  onSelect: () => void; onHover: (id: string | null) => void
  onContextMenu: (e: React.MouseEvent) => void
}) {
  const rs = RISK_S[node.risk]
  const tc = TYPE_C[node.type]
  const dimmed = hasHighlight && !isHighlighted
  const isCrit = showCrit && critPath.has(node.id)
  const tlx = node.cx - NW / 2
  const tly = node.cy - NH / 2

  return (
    <g
      style={{ cursor: 'pointer', opacity: dimmed ? 0.1 : 1, transition: 'opacity 0.2s' }}
      onClick={e => { e.stopPropagation(); onSelect() }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onContextMenu={onContextMenu}
    >
      {/* Critical path ring */}
      {isCrit && (
        <rect x={tlx - 5} y={tly - 5} width={NW + 10} height={NH + 10} rx="15"
          fill="none" stroke="var(--error)" strokeWidth="1.5" strokeDasharray="5 3"
          style={{ animation: 'critPulse 1.8s ease-in-out infinite' }} />
      )}

      {/* Selection / hover glow ring */}
      {(isSelected || isHovered) && (
        <rect x={tlx - 4} y={tly - 4} width={NW + 8} height={NH + 8} rx="14"
          fill="none"
          stroke={isSelected ? 'var(--brand)' : rs.border}
          strokeWidth={isSelected ? 2.5 : 1.5}
          opacity={isSelected ? undefined : 0.55}
          style={isSelected ? { animation: 'selPulse 1.6s ease-in-out infinite' } : {}}
        />
      )}

      {/* Critical risk ambient pulse */}
      {node.risk === 'Critical' && !isSelected && (
        <rect x={tlx - 6} y={tly - 6} width={NW + 12} height={NH + 12} rx="16"
          fill="none" stroke="var(--error)" strokeWidth="1"
          style={{ animation: 'critPulse 2.1s ease-in-out infinite' }} />
      )}

      {/* Drop shadow */}
      <rect x={tlx + 2} y={tly + 5} width={NW} height={NH} rx="10" style={{ fill: 'rgba(0,0,0,0.065)' }} />

      {/* Card background */}
      <rect x={tlx} y={tly} width={NW} height={NH} rx="10"
        style={{ fill: rs.bg, stroke: isSelected ? 'var(--brand)' : rs.border, strokeWidth: isSelected ? 2 : 1, transition: 'stroke 0.15s' }}
        strokeDasharray={node.isExternal ? '5 3' : undefined}
      />

      {/* Top accent strip */}
      <rect x={tlx} y={tly} width={NW} height={3} rx="10" style={{ fill: rs.strip }} />
      <rect x={tlx} y={tly + 1.5} width={NW} height={1.5} style={{ fill: rs.strip }} />

      {/* Type indicator dot */}
      <circle cx={tlx + 13} cy={tly + 17} r={5} style={{ fill: tc }} opacity={0.9} />

      {/* Service name */}
      <text x={tlx + 24} y={tly + 14}
        style={{ fontSize: 9.5, fontWeight: 700, fill: 'var(--text-primary)', fontFamily: 'Alegreya, serif', pointerEvents: 'none' }}>
        {node.label.length > 15 ? node.label.slice(0, 14) + '…' : node.label}
      </text>

      {/* Type · version */}
      <text x={tlx + 24} y={tly + 25}
        style={{ fontSize: 7.5, fill: 'var(--text-muted)', fontFamily: 'Alegreya, serif', pointerEvents: 'none' }}>
        {node.type} · v{node.version}
      </text>

      {/* Separator */}
      <line x1={tlx + 8} y1={tly + 32} x2={tlx + NW - 8} y2={tly + 32}
        stroke={rs.border} strokeWidth="0.5" opacity="0.3" />

      {/* Stats row 1 */}
      <text x={tlx + 10} y={tly + 43}
        style={{ fontSize: 8.5, fill: 'var(--text-secondary)', fontFamily: 'Alegreya, serif', pointerEvents: 'none' }}>
        {node.endpoints} APIs
      </text>
      <text x={tlx + NW / 2 + 2} y={tly + 43}
        style={{ fontSize: 8.5, fill: 'var(--text-secondary)', fontFamily: 'Alegreya, serif', pointerEvents: 'none' }}>
        ↑{node.health}%
      </text>

      {/* Stats row 2 */}
      <text x={tlx + 10} y={tly + 54}
        style={{ fontSize: 7.5, fill: 'var(--text-muted)', fontFamily: 'Alegreya, serif', pointerEvents: 'none' }}>
        {node.auth}
      </text>
      <text x={tlx + NW / 2 + 2} y={tly + 54}
        style={{ fontSize: 7.5, fill: 'var(--text-muted)', fontFamily: 'Alegreya, serif', pointerEvents: 'none' }}>
        {node.latency}ms
      </text>

      {/* Risk badge */}
      <rect x={tlx + 8} y={tly + NH - 19} width={NW - 16} height={14} rx="7"
        style={{ fill: `color-mix(in srgb, ${rs.strip} 12%, transparent)` }}
        stroke={rs.border} strokeWidth="0.6" opacity={0.85} />
      <circle cx={tlx + 18} cy={tly + NH - 12} r={2.5} style={{ fill: rs.text }} />
      <text x={tlx + 25} y={tly + NH - 8.5}
        style={{ fontSize: 7.5, fontWeight: 700, fill: rs.text, fontFamily: 'Alegreya, serif', pointerEvents: 'none' }}>
        {node.risk} Risk
      </text>

      {/* External label */}
      {node.isExternal && (
        <text x={tlx + NW - 8} y={tly + NH - 8.5} textAnchor="end"
          style={{ fontSize: 6.5, fill: '#A78BFA', fontFamily: 'Alegreya, serif', pointerEvents: 'none' }}>
          EXT
        </text>
      )}

      {/* Findings indicator dot */}
      {node.findings.length > 0 && (
        <circle cx={tlx + NW - 10} cy={tly + 10} r={4} style={{ fill: rs.text }}>
          <animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
      )}
      {node.findings.length > 0 && (
        <text x={tlx + NW - 10} y={tly + 13.5} textAnchor="middle"
          style={{ fontSize: 6, fontWeight: 700, fill: 'white', pointerEvents: 'none' }}>
          {node.findings.length}
        </text>
      )}
    </g>
  )
}

/* ═══════════════════════════════════════════════════════
   RIGHT PANEL — NODE DETAILS
═══════════════════════════════════════════════════════ */
function NodeDetails({
  node, edges, nodes, tab, onTabChange, onClose, onSelectNode,
}: {
  node: SNode; edges: SEdge[]; nodes: SNode[]
  tab: 'overview' | 'connections' | 'ai'
  onTabChange: (t: 'overview' | 'connections' | 'ai') => void
  onClose: () => void; onSelectNode: (id: string) => void
}) {
  const rs  = RISK_S[node.risk]
  const tc  = TYPE_C[node.type]
  const inc = edges.filter(e => e.to   === node.id).map(e => nodes.find(n => n.id === e.from)!).filter(Boolean)
  const out = edges.filter(e => e.from === node.id).map(e => nodes.find(n => n.id === e.to)!).filter(Boolean)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--brand) 4%, var(--sidebar-bg))' }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[9px] flex items-center justify-center flex-shrink-0"
              style={{ background: `color-mix(in srgb, ${tc} 16%, transparent)` }}>
              <div className="w-3.5 h-3.5 rounded-full" style={{ background: tc }} />
            </div>
            <div>
              <div className="text-[13px] font-700 leading-tight"
                style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>{node.label}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{node.type} · v{node.version}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-[6px] transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
          ><X size={14} /></button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-600 px-2 py-0.5 rounded-full"
            style={{ background: `color-mix(in srgb, ${rs.strip} 16%, transparent)`, color: rs.text, border: `1px solid color-mix(in srgb, ${rs.strip} 30%, transparent)` }}>
            ● {node.risk} Risk
          </span>
          {node.isExternal && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-500"
              style={{ background: 'color-mix(in srgb, #A78BFA 14%, transparent)', color: '#A78BFA' }}>External</span>
          )}
          <span className="ml-auto text-[10px] font-600"
            style={{ color: node.health >= 85 ? 'var(--success)' : node.health >= 65 ? 'var(--warning)' : 'var(--error)' }}>
            {node.health}% healthy
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        {([['overview', 'Overview'], ['connections', 'Connections'], ['ai', 'AI']] as const).map(([t, label]) => (
          <button key={t} onClick={() => onTabChange(t)}
            className="flex-1 py-2.5 text-[11px] font-500 transition-colors"
            style={{
              color: tab === t ? 'var(--brand)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--brand)' : '2px solid transparent',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div className="flex-1 overflow-y-auto p-4">

        {tab === 'overview' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Owner', value: node.owner },
                { label: 'Auth', value: node.auth },
                { label: 'Endpoints', value: `${node.endpoints} APIs` },
                { label: 'Latency', value: `${node.latency}ms` },
              ].map(s => (
                <div key={s.label} className="p-2.5 rounded-[10px]"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="text-[9px] uppercase tracking-wider font-500 mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                  <div className="text-[12px] font-600 truncate" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Health bar */}
            <div className="p-3 rounded-[10px]" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] uppercase tracking-wider font-600" style={{ color: 'var(--text-muted)' }}>Health Score</span>
                <span className="text-[13px] font-700"
                  style={{ color: node.health >= 85 ? 'var(--success)' : node.health >= 65 ? 'var(--warning)' : 'var(--error)' }}>
                  {node.health}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{ width: `${node.health}%`, background: node.health >= 85 ? 'var(--success)' : node.health >= 65 ? 'var(--warning)' : 'var(--error)', transition: 'width 0.6s ease' }} />
              </div>
            </div>

            {/* Findings */}
            {node.findings.length > 0 && (
              <div>
                <div className="text-[9px] uppercase tracking-wider font-600 mb-2" style={{ color: 'var(--text-muted)' }}>
                  Findings ({node.findings.length})
                </div>
                <div className="space-y-1.5">
                  {node.findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-[8px]"
                      style={{ background: 'color-mix(in srgb, var(--error) 7%, var(--card))', border: '1px solid color-mix(in srgb, var(--error) 20%, transparent)' }}>
                      <AlertCircle size={10} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--error)' }} />
                      <span className="text-[11px] leading-snug" style={{ color: 'var(--text-secondary)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {node.findings.length === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-[10px]"
                style={{ background: 'color-mix(in srgb, var(--success) 8%, var(--card))', border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)' }}>
                <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                <span className="text-[11px] font-500" style={{ color: 'var(--success)' }}>No security findings</span>
              </div>
            )}
          </div>
        )}

        {tab === 'connections' && (
          <div className="space-y-4">
            {/* Incoming */}
            <div>
              <div className="text-[9px] uppercase tracking-wider font-600 mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--info)' }}>↓</span> Incoming ({inc.length})
              </div>
              {inc.length === 0 ? (
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>No incoming connections — may be a leaf service.</p>
              ) : (
                <div className="space-y-1.5">
                  {inc.map(n => (
                    <button key={n.id} onClick={() => onSelectNode(n.id)}
                      className="flex items-center gap-2.5 w-full p-2.5 rounded-[10px] text-left transition-all"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--brand)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: RISK_S[n.risk].strip }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-500 truncate" style={{ color: 'var(--text-primary)' }}>{n.label}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{n.type}</div>
                      </div>
                      <ChevronRight size={11} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing */}
            <div>
              <div className="text-[9px] uppercase tracking-wider font-600 mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--warning)' }}>↑</span> Outgoing ({out.length})
              </div>
              {out.length === 0 ? (
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>No outgoing connections.</p>
              ) : (
                <div className="space-y-1.5">
                  {out.map(n => (
                    <button key={n.id} onClick={() => onSelectNode(n.id)}
                      className="flex items-center gap-2.5 w-full p-2.5 rounded-[10px] text-left transition-all"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--brand)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: RISK_S[n.risk].strip }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-500 truncate" style={{ color: 'var(--text-primary)' }}>{n.label}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{n.type}</div>
                      </div>
                      <ChevronRight size={11} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'ai' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={11} style={{ color: 'var(--brand)' }} />
              <span className="text-[11px] font-600" style={{ color: 'var(--brand)' }}>AI Security Analysis</span>
            </div>

            {(node.risk === 'Critical' || node.risk === 'High') ? (
              <>
                <div className="p-3 rounded-[10px]"
                  style={{ background: 'color-mix(in srgb, var(--error) 7%, var(--card))', border: '1px solid color-mix(in srgb, var(--error) 20%, transparent)' }}>
                  <div className="text-[9px] uppercase tracking-wider font-600 mb-1.5" style={{ color: 'var(--error)' }}>Business Impact</div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {inc.length > 0
                      ? `${inc.length} upstream service${inc.length > 1 ? 's' : ''} depend on ${node.label}. A failure cascades to all downstream consumers.`
                      : `${node.label} is an entry point. Compromise here exposes ${node.endpoints} API endpoints.`}
                  </p>
                </div>

                <div className="p-3 rounded-[10px]"
                  style={{ background: 'color-mix(in srgb, var(--success) 7%, var(--card))', border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)' }}>
                  <div className="text-[9px] uppercase tracking-wider font-600 mb-1.5" style={{ color: 'var(--success)' }}>Suggested Fix</div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {node.auth === 'None'
                      ? 'Add JWT or OAuth 2.0 middleware. This is the critical path — deploy immediately.'
                      : 'Implement rate limiting, input validation, and circuit-breaker patterns on all endpoints.'}
                  </p>
                </div>

                <div className="p-3 rounded-[10px]"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="text-[9px] uppercase tracking-wider font-600 mb-1.5" style={{ color: 'var(--text-muted)' }}>Architecture Note</div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Consider deploying a redundant instance with health-check failover. Add distributed tracing to surface latency spikes early.
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button className="flex-1 py-2.5 text-[11px] font-600 rounded-[10px]"
                    style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}>
                    Start Remediation
                  </button>
                  <button className="flex-1 py-2.5 text-[11px] font-600 rounded-[10px] border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    View Report
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 size={30} className="mb-3" style={{ color: 'var(--success)' }} />
                <p className="text-[12px] font-600" style={{ color: 'var(--text-primary)' }}>No critical issues</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>This service meets security standards.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   PLACEHOLDER (nothing selected)
═══════════════════════════════════════════════════════ */
function PanelPlaceholder({ nodes, edges }: { nodes: SNode[], edges: SEdge[] }) {
  const critCount  = nodes.filter(n => n.risk === 'Critical').length
  const depCount   = edges.length
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-4"
        style={{ background: 'color-mix(in srgb, var(--brand) 10%, transparent)' }}>
        <GitBranch size={22} style={{ color: 'var(--brand)', opacity: 0.6 }} />
      </div>
      <p className="text-[13px] font-600 mb-1.5" style={{ color: 'var(--text-secondary)', fontFamily: 'Alegreya, serif' }}>
        Select a service node
      </p>
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Click any node in the graph to inspect its connections, findings, and AI recommendations.
      </p>
      <div className="mt-6 space-y-2 w-full text-left">
        {[
          { icon: AlertCircle, label: `${critCount} critical services`, color: 'var(--error)' },
          { icon: Activity,    label: `${depCount} active dependencies`, color: 'var(--info)' },
          { icon: Sparkles,    label: 'AI insights ready',              color: 'var(--brand)' },
        ].map(item => {
          const Icon = item.icon
          return (
            <div key={item.label} className="flex items-center gap-2.5 p-2.5 rounded-[10px]"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <Icon size={12} style={{ color: item.color }} />
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
import type { Page } from '../App'

export default function DependencyGraph({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [NODES, setNODES] = useState<SNode[]>([])
  const [EDGES, setEDGES] = useState<SEdge[]>([])
  const [stats, setStats] = useState<any>(null)
  
  const [selected,        setSelected]       = useState<string | null>(null)
  const [hovered,         setHovered]        = useState<string | null>(null)
  const [zoom,            setZoom]           = useState(1)
  const [search,          setSearch]         = useState('')
  const [riskFilters,     setRiskFilters]    = useState<Set<Risk>>(new Set<Risk>(['Critical', 'High', 'Medium', 'Low', 'Healthy', 'Inactive']))
  const [typeFilters,     setTypeFilters]    = useState<Set<SvcType>>(new Set<SvcType>())
  const [showCritPath,    setShowCritPath]   = useState(false)
  const [detailTab,       setDetailTab]      = useState<'overview' | 'connections' | 'ai'>('overview')
  const [ctxMenu,         setCtxMenu]        = useState<{ x: number; y: number; nodeId: string } | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        
        const [nodesData, edgesData, statsData] = await Promise.all([
          serviceService.getAllServices(),
          serviceService.getAllDependencies(),
          serviceService.getStats()
        ])

        setNODES(nodesData as unknown as SNode[])
        setEDGES(edgesData as unknown as SEdge[])
        setStats(statsData)
        setTypeFilters(new Set<SvcType>((nodesData as unknown as SNode[]).map(n => n.type)))
      } catch (err) {
        console.error('Failed to load dependency graph data:', err)
        setError('Failed to load dependency graph data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const focus = selected ?? hovered
  const highlighted: Set<string> | null = focus
    ? new Set([focus, ...EDGES.filter(e => e.from === focus || e.to === focus).flatMap(e => [e.from, e.to])])
    : null

  const CRIT_PATH = new Set(['gateway', 'auth', 'user', 'analytics'])
  const selectedNode = NODES.find(n => n.id === selected)

  const toggleRisk = (r: Risk) => setRiskFilters(prev => {
    const s = new Set(prev); s.has(r) ? s.delete(r) : s.add(r); return s
  })
  const toggleType = (t: SvcType) => setTypeFilters(prev => {
    const s = new Set(prev); s.has(t) ? s.delete(t) : s.add(t); return s
  })

  const kpis = stats ? [
    { label: 'Services',     value: stats.total,                                                color: 'var(--brand)' },
    { label: 'Total APIs',   value: stats.totalEndpoints,                                       color: 'var(--info)' },
    { label: 'Critical',     value: stats.critical,                                            color: 'var(--error)' },
    { label: 'Dependencies', value: stats.totalDependencies,                                  color: 'var(--text-secondary)' },
    { label: 'Ext. Services',value: stats.external,                                            color: '#A78BFA' },
    { label: 'Avg Health',   value: `${stats.avgHealth}%`,                                      color: 'var(--success)' },
  ] : []

  if (loading) {
    return (
      <div className="p-6 space-y-5 max-w-[1400px]">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--brand)' }} />
            <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Loading dependency graph...</p>
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
    <div className="flex h-full" style={{ background: 'var(--bg)' }}
      onClick={() => setCtxMenu(null)}>

      {/* ──────────────── LEFT SIDEBAR ──────────────── */}
      <aside className="w-[214px] flex-shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}>

        {/* Search */}
        <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="relative">
            <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services…"
              className="w-full pl-7 pr-2 py-1.5 text-[11px] rounded-[8px] border focus:outline-none"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
              onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>
        </div>

        {/* Risk filter */}
        <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[9px] font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Risk Level</div>
          {(['Critical', 'High', 'Medium', 'Low', 'Healthy'] as Risk[]).map(r => (
            <label key={r} className="flex items-center gap-2 py-1 cursor-pointer group">
              <div onClick={() => toggleRisk(r)}
                className="w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ background: riskFilters.has(r) ? RISK_S[r].border : 'transparent', borderColor: RISK_S[r].border }}>
                {riskFilters.has(r) && <span style={{ fontSize: 8, color: 'white', fontWeight: 700 }}>✓</span>}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: RISK_S[r].strip }} />
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{r}</span>
              </div>
            </label>
          ))}
        </div>

        {/* Service type filter */}
        <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[9px] font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Service Type</div>
          {(['Core', 'Security', 'Commerce', 'Data', 'Infrastructure', 'Platform', 'External'] as SvcType[]).map(t => (
            <label key={t} className="flex items-center gap-2 py-0.5 cursor-pointer">
              <div onClick={() => toggleType(t)}
                className="w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ background: typeFilters.has(t) ? TYPE_C[t] : 'transparent', borderColor: TYPE_C[t] }}>
                {typeFilters.has(t) && <span style={{ fontSize: 7, color: 'white', fontWeight: 700 }}>✓</span>}
              </div>
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{t}</span>
            </label>
          ))}
        </div>

        {/* Options */}
        <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[9px] font-600 uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>Display</div>
          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Critical Path</span>
            <div onClick={() => setShowCritPath(p => !p)}
              className="w-8 h-4 rounded-full relative transition-colors cursor-pointer flex-shrink-0"
              style={{ background: showCritPath ? 'var(--brand)' : 'var(--border)' }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                style={{ left: showCritPath ? '18px' : '2px' }} />
            </div>
          </div>
        </div>

        {/* Connection legend */}
        <div className="p-3 mt-auto">
          <div className="text-[9px] font-600 uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>Connections</div>
          <div className="space-y-2">
            {[
              { stroke: 'var(--brand)', width: 2.5, dash: '', label: 'High traffic' },
              { stroke: 'var(--border)', width: 1, dash: '', label: 'Low traffic' },
              { stroke: '#A78BFA', width: 1.5, dash: '5 3', label: 'External service' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2.5">
                <svg width="26" height="6" style={{ flexShrink: 0 }}>
                  <line x1="0" y1="3" x2="26" y2="3" stroke={l.stroke} strokeWidth={l.width} strokeDasharray={l.dash || undefined} />
                </svg>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{l.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2.5 mt-1">
              <div className="w-6 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{ width: '40%', background: 'var(--brand)', animation: 'dashFlow 1.6s linear infinite' }} />
              </div>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Animated = data flow</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ──────────────── CENTER ──────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* KPI bar */}
        <div className="flex items-center gap-0 border-b flex-shrink-0"
          style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)', height: 44 }}>
          {kpis.map((k, i) => (
            <Fragment key={k.label}>
              {i > 0 && <div className="w-px h-5 flex-shrink-0" style={{ background: 'var(--border)' }} />}
              <div className="flex items-center gap-2 px-4 flex-shrink-0">
                <span className="text-[19px] font-800 leading-none" style={{ color: k.color, fontFamily: 'Alegreya, serif' }}>
                  {k.value}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{k.label}</span>
              </div>
            </Fragment>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 border-b flex-shrink-0"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', height: 40 }}>
          <div className="flex items-center gap-0.5 border rounded-[8px] px-1" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => setZoom(z => Math.min(2, +(z + 0.15).toFixed(2)))}
              className="p-1.5 rounded-[6px] transition-colors" style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            ><ZoomIn size={12} /></button>
            <span className="text-[10px] w-8 text-center font-500" style={{ color: 'var(--text-muted)' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={() => setZoom(z => Math.max(0.4, +(z - 0.15).toFixed(2)))}
              className="p-1.5 rounded-[6px] transition-colors" style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            ><ZoomOut size={12} /></button>
          </div>

          {[
            { label: 'Reset', icon: RefreshCw,  action: () => { setZoom(1); setSelected(null); setHovered(null) } },
            { label: 'Export',icon: Download,    action: () => {} },
          ].map(btn => {
            const Icon = btn.icon
            return (
              <button key={btn.label} onClick={btn.action}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[11px] border transition-colors"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <Icon size={10} /> {btn.label}
              </button>
            )
          })}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {NODES.length} services · {EDGES.length} connections
            </span>
            {selected && (
              <button onClick={() => setSelected(null)}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-[6px]"
                style={{ background: 'color-mix(in srgb, var(--brand) 12%, transparent)', color: 'var(--brand)' }}>
                <X size={9} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Graph canvas */}
        <div className="flex-1 overflow-auto relative"
          style={{ background: 'var(--bg)' }}
          onClick={e => { if ((e.target as Element).tagName === 'svg' || (e.target as Element).tagName === 'rect') { setSelected(null); setCtxMenu(null) } }}
        >
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            style={{ width: VW * zoom, height: VH * zoom, display: 'block', minWidth: '100%', minHeight: '100%' }}
          >
            <style>{`
              @keyframes dashFlow  { to { stroke-dashoffset: -24; } }
              @keyframes critPulse { 0%,100% { opacity:.45; } 50% { opacity:0; } }
              @keyframes selPulse  { 0%,100% { opacity:.7;  } 50% { opacity:.2; } }
            `}</style>

            <defs>
              <pattern id="dotgrid" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="0.9" fill="var(--border)" opacity="0.55" />
              </pattern>
            </defs>

            {/* Dot-grid background */}
            <rect width={VW} height={VH} style={{ fill: 'url(#dotgrid)' }} />

            {/* ── EDGES ── */}
            {EDGES.map(e => {
              const a = NODES.find(n => n.id === e.from)
              const b = NODES.find(n => n.id === e.to)
              if (!a || !b) return null
              const geom     = computeEdge(a, b)
              const isActive = !!(highlighted?.has(e.from) && highlighted?.has(e.to))
              const dimmed   = !!(highlighted && !isActive)
              const isCrit   = showCritPath && CRIT_PATH.has(e.from) && CRIT_PATH.has(e.to)
              const color    = isCrit ? 'var(--error)' : (isActive ? 'var(--brand)' : 'var(--border)')
              const width    = TRAFFIC_W[e.traffic]
              const speed    = FLOW_SPD[e.traffic]
              const edgeHovered = hovered === `${e.from}-${e.to}`

              return (
                <g 
                  key={`${e.from}-${e.to}`} 
                  style={{ transition: 'opacity 0.2s', cursor: 'pointer' }} 
                  opacity={dimmed ? 0.08 : 1}
                  onMouseEnter={() => setHovered(`${e.from}-${e.to}`)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(e.from)}
                >
                  {/* Base path */}
                  <path d={geom.path} fill="none"
                    stroke={edgeHovered ? 'var(--brand)' : color} 
                    strokeWidth={edgeHovered ? width + 1.2 : (isActive ? width + 0.8 : width)}
                    strokeDasharray={e.isExternal ? '7 5' : undefined}
                    style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                  />
                  {/* Animated flow overlay */}
                  <path d={geom.path} fill="none"
                    stroke={isCrit ? 'var(--error)' : (isActive ? 'var(--brand)' : 'var(--text-muted)')}
                    strokeWidth={1.4} strokeDasharray="4 20"
                    opacity={isActive || isCrit ? 0.85 : 0.18}
                    style={{ animation: `dashFlow ${isActive ? speed * 0.65 : speed * 1.9}s linear infinite`, transition: 'opacity 0.2s' }}
                  />
                  {/* Arrowhead */}
                  <path d={geom.arrowPath} fill="none"
                    stroke={edgeHovered ? 'var(--brand)' : color} 
                    strokeWidth={edgeHovered ? 2.2 : (isActive ? 1.8 : 1.4)} 
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: 'stroke 0.2s' }}
                  />
                </g>
              )
            })}

            {/* ── NODES ── */}
            {NODES.map(node => {
              const matchSrch = !search || node.label.toLowerCase().includes(search.toLowerCase()) || node.type.toLowerCase().includes(search.toLowerCase())
              const matchRisk = riskFilters.has(node.risk)
              const matchType = typeFilters.has(node.type)
              if (!matchSrch || !matchRisk || !matchType) return (
                <g key={node.id} style={{ opacity: 0.05, pointerEvents: 'none' }}>
                  <rect x={node.cx - NW / 2} y={node.cy - NH / 2} width={NW} height={NH} rx="10"
                    style={{ fill: 'var(--border)' }} />
                </g>
              )
              return (
                <GraphNode
                  key={node.id}
                  node={node}
                  isSelected={selected === node.id}
                  isHovered={hovered === node.id}
                  isHighlighted={!!(highlighted?.has(node.id))}
                  hasHighlight={!!highlighted}
                  showCrit={showCritPath}
                  critPath={CRIT_PATH}
                  onSelect={() => { setSelected(selected === node.id ? null : node.id); setDetailTab('overview') }}
                  onHover={setHovered}
                  onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, nodeId: node.id }) }}
                />
              )
            })}
          </svg>

          {/* Context menu */}
          {ctxMenu && (
            <div className="fixed z-50 rounded-[12px] border py-1 shadow-2xl overflow-hidden"
              style={{ left: ctxMenu.x, top: ctxMenu.y, background: 'var(--card)', borderColor: 'var(--border)', minWidth: 166 }}
              onClick={e => e.stopPropagation()}>
              {[
                { label: 'View Details',     icon: Info },
                { label: 'Focus Path',       icon: GitBranch },
                { label: 'Analyze Service',  icon: Activity },
                { label: 'Hide Node',        icon: X },
              ].map(item => {
                const Icon = item.icon
                return (
                  <button key={item.label}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-left transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--card-hover)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                    onClick={() => { if (item.label === 'View Details') { setSelected(ctxMenu.nodeId); setDetailTab('overview') } setCtxMenu(null) }}
                  >
                    <Icon size={12} style={{ color: 'var(--text-muted)' }} /> {item.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Bottom legend */}
        <div className="flex items-center gap-5 px-4 border-t flex-shrink-0"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', height: 34 }}>
          <span className="text-[9px] font-600 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Risk:</span>
          {(['Critical', 'High', 'Medium', 'Low', 'Healthy'] as Risk[]).map(r => (
            <div key={r} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full border" style={{ background: RISK_S[r].bg, borderColor: RISK_S[r].border }} />
              <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{r}</span>
            </div>
          ))}
          <span className="text-[9px] font-600 uppercase tracking-wider ml-4" style={{ color: 'var(--text-muted)' }}>Type:</span>
          {(['Core', 'Security', 'Commerce', 'Data', 'Infrastructure', 'External'] as SvcType[]).map(t => (
            <div key={t} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: TYPE_C[t] }} />
              <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{t}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1 text-[9px]" style={{ color: 'var(--text-muted)' }}>
            <Activity size={9} />
            Flowing lines = live data
          </div>
        </div>
      </div>

      {/* ──────────────── RIGHT PANEL ──────────────── */}
      <aside className="w-[286px] flex-shrink-0 flex flex-col border-l overflow-hidden"
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}>
        {selectedNode ? (
          <NodeDetails
            node={selectedNode}
            edges={EDGES}
            nodes={NODES}
            tab={detailTab}
            onTabChange={setDetailTab}
            onClose={() => setSelected(null)}
            onSelectNode={id => { setSelected(id); setDetailTab('overview') }}
          />
        ) : (
          <PanelPlaceholder nodes={NODES} edges={EDGES} />
        )}
      </aside>
    </div>
  )
}
