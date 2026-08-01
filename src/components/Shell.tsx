import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import CommandPalette from './CommandPalette'
import Dashboard from '../pages/Dashboard'
import APIInventory from '../pages/APIInventory'
import UploadAPIs from '../pages/UploadAPIs'
import SecurityAnalysis from '../pages/SecurityAnalysis'
import DependencyGraph from '../pages/DependencyGraph'
import RiskAssessment from '../pages/RiskAssessment'
import AIRecommendations from '../pages/AIRecommendations'
import ImpactPrediction from '../pages/ImpactPrediction'
import Reports from '../pages/Reports'
import ReportViewer from '../pages/ReportViewer'
import Settings from '../pages/Settings'
import type { Page } from '../App'

interface PageProps {
  onNavigate: (p: Page) => void
}

const pages: Record<Page, React.ComponentType<PageProps>> = {
  dashboard: Dashboard,
  'api-inventory': APIInventory,
  'upload-apis': UploadAPIs,
  'security-analysis': SecurityAnalysis,
  'dependency-graph': DependencyGraph,
  'risk-assessment': RiskAssessment,
  'ai-recommendations': AIRecommendations,
  'impact-prediction': ImpactPrediction,
  reports: Reports,
  'report-viewer': ReportViewer,
  settings: Settings,
}

interface Props {
  page: Page
  onNavigate: (p: Page) => void
  isDark: boolean
  onToggleDark: () => void
}

export default function Shell({ page, onNavigate, isDark, onToggleDark }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const PageComponent = pages[page]

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar current={page} collapsed={collapsed} onNavigate={onNavigate} onToggleCollapse={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav onNavigate={onNavigate} isDark={isDark} onToggleDark={onToggleDark} onOpenCmd={() => setCmdOpen(true)} />
        <main className="flex-1 overflow-hidden flex flex-col" style={{ background: 'var(--bg)' }}>
          <div className="flex-1 overflow-y-auto h-full">
            <PageComponent onNavigate={onNavigate} />
          </div>
        </main>
      </div>
      {cmdOpen && <CommandPalette onNavigate={onNavigate} onClose={() => setCmdOpen(false)} />}
    </div>
  )
}
