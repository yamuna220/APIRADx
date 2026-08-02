import { useState, useEffect } from 'react'
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown, AlertTriangle, Shield, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react'
import { vulnerabilityService } from '../services/vulnerabilityService'
import type { Page } from '../App'

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18 }

const sevColors: Record<string, { text: string; bg: string }> = {
  Critical: { text: 'var(--error)', bg: 'color-mix(in srgb, var(--error) 12%, transparent)' },
  High: { text: 'var(--high)', bg: 'color-mix(in srgb, var(--high) 12%, transparent)' },
  Medium: { text: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 12%, transparent)' },
  Low: { text: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 12%, transparent)' },
}

function FindingCard({ f, onNavigate }: { f: any; onNavigate: (page: Page) => void }) {
  const [open, setOpen] = useState(false)
  const sc = sevColors[f.severity]

  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <button className="w-full flex items-start gap-4 p-5 text-left" onClick={() => setOpen(!open)}
        style={{ borderBottom: open ? '1px solid var(--border)' : undefined }}>
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[11px] font-700"
          style={{ background: sc.bg, color: sc.text }}>
          {f.id}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-600" style={{ color: 'var(--text-primary)' }}>{f.title}</span>
            <span className="text-[9px] font-500 px-2 py-0.5 rounded-full font-mono border" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>{f.owasp}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] font-600 px-2 py-0.5 rounded-[5px]" style={{ color: sc.text, background: sc.bg }}>{f.severity}</span>
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{f.endpoint}</span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{f.affected} endpoint{f.affected !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-[20px] font-800 leading-none" style={{ color: sc.text }}>{f.cvss}</div>
            <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>CVSS</div>
          </div>
          <ChevronRight size={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} style={{ color: 'var(--text-muted)' }} />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-[12px]" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-[10px] font-600 mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Description</div>
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.description}</p>
          </div>
          <div className="p-4 rounded-[12px] border" style={{ background: 'color-mix(in srgb, var(--high) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--high) 22%, transparent)' }}>
            <div className="text-[10px] font-600 mb-2 flex items-center gap-1 uppercase tracking-wider" style={{ color: 'var(--high)' }}>
              <AlertTriangle size={10} /> Business Impact
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.impact}</p>
          </div>
          <div className="p-4 rounded-[12px] border" style={{ background: 'color-mix(in srgb, var(--success) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--success) 22%, transparent)' }}>
            <div className="text-[10px] font-600 mb-2 flex items-center gap-1 uppercase tracking-wider" style={{ color: 'var(--success)' }}>
              <Shield size={10} /> Suggested Fix
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.fix}</p>
          </div>
          <div className="p-4 rounded-[12px]" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-[10px] font-600 mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Technical Details</div>
            <p className="text-[12px] leading-relaxed font-mono" style={{ color: 'var(--text-muted)' }}>{f.technical}</p>
          </div>
          <div className="md:col-span-2">
            <button className="text-[11px] font-500 flex items-center gap-1" style={{ color: 'var(--info)' }}>
              View in OWASP docs <ExternalLink size={10} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SecurityAnalysis({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [findings, setFindings] = useState<any[]>([])
  const [counts, setCounts] = useState<any>(null)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('severity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        
        const [findingsData, countsData] = await Promise.all([
          vulnerabilityService.getAllVulnerabilities(),
          vulnerabilityService.getSeverityCounts()
        ])

        setFindings(findingsData)
        setCounts(countsData)
      } catch (err) {
        console.error('Failed to load security analysis data:', err)
        setError('Failed to load security analysis data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])
  
  const filtered = filter === 'All' ? findings : findings.filter((f) => f.severity === filter)
  
  const searched = search 
    ? filtered.filter((f: any) => 
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase())
      )
    : filtered

  if (loading) {
    return (
      <div className="p-6 space-y-5 max-w-[1400px]">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--brand)' }} />
            <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Loading security analysis...</p>
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
  
  const sorted = [...searched].sort((a, b) => {
    let comparison = 0
    if (sortBy === 'severity') {
      const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
      comparison = severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]
    } else if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title)
    } else if (sortBy === 'description') {
      comparison = a.description.localeCompare(b.description)
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })
  
  const paginated = sorted.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  const totalPages = Math.ceil(sorted.length / itemsPerPage)

  return (
    <div className="p-6 space-y-5 max-w-[1000px]">
      <div>
        <h1 className="text-[22px] font-700 tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Security Analysis</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>OWASP API Security Top 10 findings across your API ecosystem.</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search findings..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 rounded-[10px] border text-[12px]"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1) }}
            className="pl-3 pr-8 py-2 rounded-[10px] border text-[12px] appearance-none cursor-pointer"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="severity">Severity</option>
            <option value="title">Title</option>
            <option value="description">Description</option>
          </select>
          <ArrowUpDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
        </div>
        
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-2 rounded-[10px] border text-[12px] font-500 transition-colors"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {Object.entries(counts).map(([sev, count]) => {
          const sc = sevColors[sev] ?? { text: 'var(--text-muted)', bg: 'var(--border)' }
          return (
            <button key={sev} onClick={() => { setFilter(filter === sev ? 'All' : sev); setPage(1) }}
              className="p-4 rounded-[18px] border-2 text-left transition-all"
              style={{ background: filter === sev ? sc.bg : 'var(--card)', borderColor: filter === sev ? sc.text : 'var(--border)' }}
            >
              <div className="text-[30px] font-800 leading-none" style={{ color: sc.text }}>{count as number}</div>
              <div className="text-[12px] font-500 mt-1.5" style={{ color: filter === sev ? sc.text : 'var(--text-secondary)' }}>{sev}</div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between text-[12px]" style={{ color: 'var(--text-muted)' }}>
        <span>Showing {paginated.length} of {sorted.length} findings</span>
        <span>Page {page} of {totalPages}</span>
      </div>

      <div className="space-y-3">
        {paginated.map((f) => <FindingCard key={f.id} f={f} onNavigate={onNavigate} />)}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-[8px] border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={16} />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="w-8 h-8 rounded-[8px] text-[12px] font-600 transition-colors"
              style={{ 
                background: page === p ? 'var(--brand)' : 'var(--card)', 
                color: page === p ? 'var(--brand-text)' : 'var(--text-secondary)',
                border: page === p ? 'none' : '1px solid var(--border)'
              }}
            >
              {p}
            </button>
          ))}
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-[8px] border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
