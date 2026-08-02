import { uploadApi } from './uploadApi'

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
