// Mock AI Provider for vulnerability recommendations
import { AIProvider, VulnerabilityContext, AIRecommendation, CodeExample, RecommendationPriority } from '../types/ai'

export class MockAIProvider implements AIProvider {
  name = 'Mock AI Provider'

  isAvailable(): boolean {
    return true
  }

  async generateRecommendation(vulnerability: VulnerabilityContext): Promise<AIRecommendation> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const recommendation = this.getMockRecommendation(vulnerability)
    return recommendation
  }

  private getMockRecommendation(vulnerability: VulnerabilityContext): AIRecommendation {
    const { title, severity, owaspCategory, affectedEndpoint } = vulnerability

    // Return different mock responses based on vulnerability type
    if (title.includes('Authentication') || owaspCategory.includes('Authentication')) {
      return this.getAuthenticationRecommendation(vulnerability)
    }

    if (title.includes('Authorization') || owaspCategory.includes('Authorization')) {
      return this.getAuthorizationRecommendation(vulnerability)
    }

    if (title.includes('Data') || owaspCategory.includes('Data')) {
      return this.getDataExposureRecommendation(vulnerability)
    }

    if (title.includes('HTTP') || title.includes('HTTPS')) {
      return this.getHTTPSRecommendation(vulnerability)
    }

    if (title.includes('Input') || owaspCategory.includes('Injection')) {
      return this.getInputValidationRecommendation(vulnerability)
    }

    if (title.includes('CORS')) {
      return this.getCORSRecommendation(vulnerability)
    }

    // Default recommendation
    return this.getDefaultRecommendation(vulnerability)
  }

  private getAuthenticationRecommendation(vulnerability: VulnerabilityContext): AIRecommendation {
    return {
      explanation: 'This endpoint lacks proper authentication mechanisms, allowing unauthorized access to sensitive operations. The vulnerability occurs because the API does not require valid credentials or tokens to access protected resources.',
      businessImpact: 'Unauthorized users can access sensitive data and perform privileged operations, leading to data breaches, privacy violations, and potential regulatory fines (GDPR, CCPA). This can result in reputational damage and loss of customer trust.',
      fix: 'Implement OAuth 2.0 with JWT tokens or API key authentication. Add authentication middleware to verify credentials before processing requests. Use secure token storage and implement token expiration and refresh mechanisms.',
      estimatedTime: '2-4 hours',
      codeExample: {
        language: 'typescript',
        before: `// Vulnerable code - no authentication
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id
  const user = database.getUser(userId)
  res.json(user)
})`,
        after: `// Secure code - JWT authentication
import { authenticateToken } from './auth'

app.get('/api/users/:id', authenticateToken, (req, res) => {
  const userId = req.params.id
  const user = database.getUser(userId)
  res.json(user)
})

// auth.ts
export function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}`,
        description: 'Add JWT authentication middleware to protect the endpoint'
      },
      priority: this.determinePriority(vulnerability.severity),
      references: [
        'https://owasp.org/www-project-api-security/',
        'https://oauth.net/2/',
        'https://jwt.io/'
      ],
      confidence: 0.92
    }
  }

  private getAuthorizationRecommendation(vulnerability: VulnerabilityContext): AIRecommendation {
    return {
      explanation: 'The endpoint has broken object-level authorization, allowing users to access resources they should not have permission to access. This occurs when the application does not properly verify that the authenticated user has the right to access the specific requested object.',
      businessImpact: 'Users can access or modify other users\' data, leading to privacy violations, data breaches, and potential legal consequences. This is a critical security flaw that can result in significant financial and reputational damage.',
      fix: 'Implement proper object-level authorization checks. Verify that the authenticated user has the necessary permissions to access the specific resource. Use role-based access control (RBAC) and attribute-based access control (ABAC) patterns.',
      estimatedTime: '4-6 hours',
      codeExample: {
        language: 'typescript',
        before: `// Vulnerable code - no authorization check
app.get('/api/users/:id', authenticateToken, (req, res) => {
  const userId = req.params.id
  const user = database.getUser(userId)
  res.json(user)
})`,
        after: `// Secure code - authorization check
app.get('/api/users/:id', authenticateToken, (req, res) => {
  const requestedUserId = req.params.id
  const authenticatedUserId = req.user.id
  
  // Authorization check
  if (requestedUserId !== authenticatedUserId && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied' })
  }
  
  const user = database.getUser(requestedUserId)
  res.json(user)
})`,
        description: 'Add authorization check to ensure users can only access their own data'
      },
      priority: this.determinePriority(vulnerability.severity),
      references: [
        'https://owasp.org/www-project-api-security/',
        'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html'
      ],
      confidence: 0.88
    }
  }

  private getDataExposureRecommendation(vulnerability: VulnerabilityContext): AIRecommendation {
    return {
      explanation: 'The API endpoint exposes sensitive data in its responses, including fields like passwords, SSNs, or tokens. This sensitive information can be intercepted by attackers or logged inappropriately, leading to data breaches.',
      businessImpact: 'Exposure of sensitive customer data can lead to identity theft, financial fraud, and regulatory penalties. This violates data protection regulations and can result in severe fines and legal consequences.',
      fix: 'Remove sensitive fields from API responses. Implement data filtering to only return necessary information. Use data transfer objects (DTOs) to control what data is exposed. Encrypt sensitive data at rest and in transit.',
      estimatedTime: '1-3 hours',
      codeExample: {
        language: 'typescript',
        before: `// Vulnerable code - exposes sensitive data
app.get('/api/users/:id', (req, res) => {
  const user = database.getUser(req.params.id)
  res.json(user) // Returns all fields including password
})`,
        after: `// Secure code - filters sensitive data
app.get('/api/users/:id', (req, res) => {
  const user = database.getUser(req.params.id)
  
  // Create safe user object without sensitive fields
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
    // Password and other sensitive fields excluded
  }
  
  res.json(safeUser)
})`,
        description: 'Filter out sensitive fields from API responses'
      },
      priority: this.determinePriority(vulnerability.severity),
      references: [
        'https://owasp.org/www-project-api-security/',
        'https://cheatsheetseries.owasp.org/cheatsheets/Data_Validation_Cheat_Sheet.html'
      ],
      confidence: 0.85
    }
  }

  private getHTTPSRecommendation(vulnerability: VulnerabilityContext): AIRecommendation {
    return {
      explanation: 'The API server is configured to use HTTP instead of HTTPS, allowing data to be transmitted in plaintext. This enables man-in-the-middle attacks where attackers can intercept and modify sensitive data.',
      businessImpact: 'Attackers can intercept credentials, session tokens, and sensitive data transmitted between clients and the server. This can lead to account takeover, data theft, and session hijacking.',
      fix: 'Configure the server to use HTTPS with a valid TLS certificate. Implement HTTP to HTTPS redirects. Use strong TLS configurations (TLS 1.2 or higher). Enable HSTS headers to enforce HTTPS connections.',
      estimatedTime: '1-2 hours',
      codeExample: {
        language: 'typescript',
        before: `// Vulnerable configuration
const server = http.createServer(app)
server.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})`,
        after: `// Secure configuration
import https from 'https'
import fs from 'fs'

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
}

const server = https.createServer(options, app)
server.listen(443, () => {
  console.log('Server running on https://localhost:443')
})

// Redirect HTTP to HTTPS
http.createServer((req, res) => {
  res.writeHead(301, { Location: \`https://\${req.headers.host}\${req.url}\` })
  res.end()
}).listen(80)`,
        description: 'Configure HTTPS with TLS certificate and redirect HTTP to HTTPS'
      },
      priority: this.determinePriority(vulnerability.severity),
      references: [
        'https://owasp.org/www-project-api-security/',
        'https://cheatsheetseries.owasp.org/cheatsheets/TLS_Cheat_Sheet.html'
      ],
      confidence: 0.95
    }
  }

  private getInputValidationRecommendation(vulnerability: VulnerabilityContext): AIRecommendation {
    return {
      explanation: 'The endpoint lacks proper input validation on request body parameters, making it vulnerable to injection attacks such as SQL injection, NoSQL injection, or command injection. Attackers can manipulate input to execute malicious code or access unauthorized data.',
      businessImpact: 'Injection attacks can lead to data breaches, data corruption, unauthorized system access, and complete system compromise. This is one of the most critical web application vulnerabilities.',
      fix: 'Implement strict input validation using schema validation libraries. Use parameterized queries for database operations. Sanitize and validate all user inputs. Implement allow-list validation instead of block-list.',
      estimatedTime: '2-4 hours',
      codeExample: {
        language: 'typescript',
        before: `// Vulnerable code - no input validation
app.post('/api/users', (req, res) => {
  const { name, email } = req.body
  const query = \`INSERT INTO users (name, email) VALUES ('\${name}', '\${email}')\`
  database.execute(query)
  res.json({ success: true })
})`,
        after: `// Secure code - input validation and parameterized queries
import Joi from 'joi'

const userSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required()
})

app.post('/api/users', (req, res) => {
  // Validate input
  const { error, value } = userSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }
  
  // Use parameterized query
  const query = 'INSERT INTO users (name, email) VALUES (?, ?)'
  database.execute(query, [value.name, value.email])
  
  res.json({ success: true })
})`,
        description: 'Add input validation schema and use parameterized queries'
      },
      priority: this.determinePriority(vulnerability.severity),
      references: [
        'https://owasp.org/www-project-api-security/',
        'https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html'
      ],
      confidence: 0.90
    }
  }

  private getCORSRecommendation(vulnerability: VulnerabilityContext): AIRecommendation {
    return {
      explanation: 'The API has overly permissive CORS configuration using wildcard origins, allowing any website to make requests to your API. This can enable cross-site request forgery (CSRF) attacks and data exfiltration.',
      businessImpact: 'Malicious websites can make unauthorized requests to your API on behalf of authenticated users, potentially leading to data theft, unauthorized actions, and session hijacking.',
      fix: 'Restrict CORS to specific trusted origins only. Implement proper CORS headers with specific allowed origins, methods, and headers. Use credentials mode only when necessary and with trusted origins.',
      estimatedTime: '30 minutes - 1 hour',
      codeExample: {
        language: 'typescript',
        before: `// Vulnerable CORS configuration
app.use(cors({
  origin: '*', // Wildcard allows any origin
  credentials: true
}))`,
        after: `// Secure CORS configuration
const allowedOrigins = [
  'https://yourdomain.com',
  'https://app.yourdomain.com'
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))`,
        description: 'Restrict CORS to specific trusted origins'
      },
      priority: this.determinePriority(vulnerability.severity),
      references: [
        'https://owasp.org/www-project-api-security/',
        'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS'
      ],
      confidence: 0.87
    }
  }

  private getDefaultRecommendation(vulnerability: VulnerabilityContext): AIRecommendation {
    return {
      explanation: `The vulnerability "${vulnerability.title}" in endpoint ${vulnerability.affectedEndpoint} represents a security risk that should be addressed. The issue falls under ${vulnerability.owaspCategory} and has been classified as ${vulnerability.severity} severity.`,
      businessImpact: 'This vulnerability could lead to security breaches, data exposure, or unauthorized access depending on its nature and exploitation potential. Addressing it promptly is recommended to maintain security posture.',
      fix: 'Review the specific vulnerability details and implement appropriate security controls. Follow OWASP guidelines and security best practices. Test the fix thoroughly before deployment.',
      estimatedTime: '1-4 hours',
      codeExample: {
        language: 'typescript',
        before: `// Review the vulnerable code pattern
// Specific implementation depends on vulnerability type`,
        after: `// Implement security controls based on vulnerability type
// Follow OWASP guidelines and security best practices`,
        description: 'Code example depends on specific vulnerability type'
      },
      priority: this.determinePriority(vulnerability.severity),
      references: [
        'https://owasp.org/www-project-api-security/',
        'https://cheatsheetseries.owasp.org/'
      ],
      confidence: 0.75
    }
  }

  private determinePriority(severity: string): RecommendationPriority {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'Critical'
      case 'high':
        return 'High'
      case 'medium':
        return 'Medium'
      case 'low':
      case 'info':
        return 'Low'
      default:
        return 'Medium'
    }
  }
}
