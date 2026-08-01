import {
  LayoutDashboard, Database, Upload, Shield, GitBranch,
  AlertTriangle, Sparkles, Zap, FileText, Settings,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import type { Page } from '../App'
import Logo from './Logo'

interface NavItem { id: Page; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'api-inventory', label: 'API Inventory', icon: Database },
  { id: 'upload-apis', label: 'Upload Specification', icon: Upload },
  { id: 'security-analysis', label: 'Security Analysis', icon: Shield },
  { id: 'dependency-graph', label: 'Dependency Graph', icon: GitBranch },
  { id: 'risk-assessment', label: 'Risk Assessment', icon: AlertTriangle },
  { id: 'ai-recommendations', label: 'AI Recommendations', icon: Sparkles },
  { id: 'impact-prediction', label: 'Impact Prediction', icon: Zap },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
]

interface Props {
  current: Page
  collapsed: boolean
  onNavigate: (p: Page) => void
  onToggleCollapse: () => void
}

export default function Sidebar({ current, collapsed, onNavigate, onToggleCollapse }: Props) {
  return (
    <aside
      className="flex flex-col border-r scrollbar-none overflow-y-auto transition-all duration-200 flex-shrink-0"
      style={{
        width: collapsed ? 60 : 220,
        background: 'var(--sidebar-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center px-4 border-b flex-shrink-0"
        style={{ height: 60, borderColor: 'var(--border)' }}
      >
        <Logo size={collapsed ? 28 : 32} showText={!collapsed} collapsed={collapsed} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const active = current === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className="flex items-center gap-3 w-full rounded-[10px] px-3 py-2.5 text-left transition-all"
              style={{
                background: active ? 'color-mix(in srgb, var(--brand) 14%, transparent)' : 'transparent',
                color: active ? 'var(--brand)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)' }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <Icon size={15} className="flex-shrink-0" />
              {!collapsed && <span className="text-[13px] font-500">{item.label}</span>}
              {!collapsed && active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand)' }} />}
            </button>
          )
        })}
      </nav>

      {/* Collapse */}
      <div className="px-2 py-3 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-full rounded-[10px] py-2 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /><span className="text-[12px] ml-2">Collapse</span></>}
        </button>
      </div>
    </aside>
  )
}
