import { AIRecommendation, AIMessage } from '../types'
import aiRecsData from '../data/ai-recommendations.json'

// Async service for AI recommendations with fallback to mock
export const aiRecommendationService = {
  getAllRecommendations: async (): Promise<AIRecommendation[]> => {
    // Return mock data for now (backend provides this via AI recommendations API but needs specId)
    return aiRecsData as AIRecommendation[]
  },

  getRecommendationsBySeverity: async (severity: string): Promise<AIRecommendation[]> => {
    const recs = aiRecsData as AIRecommendation[]
    return recs.filter(r => r.severity === severity)
  },

  getRecommendationsByPriority: async (priority: string): Promise<AIRecommendation[]> => {
    const recs = aiRecsData as AIRecommendation[]
    return recs.filter(r => r.priority === priority)
  },

  getStats: async () => {
    const recs = aiRecsData as AIRecommendation[]
    return {
      total: recs.length,
      critical: recs.filter(r => r.severity === 'Critical').length,
      high: recs.filter(r => r.severity === 'High').length,
      medium: recs.filter(r => r.severity === 'Medium').length,
      p0: recs.filter(r => r.priority === 'P0').length,
      p1: recs.filter(r => r.priority === 'P1').length
    }
  },

  // Mock AI chat responses
  getInitialMessages: async (): Promise<AIMessage[]> => {
    return [
      { 
        id: 1, 
        role: 'assistant', 
        content: "Hello! I'm your API Security AI assistant. I can analyze vulnerabilities, suggest remediations, and generate secure code. What would you like to explore?" 
      },
      { 
        id: 2, 
        role: 'user', 
        content: 'Explain the broken authentication issue on /api/v2/users/auth' 
      },
      {
        id: 3,
        role: 'assistant',
        content: `The **broken authentication** vulnerability on \`/api/v2/users/auth\` is classified as OWASP API2:2023. Here's the breakdown:\n\n**Root cause**: No rate limiting allows unlimited login attempts. Missing account lockout and CAPTCHA create a perfect brute-force target.\n\n**Risks**:\n- Brute-force attacks on user passwords\n- Credential stuffing using leaked lists\n- No token expiration on password reset (72hr window)\n\n**Impact**: CVSS 8.8 — all 284,000 user accounts at risk.\n\n**Estimated risk reduction**: 71% if fix applied.`,
        code: `// Rate limiter middleware (Express/Node.js)\nimport rateLimit from 'express-rate-limit';\nimport RedisStore from 'rate-limit-redis';\n\nconst authLimiter = rateLimit({\n  windowMs: 60 * 1000,      // 1 minute\n  max: 5,                    // max 5 attempts\n  standardHeaders: true,\n  store: new RedisStore({\n    sendCommand: (...args) => redisClient.sendCommand(args),\n  }),\n  handler: (req, res) => {\n    res.status(429).json({\n      error: 'Too many attempts. Retry in 60s.',\n      retryAfter: 60,\n    });\n  },\n});\n\napp.post('/api/v2/users/auth', authLimiter, authController);`
      }
    ]
  },

  getCannedResponse: async (query: string): Promise<{ content: string; code?: string }> => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('jwt')) {
      return {
        content: "Here's a production-ready JWT validation middleware covering the most common vulnerabilities — signature verification, expiry, issuer, and scope checks:",
        code: `import jwt from 'jsonwebtoken';\nimport { Request, Response, NextFunction } from 'express';\n\ninterface JWTPayload {\n  sub: string;\n  scope: string[];\n  iat: number;\n  exp: number;\n}\n\nexport const validateJWT = (scope?: string) =>\n  (req: Request, res: Response, next: NextFunction) => {\n    const auth = req.headers.authorization;\n    if (!auth?.startsWith('Bearer ')) {\n      return res.status(401).json({ error: 'Missing Bearer token' });\n    }\n\n    try {\n      const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET!, {\n        algorithms: ['RS256'],\n        issuer: 'https://auth.yourapi.com',\n        audience: 'api.yourapi.com',\n        clockTolerance: 10,\n      }) as JWTPayload;\n\n      if (scope && !payload.scope.includes(scope)) {\n        return res.status(403).json({ error: 'Insufficient scope' });\n      }\n      req.user = payload;\n      next();\n    } catch (err) {\n      return res.status(401).json({ error: 'Invalid or expired token' });\n    }\n  };`
      }
    }
    
    return {
      content: "Based on your API inventory analysis, here are the highest-priority security actions:\n\n**Critical (P0)**:\n- Broken authentication on /auth endpoint — CVSS 8.8\n- Unauthenticated analytics export — CVSS 7.5\n\n**Recommended next steps**:\n1. Deploy rate limiting middleware immediately\n2. Add JWT validation to export routes\n3. Migrate API keys from query params to headers\n\nWant me to generate remediation code for any of these?"
    }
  },

  getThinkingPhrases: async (): Promise<string[]> => {
    return ['Analyzing API schema...', 'Cross-referencing OWASP guidelines...', 'Generating secure code...', 'Reviewing vulnerability context...']
  },

  getSuggestions: async (): Promise<string[]> => {
    return [
      'Fix the unauthenticated export endpoint',
      'Generate JWT validation middleware',
      'Explain OWASP API1:2023',
      'Rate limiting best practices'
    ]
  }
}
