// Comprehensive OpenAPI 3.x and Swagger 2.0 type definitions

// ── Common Types ───────────────────────────────────────────────────────

export interface Parameter {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  description?: string
  required?: boolean
  schema?: Schema
  type?: string
  enum?: any[]
}

export interface Schema {
  type?: string
  format?: string
  description?: string
  properties?: Record<string, Schema>
  required?: string[]
  items?: Schema
  enum?: any[]
  $ref?: string
  allOf?: Schema[]
  anyOf?: Schema[]
  oneOf?: Schema[]
}

export interface Response {
  description: string
  content?: Record<string, MediaType>
  schema?: Schema
  headers?: Record<string, Parameter>
}

export interface MediaType {
  schema?: Schema
  example?: any
  examples?: Record<string, Example>
}

export interface Example {
  summary?: string
  description?: string
  value?: any
  externalValue?: string
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect' | 'basic'
  description?: string
  name?: string
  in?: 'header' | 'query'
  scheme?: string
  bearerFormat?: string
  flows?: OAuthFlows
  openIdConnectUrl?: string
}

export interface OAuthFlows {
  implicit?: OAuthFlow
  password?: OAuthFlow
  clientCredentials?: OAuthFlow
  authorizationCode?: OAuthFlow
}

export interface OAuthFlow {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes: Record<string, string>
}

export interface Tag {
  name: string
  description?: string
  externalDocs?: ExternalDocumentation
}

export interface ExternalDocumentation {
  description?: string
  url: string
}

export interface Server {
  url: string
  description?: string
  variables?: Record<string, ServerVariable>
}

export interface ServerVariable {
  enum?: string[]
  default: string
  description?: string
}

// ── OpenAPI 3.x Types ───────────────────────────────────────────────────

export interface OpenAPI3Spec {
  openapi: string
  info: Info
  servers?: Server[]
  paths: Paths
  components?: Components
  security?: SecurityRequirement[]
  tags?: Tag[]
  externalDocs?: ExternalDocumentation
}

export interface Info {
  title: string
  version: string
  description?: string
  termsOfService?: string
  contact?: Contact
  license?: License
}

export interface Contact {
  name?: string
  url?: string
  email?: string
}

export interface License {
  name: string
  url?: string
}

export interface Paths {
  [path: string]: PathItem
}

export interface PathItem {
  summary?: string
  description?: string
  get?: Operation
  put?: Operation
  post?: Operation
  delete?: Operation
  options?: Operation
  head?: Operation
  patch?: Operation
  trace?: Operation
  servers?: Server[]
  parameters?: Parameter[]
}

export interface Operation {
  tags?: string[]
  summary?: string
  description?: string
  operationId?: string
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses: Responses
  deprecated?: boolean
  security?: SecurityRequirement[]
  servers?: Server[]
}

export interface RequestBody {
  description?: string
  content: Record<string, MediaType>
  required?: boolean
}

export interface Responses {
  [code: string]: Response
}

export interface Components {
  schemas?: Record<string, Schema>
  responses?: Record<string, Response>
  parameters?: Record<string, Parameter>
  examples?: Record<string, Example>
  requestBodies?: Record<string, RequestBody>
  headers?: Record<string, Parameter>
  securitySchemes?: Record<string, SecurityScheme>
  links?: Record<string, Link>
  callbacks?: Record<string, Callback>
}

export interface Link {
  operationRef?: string
  operationId?: string
  parameters?: Record<string, any>
  requestBody?: any
  description?: string
  server?: Server
}

export interface Callback {
  [expression: string]: PathItem
}

export interface SecurityRequirement {
  [name: string]: string[]
}

// ── Swagger 2.0 Types ───────────────────────────────────────────────────

export interface Swagger2Spec {
  swagger: string
  info: Info
  host?: string
  basePath?: string
  schemes?: string[]
  consumes?: string[]
  produces?: string[]
  paths: Paths
  definitions?: Record<string, Schema>
  parameters?: Record<string, Parameter>
  responses?: Record<string, Response>
  securityDefinitions?: Record<string, SecurityScheme>
  security?: SecurityRequirement[]
  tags?: Tag[]
  externalDocs?: ExternalDocumentation
}

// ── Parsed Output Types ─────────────────────────────────────────────────

export interface ParsedEndpoint {
  path: string
  method: string
  operationId?: string
  summary?: string
  description?: string
  parameters: Parameter[]
  requestBody?: RequestBody
  responses: Record<string, Response>
  tags: string[]
  deprecated: boolean
  security: SecurityRequirement[]
}

export interface ParsedAPISpec {
  specType: 'openapi3' | 'swagger2'
  version: string
  title: string
  description?: string
  servers: Server[]
  endpoints: ParsedEndpoint[]
  authentication: Record<string, SecurityScheme>
  tags: Tag[]
  externalDocs?: ExternalDocumentation
  raw: any
}

export interface ParseResult {
  success: boolean
  spec?: ParsedAPISpec
  errors: ParseError[]
}

export interface ParseError {
  path: string
  message: string
  severity: 'error' | 'warning'
}
