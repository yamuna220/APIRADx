// Comprehensive OpenAPI 3.x and Swagger 2.0 parser
import * as yaml from 'js-yaml'
import {
  OpenAPI3Spec,
  Swagger2Spec,
  ParsedEndpoint,
  ParsedAPISpec,
  ParseResult,
  ParseError,
  Parameter,
  SecurityScheme,
  Tag,
  Server,
  PathItem,
  Operation
} from '../types/openapi'

// ── Validation ───────────────────────────────────────────────────────

export function validateOpenAPI(content: any): ParseResult {
  const errors: ParseError[] = []

  if (!content) {
    errors.push({ path: '', message: 'File is empty', severity: 'error' })
    return { success: false, errors }
  }

  // Check for OpenAPI or Swagger version
  if (!content.openapi && !content.swagger) {
    errors.push({ path: '', message: 'Missing required field: openapi or swagger', severity: 'error' })
  }

  // Check for info object
  if (!content.info) {
    errors.push({ path: '', message: 'Missing required field: info', severity: 'error' })
  } else {
    if (!content.info.title) {
      errors.push({ path: 'info', message: 'Missing required field: info.title', severity: 'error' })
    }
    if (!content.info.version) {
      errors.push({ path: 'info', message: 'Missing required field: info.version', severity: 'error' })
    }
  }

  // Check for paths
  if (!content.paths || Object.keys(content.paths).length === 0) {
    errors.push({ path: '', message: 'Missing or empty paths field', severity: 'warning' })
  }

  return { success: errors.filter(e => e.severity === 'error').length === 0, errors }
}

// ── Main Parser ─────────────────────────────────────────────────────

export function parseOpenAPI(content: any, filename: string): ParseResult {
  const validation = validateOpenAPI(content)
  
  if (!validation.success) {
    return { success: false, errors: validation.errors }
  }

  try {
    const specType = content.openapi ? 'openapi3' : 'swagger2'
    let spec: ParsedAPISpec

    if (specType === 'openapi3') {
      spec = parseOpenAPI3(content as OpenAPI3Spec)
    } else {
      spec = parseSwagger2(content as Swagger2Spec)
    }

    spec.raw = content
    return { success: true, spec, errors: validation.errors }
  } catch (error) {
    return {
      success: false,
      errors: [
        { path: '', message: error instanceof Error ? error.message : 'Unknown parsing error', severity: 'error' }
      ]
    }
  }
}

// ── OpenAPI 3.x Parser ───────────────────────────────────────────────

function parseOpenAPI3(spec: OpenAPI3Spec): ParsedAPISpec {
  const endpoints: ParsedEndpoint[] = []
  const authentication: Record<string, SecurityScheme> = {}
  const servers: Server[] = spec.servers || []

  // Extract endpoints
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const pathEndpoints = extractEndpointsFromPathItem(path, pathItem as PathItem, spec)
    endpoints.push(...pathEndpoints)
  }

  // Extract authentication schemes
  if (spec.components?.securitySchemes) {
    Object.assign(authentication, spec.components.securitySchemes)
  }

  // Extract servers
  if (!servers.length && spec.servers) {
    servers.push(...spec.servers)
  }

  return {
    specType: 'openapi3',
    version: spec.openapi,
    title: spec.info.title,
    description: spec.info.description,
    servers,
    endpoints,
    authentication,
    tags: spec.tags || [],
    externalDocs: spec.externalDocs,
    raw: spec
  }
}

// ── Swagger 2.0 Parser ───────────────────────────────────────────────

function parseSwagger2(spec: Swagger2Spec): ParsedAPISpec {
  const endpoints: ParsedEndpoint[] = []
  const authentication: Record<string, SecurityScheme> = {}
  const servers: Server[] = []

  // Convert Swagger 2.0 to OpenAPI 3.x format
  const host = spec.host || 'localhost'
  const basePath = spec.basePath || ''
  const schemes = spec.schemes || ['http']
  
  // Create server URLs from Swagger 2.0 format
  schemes.forEach(scheme => {
    servers.push({
      url: `${scheme}://${host}${basePath}`,
      description: `${scheme.toUpperCase()} server`
    })
  })

  // Extract endpoints
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const pathEndpoints = extractEndpointsFromPathItem(path, pathItem as PathItem, spec)
    endpoints.push(...pathEndpoints)
  }

  // Extract authentication schemes
  if (spec.securityDefinitions) {
    Object.assign(authentication, convertSecuritySchemes(spec.securityDefinitions))
  }

  return {
    specType: 'swagger2',
    version: spec.swagger,
    title: spec.info.title,
    description: spec.info.description,
    servers,
    endpoints,
    authentication,
    tags: spec.tags || [],
    externalDocs: spec.externalDocs,
    raw: spec
  }
}

// ── Endpoint Extraction ───────────────────────────────────────────────

function extractEndpointsFromPathItem(
  path: string,
  pathItem: PathItem,
  spec: any
): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = []
  const httpMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']

  // Path-level parameters
  const pathParameters = pathItem.parameters || []

  for (const method of httpMethods) {
    const operation = pathItem[method as keyof PathItem] as Operation
    if (!operation) continue

    const parameters = extractParameters(
      [...pathParameters, ...(operation.parameters || [])],
      spec
    )

    const requestBody = operation.requestBody
    const responses = operation.responses || {}
    const tags = operation.tags || []
    const deprecated = operation.deprecated || false
    const security = operation.security || []

    endpoints.push({
      path,
      method: method.toUpperCase(),
      operationId: operation.operationId,
      summary: operation.summary,
      description: operation.description,
      parameters,
      requestBody,
      responses,
      tags,
      deprecated,
      security
    })
  }

  return endpoints
}

// ── Parameter Extraction ────────────────────────────────────────────

function extractParameters(parameters: any[], spec: any): Parameter[] {
  const extracted: Parameter[] = []

  for (const param of parameters) {
    // Handle $ref parameters
    if (param.$ref) {
      const ref = resolveRef(param.$ref, spec)
      if (ref) {
        extracted.push(ref as Parameter)
      }
      continue
    }

    extracted.push({
      name: param.name,
      in: param.in,
      description: param.description,
      required: param.required || false,
      schema: param.schema,
      type: param.type,
      enum: param.enum
    })
  }

  return extracted
}

// ── Security Scheme Conversion ───────────────────────────────────────

function convertSecuritySchemes(swaggerSchemes: Record<string, any>): Record<string, SecurityScheme> {
  const converted: Record<string, SecurityScheme> = {}

  for (const [key, scheme] of Object.entries(swaggerSchemes)) {
    const securityScheme: SecurityScheme = {
      type: scheme.type,
      description: scheme.description
    }

    if (scheme.type === 'apiKey') {
      securityScheme.name = scheme.name
      securityScheme.in = scheme.in
    } else if (scheme.type === 'basic') {
      securityScheme.scheme = 'basic'
    } else if (scheme.type === 'oauth2') {
      securityScheme.flows = {
        implicit: {
          authorizationUrl: scheme.authorizationUrl,
          scopes: scheme.scopes || {}
        }
      }
    }

    converted[key] = securityScheme
  }

  return converted
}

// ── Reference Resolution ─────────────────────────────────────────────

function resolveRef(ref: string, spec: any): any {
  const parts = ref.split('/')
  let current: any = spec

  for (const part of parts) {
    if (part === '#') continue
    if (current[part] === undefined) return null
    current = current[part]
  }

  return current
}

// ── File Parsing ─────────────────────────────────────────────────────

export function parseFile(content: string, filename: string): ParseResult {
  try {
    let parsed: any

    if (filename.endsWith('.json')) {
      parsed = JSON.parse(content)
    } else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      parsed = yaml.load(content)
    } else {
      // Try JSON first, then YAML
      try {
        parsed = JSON.parse(content)
      } catch {
        parsed = yaml.load(content)
      }
    }

    return parseOpenAPI(parsed, filename)
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          path: '',
          message: error instanceof Error ? error.message : 'Failed to parse file',
          severity: 'error'
        }
      ]
    }
  }
}

// ── Upload Simulation ───────────────────────────────────────────────

export function simulateUpload(
  file: File,
  onProgress: (progress: number) => void,
  onComplete: (result: ParseResult) => void,
  onError: (error: string) => void
) {
  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string

      // Simulate parsing progress
      let progress = 20
      const parseInterval = setInterval(() => {
        progress += 15
        onProgress(Math.min(progress, 90))
        
        if (progress >= 90) {
          clearInterval(parseInterval)
          
          const result = parseFile(content, file.name)
          
          setTimeout(() => {
            onProgress(100)
            onComplete(result)
          }, 200)
        }
      }, 100)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to parse file')
    }
  }

  reader.onerror = () => {
    onError('Failed to read file')
  }

  reader.readAsText(file)
}

// ── Utility Functions ───────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Legacy interface for backward compatibility
export interface LegacyParsedAPISpec {
  id: string
  name: string
  version: string
  endpoints: number
  methods: string[]
  schemas: string[]
  authentication: string[]
  tags: string[]
  parsed: any
  uploadedAt: string
  fileSize: string
  status: 'success' | 'error'
  errors?: string[]
  size: string
  risks: number
}

export function toLegacySpec(result: ParseResult, filename: string, fileSize?: string): LegacyParsedAPISpec {
  if (!result.success || !result.spec) {
    return {
      id: Date.now().toString(),
      name: filename,
      version: 'unknown',
      endpoints: 0,
      methods: [],
      schemas: [],
      authentication: [],
      tags: [],
      parsed: {},
      uploadedAt: new Date().toISOString(),
      fileSize: fileSize || '0 KB',
      size: fileSize || '0 KB',
      status: 'error',
      errors: result.errors.map(e => e.message),
      risks: 0
    }
  }

  const methods = new Set<string>()
  result.spec.endpoints.forEach(ep => methods.add(ep.method))

  const authNames = Object.keys(result.spec.authentication)
  const tagNames = result.spec.tags.map(t => t.name)

  return {
    id: Date.now().toString(),
    name: result.spec.title,
    version: result.spec.version,
    endpoints: result.spec.endpoints.length,
    methods: Array.from(methods),
    schemas: [], // Would need schema extraction
    authentication: authNames,
    tags: tagNames,
    parsed: result.spec.raw,
    uploadedAt: new Date().toISOString(),
    fileSize: fileSize || '0 KB',
    size: fileSize || '0 KB',
    status: 'success',
    risks: Math.ceil(result.spec.endpoints.length / 10)
  }
}
