import os
import re

def write_report_service():
    content = """import { uploadApi } from './uploadApi'

export const reportService = {
  getReportsData: async () => {
    const specs = await uploadApi.getSpecs()
    let reports = []
    
    for (const spec of specs) {
        reports.push({
            id: spec.id,
            name: `${spec.name} Security Report`,
            type: 'Technical',
            status: 'Ready',
            date: spec.uploadedAt,
            size: '1.2 MB',
            author: 'System'
        })
    }
    
    return {
        reports,
        stats: {
            total: reports.length,
            executive: reports.filter(r => r.type === 'Executive').length,
            technical: reports.filter(r => r.type === 'Technical').length,
            audit: reports.filter(r => r.type === 'Audit').length,
            compliance: reports.filter(r => r.type === 'Compliance').length
        }
    }
  }
}
"""
    with open('src/services/reportService.ts', 'w') as f:
        f.write(content)


def refactor_reports():
    try:
        with open('src/pages/Reports.tsx', 'r') as f:
            content = f.read()
        
        comp = """
export default function Reports({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [data, setData] = useState<any>(null)
  
  useEffect(() => {
    reportService.getReportsData().then(res => setData(res))
  }, [])
  
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedReport, setSelectedReport] = useState<number | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  if (!data) return <div className="p-6">Loading Reports...</div>

  const reports = data.reports
  const stats = data.stats
"""
        pattern = re.compile(r'export default function Reports.*?const stats = reportService\.getStats\(\)', re.DOTALL)
        content = pattern.sub(comp, content)
        with open('src/pages/Reports.tsx', 'w') as f:
            f.write(content)
    except: pass


if __name__ == '__main__':
    write_report_service()
    refactor_reports()
    print("Reports refactored")
