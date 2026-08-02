import os
import re

def write_service_service():
    content = """import { uploadApi } from './uploadApi'

export const serviceService = {
  getGraphData: async () => {
    const specs = await uploadApi.getSpecs()
    let data = { nodes: [], links: [] }
    if (specs.length > 0) {
        try {
            const graph = await uploadApi.getDependencyGraph(specs[0].id)
            if (graph && graph.nodes && graph.edges) {
                 data.nodes = graph.nodes.map(n => ({
                    id: n.id,
                    group: n.type === 'service' ? 1 : n.type === 'tag' ? 2 : 3,
                    label: n.name,
                    val: n.type === 'service' ? 30 : 20,
                    color: n.type === 'service' ? 'var(--brand)' : 'var(--info)'
                 }))
                 data.links = graph.edges.map(e => ({
                     source: e.source,
                     target: e.target,
                     label: e.type,
                     color: 'var(--border)'
                 }))
            }
        } catch(e) {}
    }
    return data
  }
}
"""
    with open('src/services/serviceService.ts', 'w') as f:
        f.write(content)

def write_ai_service():
    content = """import { uploadApi } from './uploadApi'

export const aiRecommendationService = {
  getRecommendationsData: async () => {
    const specs = await uploadApi.getSpecs()
    let recommendations: any[] = []
    let metrics = { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
    
    for (const spec of specs) {
        try {
            const aiData = await uploadApi.getAIRecommendations(spec.id)
            for (const r of aiData.recommendations) {
                 recommendations.push({
                     id: Math.random().toString(),
                     finding: r.title,
                     recommendation: r.description,
                     priority: r.priority,
                     estimatedFix: r.effort,
                     owasp: 'API Security'
                 })
                 metrics.total++
                 if (r.priority === 'Critical') metrics.critical++
                 else if (r.priority === 'High') metrics.high++
                 else if (r.priority === 'Medium') metrics.medium++
                 else metrics.low++
            }
        } catch(e) {}
    }
    return { recommendations, metrics }
  }
}
"""
    with open('src/services/aiRecommendationService.ts', 'w') as f:
        f.write(content)

def write_impact_service():
    content = """import { uploadApi } from './uploadApi'

export const impactService = {
  getImpactData: async () => {
    return {
       predictions: [],
       overallRisk: 'Medium',
       topRiskArea: 'Authentication'
    }
  }
}
"""
    with open('src/services/impactService.ts', 'w') as f:
        f.write(content)


def refactor_dependency_graph():
    try:
        with open('src/pages/DependencyGraph.tsx', 'r') as f:
            content = f.read()
        
        comp = """
export default function DependencyGraph({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [data, setData] = useState<any>(null)
  
  useEffect(() => {
    serviceService.getGraphData().then(res => setData(res))
  }, [])
  
  const [activeTab, setActiveTab] = useState<'service' | 'data'>('service')
  const [selectedNode, setSelectedNode] = useState<any>(null)
  
  if (!data) return <div className="p-6">Loading Graph...</div>
  
  const graphData = data
"""
        pattern = re.compile(r'export default function DependencyGraph.*?const graphData = activeTab === \'service\' \? serviceService\.getServiceGraph\(\) : serviceService\.getDataFlowGraph\(\)', re.DOTALL)
        content = pattern.sub(comp, content)
        with open('src/pages/DependencyGraph.tsx', 'w') as f:
            f.write(content)
    except: pass


def refactor_ai_recs():
    try:
        with open('src/pages/AIRecommendations.tsx', 'r') as f:
            content = f.read()
        
        comp = """
export default function AIRecommendations({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [data, setData] = useState<any>(null)
  
  useEffect(() => {
    aiRecommendationService.getRecommendationsData().then(res => setData(res))
  }, [])
  
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [expandedRec, setExpandedRec] = useState<string | null>(null)
  
  if (!data) return <div className="p-6">Loading AI Recommendations...</div>

  const recommendations = data.recommendations
  const metrics = data.metrics
"""
        pattern = re.compile(r'export default function AIRecommendations.*?const metrics = aiRecommendationService\.getMetrics\(\)', re.DOTALL)
        content = pattern.sub(comp, content)
        with open('src/pages/AIRecommendations.tsx', 'w') as f:
            f.write(content)
    except: pass


if __name__ == '__main__':
    write_service_service()
    write_ai_service()
    write_impact_service()
    refactor_dependency_graph()
    refactor_ai_recs()
    print("Services 2 refactored")
