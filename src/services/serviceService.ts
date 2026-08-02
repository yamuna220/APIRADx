import { Service, DependencyEdge } from '../types'
import servicesData from '../data/services.json'
import dependenciesData from '../data/dependencies.json'
import { dependencyApi } from './dependencyApi'

// Async service for service nodes and dependencies with fallback to mock
export const serviceService = {
  getAllServices: async (): Promise<Service[]> => {
    // Return mock data for now (backend provides this via dependency API but needs specId)
    return servicesData as Service[]
  },

  getServiceById: async (id: string): Promise<Service | undefined> => {
    const services = servicesData as Service[]
    return services.find(service => service.id === id)
  },

  getServicesByType: async (type: string): Promise<Service[]> => {
    const services = servicesData as Service[]
    return services.filter(service => service.type === type)
  },

  getServicesByRisk: async (risk: string): Promise<Service[]> => {
    const services = servicesData as Service[]
    return services.filter(service => service.risk === risk)
  },

  getAllDependencies: async (): Promise<DependencyEdge[]> => {
    // Return mock data for now (backend provides this via dependency API but needs specId)
    return dependenciesData as DependencyEdge[]
  },

  getDependenciesForService: async (serviceId: string): Promise<DependencyEdge[]> => {
    const deps = dependenciesData as DependencyEdge[]
    return deps.filter(dep => dep.from === serviceId || dep.to === serviceId)
  },

  getIncomingDependencies: async (serviceId: string): Promise<Service[]> => {
    const deps = dependenciesData as DependencyEdge[]
    const services = servicesData as Service[]
    const incomingIds = deps.filter(dep => dep.to === serviceId).map(dep => dep.from)
    return services.filter(s => incomingIds.includes(s.id))
  },

  getOutgoingDependencies: async (serviceId: string): Promise<Service[]> => {
    const deps = dependenciesData as DependencyEdge[]
    const services = servicesData as Service[]
    const outgoingIds = deps.filter(dep => dep.from === serviceId).map(dep => dep.to)
    return services.filter(s => outgoingIds.includes(s.id))
  },

  getStats: async () => {
    const services = servicesData as Service[]
    const deps = dependenciesData as DependencyEdge[]
    return {
      total: services.length,
      critical: services.filter(s => s.risk === 'Critical').length,
      high: services.filter(s => s.risk === 'High').length,
      medium: services.filter(s => s.risk === 'Medium').length,
      low: services.filter(s => s.risk === 'Low').length,
      healthy: services.filter(s => s.risk === 'Healthy').length,
      external: services.filter(s => s.isExternal).length,
      totalDependencies: deps.length,
      avgHealth: Math.round(services.reduce((sum, s) => sum + s.health, 0) / services.length),
      totalEndpoints: services.reduce((sum, s) => sum + s.endpoints, 0)
    }
  }
}
