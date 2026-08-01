import { createContext, useContext, useState, ReactNode } from 'react'
import { LegacyParsedAPISpec } from '../utils/openapiParser'
import { SecurityAnalysisResult } from '../types/security'
import { DependencyGraph } from '../types/dependency'
import { ImpactPrediction } from '../types/impact'

interface UploadContextType {
  uploadedSpecs: LegacyParsedAPISpec[]
  addUploadedSpec: (spec: LegacyParsedAPISpec) => void
  removeUploadedSpec: (id: string) => void
  getTotalEndpoints: () => number
  getTotalRisks: () => number
  securityResults: Record<string, SecurityAnalysisResult>
  setSecurityResult: (specId: string, result: SecurityAnalysisResult) => void
  getSecurityResult: (specId: string) => SecurityAnalysisResult | undefined
  dependencyGraphs: Record<string, DependencyGraph>
  setDependencyGraph: (specId: string, graph: DependencyGraph) => void
  getDependencyGraph: (specId: string) => DependencyGraph | undefined
  impactPredictions: Record<string, ImpactPrediction>
  setImpactPrediction: (specId: string, prediction: ImpactPrediction) => void
  getImpactPrediction: (specId: string) => ImpactPrediction | undefined
}

const UploadContext = createContext<UploadContextType | undefined>(undefined)

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploadedSpecs, setUploadedSpecs] = useState<LegacyParsedAPISpec[]>([])
  const [securityResults, setSecurityResults] = useState<Record<string, SecurityAnalysisResult>>({})
  const [dependencyGraphs, setDependencyGraphs] = useState<Record<string, DependencyGraph>>({})
  const [impactPredictions, setImpactPredictions] = useState<Record<string, ImpactPrediction>>({})

  const addUploadedSpec = (spec: LegacyParsedAPISpec) => {
    setUploadedSpecs(prev => [spec, ...prev])
  }

  const removeUploadedSpec = (id: string) => {
    setUploadedSpecs(prev => prev.filter(spec => spec.id !== id))
    setSecurityResults(prev => {
      const newResults = { ...prev }
      delete newResults[id]
      return newResults
    })
    setDependencyGraphs(prev => {
      const newGraphs = { ...prev }
      delete newGraphs[id]
      return newGraphs
    })
    setImpactPredictions(prev => {
      const newPredictions = { ...prev }
      delete newPredictions[id]
      return newPredictions
    })
  }

  const setSecurityResult = (specId: string, result: SecurityAnalysisResult) => {
    setSecurityResults(prev => ({ ...prev, [specId]: result }))
  }

  const getSecurityResult = (specId: string) => {
    return securityResults[specId]
  }

  const setDependencyGraph = (specId: string, graph: DependencyGraph) => {
    setDependencyGraphs(prev => ({ ...prev, [specId]: graph }))
  }

  const getDependencyGraph = (specId: string) => {
    return dependencyGraphs[specId]
  }

  const setImpactPrediction = (specId: string, prediction: ImpactPrediction) => {
    setImpactPredictions(prev => ({ ...prev, [specId]: prediction }))
  }

  const getImpactPrediction = (specId: string) => {
    return impactPredictions[specId]
  }

  const getTotalEndpoints = () => {
    return uploadedSpecs.reduce((sum, spec) => sum + spec.endpoints, 0)
  }

  const getTotalRisks = () => {
    // Calculate risks from security analysis results
    return uploadedSpecs.reduce((sum, spec) => {
      const result = securityResults[spec.id]
      if (result) {
        return sum + result.summary.criticalCount + result.summary.highCount
      }
      // Fallback to legacy calculation
      const riskScore = Math.ceil(spec.endpoints / 10)
      return sum + riskScore
    }, 0)
  }

  return (
    <UploadContext.Provider value={{
      uploadedSpecs,
      addUploadedSpec,
      removeUploadedSpec,
      getTotalEndpoints,
      getTotalRisks,
      securityResults,
      setSecurityResult,
      getSecurityResult,
      dependencyGraphs,
      setDependencyGraph,
      getDependencyGraph,
      impactPredictions,
      setImpactPrediction,
      getImpactPrediction
    }}>
      {children}
    </UploadContext.Provider>
  )
}

export function useUploads() {
  const context = useContext(UploadContext)
  if (context === undefined) {
    throw new Error('useUploads must be used within a UploadProvider')
  }
  return context
}
