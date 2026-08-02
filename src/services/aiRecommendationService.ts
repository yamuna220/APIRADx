import { uploadApi } from './uploadApi'

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
