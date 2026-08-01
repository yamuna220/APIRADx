import { useState, useEffect, useRef } from 'react'
import { Search, LayoutDashboard, Database, Upload, Shield, GitBranch, AlertTriangle, Sparkles, Zap, FileText, Settings } from 'lucide-react'
import type { Page } from '../App'

const cmds = [
  { label: 'Dashboard', page: 'dashboard' as Page, icon: LayoutDashboard, desc: 'Security overview & metrics' },
  { label: 'API Inventory', page: 'api-inventory' as Page, icon: Database, desc: 'Browse all 284 APIs' },
  { label: 'Upload Specification', page: 'upload-apis' as Page, icon: Upload, desc: 'Import OpenAPI / Swagger' },
  { label: 'Security Analysis', page: 'security-analysis' as Page, icon: Shield, desc: 'OWASP findings' },
  { label: 'Dependency Graph', page: 'dependency-graph' as Page, icon: GitBranch, desc: 'Service relationships' },
  { label: 'Risk Assessment', page: 'risk-assessment' as Page, icon: AlertTriangle, desc: 'Scoring & heatmaps' },
  { label: 'AI Recommendations', page: 'ai-recommendations' as Page, icon: Sparkles, desc: 'AI-powered fixes' },
  { label: 'Impact Prediction', page: 'impact-prediction' as Page, icon: Zap, desc: 'Simulate changes' },
  { label: 'Reports', page: 'reports' as Page, icon: FileText, desc: 'Generate & export' },
  { label: 'Settings', page: 'settings' as Page, icon: Settings, desc: 'Workspace preferences' },
]

interface Props { onNavigate: (p: Page) => void; onClose: () => void }

export default function CommandPalette({ onNavigate, onClose }: Props) {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = cmds.filter(
    (c) => c.label.toLowerCase().includes(q.toLowerCase()) || c.desc.toLowerCase().includes(q.toLowerCase())
  )

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { setSelected(0) }, [q])

  const go = (cmd: typeof cmds[0]) => { onNavigate(cmd.page); onClose() }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') setSelected((s) => Math.min(s + 1, results.length - 1))
      if (e.key === 'ArrowUp') setSelected((s) => Math.max(s - 1, 0))
      if (e.key === 'Enter' && results[selected]) go(results[selected])
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [results, selected])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div className="w-full max-w-[540px] mx-4 rounded-[18px] overflow-hidden shadow-2xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search pages, features..."
            className="flex-1 bg-transparent focus:outline-none text-[14px]"
            style={{ color: 'var(--text-primary)' }}
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded-[5px] font-mono" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div className="py-2 max-h-[360px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="py-10 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>No results for "{q}"</div>
          ) : (
            results.map((cmd, i) => {
              const Icon = cmd.icon
              const active = i === selected
              return (
                <button key={cmd.page} onClick={() => go(cmd)}
                  onMouseEnter={() => setSelected(i)}
                  className="flex items-center gap-3.5 w-full px-4 py-2.5 text-left transition-colors"
                  style={{ background: active ? 'color-mix(in srgb, var(--brand) 10%, transparent)' : 'transparent' }}
                >
                  <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? 'color-mix(in srgb, var(--brand) 18%, transparent)' : 'var(--bg-secondary)' }}>
                    <Icon size={14} style={{ color: active ? 'var(--brand)' : 'var(--text-secondary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-500" style={{ color: active ? 'var(--brand)' : 'var(--text-primary)' }}>{cmd.label}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{cmd.desc}</div>
                  </div>
                  {active && <kbd className="text-[10px] px-1.5 py-0.5 rounded-[5px] font-mono flex-shrink-0" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>↵</kbd>}
                </button>
              )
            })
          )}
        </div>

        <div className="px-4 py-2.5 border-t flex items-center gap-4" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[10px] flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <kbd className="px-1 py-0.5 rounded-[4px] font-mono text-[9px]" style={{ background: 'var(--bg-secondary)' }}>↑↓</kbd> navigate
          </span>
          <span className="text-[10px] flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <kbd className="px-1 py-0.5 rounded-[4px] font-mono text-[9px]" style={{ background: 'var(--bg-secondary)' }}>↵</kbd> open
          </span>
          <span className="text-[10px] flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <kbd className="px-1 py-0.5 rounded-[4px] font-mono text-[9px]" style={{ background: 'var(--bg-secondary)' }}>ESC</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}
