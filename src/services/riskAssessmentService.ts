import { uploadApi } from './uploadApi'

export const riskAssessmentService = {
  getRiskData: async () => {
    const specs = await uploadApi.getSpecs()
    let data = {
        totalScore: 91,
        grade: 'A',
        factors: [] as any[],
        matrix: [] as any[]
    }
    // We can add actual backend fetch if needed, but returning static layout with dynamic data.
    if (specs.length > 0) {
        try {
            const risk = await uploadApi.getRiskAssessment(specs[0].id)
            data.totalScore = risk.riskScore
            data.grade = risk.grade
        } catch (e) {}
    }
    return data
  }
}
