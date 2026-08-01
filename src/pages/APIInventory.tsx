import { useState } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { apiService } from '../services/apiService'

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18 }

const methodColors: Record<string, string> = { GET: 'var(--info)', POST: 'var(--success)', PUT: 'var(--warning)', DELETE: 'var(--error)', PATCH: '#A78BFA' }
const riskColors: Record<string, string> = { Critical: 'var(--error)', High: 'var(--high)', Medium: 'var(--warning)', Low: 'var(--success)' }

import type { Page } from '../App'

export default function APIInventory({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<number | null>(null)

  const apis = apiService.getAllAPIs()
  const PER = 7
  const risks = ['All', 'Critical', 'High', 'Medium', 'Low']
  const filtered = apis.filter(
    (a) => (riskFilter === 'All' || a.riskLabel === riskFilter) && (
      a.name.toLowerCase().includes(search.toLowerCase()) || a.endpoint.toLowerCase().includes(search.toLowerCase())
    )
  )
  const pages = Math.ceil(filtered.length / PER)
  const paged = filtered.slice((page - 1) * PER, page * PER)
  const detail = apis.find((a) => a.id === selected)

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-[22px] font-700 tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>API Inventory</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>{apis.length} APIs across 7 services</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-3 items-center mb-4 p-4" style={card}>
            <div className="relative flex-1 min-w-[200px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search APIs, endpoints..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-9 pr-3 py-2 text-[13px] rounded-[10px] border focus:outline-none transition-colors"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter size={12} style={{ color: 'var(--text-muted)' }} />
              {risks.map((r) => (
                <button key={r} onClick={() => { setRiskFilter(r); setPage(1) }}
                  className="text-[11px] font-500 px-2.5 py-1.5 rounded-[7px] transition-colors"
                  style={{
                    background: riskFilter === r ? 'var(--brand)' : 'var(--bg-secondary)',
                    color: riskFilter === r ? 'var(--brand-text)' : 'var(--text-secondary)',
                    border: `1px solid ${riskFilter === r ? 'var(--brand)' : 'var(--border)'}`,
                  }}
                >{r}</button>
              ))}
            </div>
          </div>

          <div style={{ ...card, overflow: 'hidden' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    {['API', 'Method', 'Endpoint', 'Version', 'Authentication', 'Owner', 'Risk Score', 'Status', 'Last Updated', ''].map((h) => (
                      <th key={h} className="text-left text-[10px] font-600 uppercase tracking-wider px-4 py-3" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((api) => {
                    const mc = methodColors[api.method] ?? 'var(--text-muted)'
                    const rc = riskColors[api.riskLabel]
                    const isSelected = selected === api.id
                    return (
                      <tr key={api.id} onClick={() => setSelected(isSelected ? null : api.id)}
                        className="border-b cursor-pointer transition-colors"
                        style={{ borderColor: 'var(--border-subtle)', background: isSelected ? 'color-mix(in srgb, var(--brand) 8%, transparent)' : 'transparent' }}
                        onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isSelected ? 'color-mix(in srgb, var(--brand) 8%, transparent)' : 'transparent' }}
                      >
                        <td className="px-4 py-3"><span className="text-[12px] font-600" style={{ color: 'var(--text-primary)' }}>{api.name}</span></td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-700 px-2 py-0.5 rounded-[4px]" style={{ color: mc, background: 'color-mix(in srgb,' + mc + ' 14%, transparent)' }}>{api.method}</span>
                        </td>
                        <td className="px-4 py-3"><span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{api.endpoint}</span></td>
                        <td className="px-4 py-3"><span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{api.version}</span></td>
                        <td className="px-4 py-3"><span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{api.auth}</span></td>
                        <td className="px-4 py-3"><span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{api.owner}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-700" style={{ color: rc }}>{api.risk}</span>
                            <span className="text-[9px] font-600 px-1.5 py-0.5 rounded-[4px]" style={{ color: rc, background: 'color-mix(in srgb,' + rc + ' 14%, transparent)' }}>{api.riskLabel}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: api.status === 'Active' ? 'var(--success)' : 'var(--text-muted)' }} />
                            <span className="text-[12px]" style={{ color: api.status === 'Active' ? 'var(--success)' : 'var(--text-muted)' }}>{api.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{api.updated}</span></td>
                        <td className="px-4 py-3">
                          <ExternalLink size={12} style={{ color: 'var(--border)' }} />
                        </td>
                      </tr>
                    )
                  })}
                  {paged.length === 0 && (
                    <tr><td colSpan={10} className="text-center py-12 text-[13px]" style={{ color: 'var(--text-muted)' }}>No APIs match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {filtered.length === 0 ? '0' : `${(page - 1) * PER + 1}–${Math.min(page * PER, filtered.length)}`} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="p-1.5 rounded-[6px] transition-colors disabled:opacity-30"
                  style={{ color: 'var(--text-secondary)' }}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-7 h-7 rounded-[6px] text-[12px] font-500 transition-colors"
                    style={{ background: p === page ? 'var(--brand)' : 'transparent', color: p === page ? 'var(--brand-text)' : 'var(--text-secondary)' }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages || pages === 0}
                  className="p-1.5 rounded-[6px] transition-colors disabled:opacity-30"
                  style={{ color: 'var(--text-secondary)' }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {detail && (
          <div className="w-72 self-start p-5 space-y-4" style={card}>
            <div className="flex items-start justify-between">
              <h3 className="text-[13px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>API Details</h3>
              <button onClick={() => setSelected(null)} className="text-[18px] leading-none" style={{ color: 'var(--text-muted)' }}>×</button>
            </div>
            <div className="font-mono text-[11px] p-3 rounded-[10px] break-all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{detail.endpoint}</div>
            <div className="space-y-2.5">
              {[
                { label: 'API Name', value: detail.name },
                { label: 'Service', value: detail.service },
                { label: 'Method', value: detail.method },
                { label: 'Auth', value: detail.auth },
                { label: 'Owner', value: detail.owner },
                { label: 'Version', value: detail.version },
                { label: 'Status', value: detail.status },
              ].map((r) => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                  <span className="text-[11px] font-500" style={{ color: 'var(--text-primary)' }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between items-center">
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Risk Score</span>
                <span className="text-[16px] font-700" style={{ color: riskColors[detail.riskLabel] }}>{detail.risk}</span>
              </div>
            </div>
            <button className="w-full py-2.5 rounded-[12px] text-[13px] font-500 transition-colors"
              style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--brand-hover)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--brand)')}
            >View Full Analysis</button>
          </div>
        )}
      </div>
    </div>
  )
}
