import { APIEndpoint } from '../types'
import { uploadApi } from './uploadApi'

export const apiService = {
  getAPIData: async () => {
    const specs = await uploadApi.getSpecs()
    let allEndpoints: APIEndpoint[] = []
    
    for (const spec of specs) {
        try {
            const security = await uploadApi.getSecurityAnalysis(spec.id)
            for (const f of security.findings) {
                if (f.affectedEndpoint) {
                    allEndpoints.push({
                        id: Math.floor(Math.random() * 10000),
                        name: f.affectedEndpoint,
                        endpoint: f.affectedEndpoint,
                        method: f.affectedMethod || 'GET',
                        service: spec.name,
                        auth: 'OAuth2',
                        owner: 'System',
                        status: f.severity === 'Critical' ? 'Deprecated' : 'Active',
                        riskLabel: f.severity,
                        lastScan: spec.uploadedAt
                    })
                }
            }
            if (allEndpoints.length === 0) {
                 allEndpoints.push({
                        id: Math.floor(Math.random() * 10000),
                        name: spec.name,
                        endpoint: '/api',
                        method: 'GET',
                        service: spec.name,
                        auth: 'OAuth2',
                        owner: 'System',
                        status: 'Active',
                        riskLabel: 'Low',
                        lastScan: spec.uploadedAt
                    })
            }
        } catch (e) {}
    }
    return {
        endpoints: allEndpoints,
        stats: {
            total: allEndpoints.length,
            critical: allEndpoints.filter(a => a.riskLabel === 'Critical').length,
            high: allEndpoints.filter(a => a.riskLabel === 'High').length,
            medium: allEndpoints.filter(a => a.riskLabel === 'Medium').length,
            low: allEndpoints.filter(a => a.riskLabel === 'Low').length,
            active: allEndpoints.filter(a => a.status === 'Active').length,
            deprecated: allEndpoints.filter(a => a.status === 'Deprecated').length
        }
    }
  }
}
