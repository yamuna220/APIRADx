import { Service, DependencyEdge } from '../types'
import servicesData from '../data/services.json'
import dependenciesData from '../data/dependencies.json'

// Mock service for service nodes and dependencies
export const serviceService = {
  getAllServices: (): Service[] => {
    return servicesData as Service[]
  },

  getServiceById: (id: string): Service | undefined => {
    const services = servicesData as Service[]
    return services.find(service => service.id === id)
  },

  getServicesByType: (type: string): Service[] => {
    const services = servicesData as Service[]
    return services.filter(service => service.type === type)
  },

  getServicesByRisk: (risk: string): Service[] => {
    const services = servicesData as Service[]
    return services.filter(service => service.risk === risk)
  },

  getAllDependencies: (): DependencyEdge[] => {
    return dependenciesData as DependencyEdge[]
  },

  getDependenciesForService: (serviceId: string): DependencyEdge[] => {
    const deps = dependenciesData as DependencyEdge[]
    return deps.filter(dep => dep.from === serviceId || dep.to === serviceId)
  },

  getIncomingDependencies: (serviceId: string): Service[] => {
    const deps = dependenciesData as DependencyEdge[]
    const services = servicesData as Service[]
    const incomingIds = deps.filter(dep => dep.to === serviceId).map(dep => dep.from)
    return services.filter(s => incomingIds.includes(s.id))
  },

  getOutgoingDependencies: (serviceId: string): Service[] => {
    const deps = dependenciesData as DependencyEdge[]
    const services = servicesData as Service[]
    const outgoingIds = deps.filter(dep => dep.from === serviceId).map(dep => dep.to)
    return services.filter(s => outgoingIds.includes(s.id))
  },

  getStats: () => {
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
