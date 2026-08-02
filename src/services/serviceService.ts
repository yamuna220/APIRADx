import { uploadApi } from './uploadApi'

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
