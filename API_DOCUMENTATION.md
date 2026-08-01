# APIRADx API Documentation

This document provides comprehensive documentation for all API endpoints in the APIRADx platform.

## Base URL

```
http://localhost:8000
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Response Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

---

## Authentication Endpoints

### Register User

Creates a new user account and sends a verification email.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "organization": "Acme Corp",
  "password": "SecurePass123!"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "organization": "Acme Corp",
  "role": "member",
  "profile_image": null,
  "email_verified": false,
  "is_active": true,
  "is_superuser": false,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z",
  "last_login": null
}
```

**Error Responses:**
- `400`: Email already registered
- `400`: Username already taken

---

### Verify Email

Verifies a user's email address using a token sent via email.

**Endpoint:** `GET /api/auth/verify-email`

**Query Parameters:**
- `token` (string, required): Verification token from email

**Response:** `200 OK`
```json
{
  "message": "Email verified successfully",
  "email": "user@example.com"
}
```

**Error Responses:**
- `400`: Invalid verification token
- `400`: Verification token has expired
- `404`: User not found

---

### Login

Authenticates a user and returns JWT tokens. Requires email verification.

**Endpoint:** `POST /api/auth/login`

**Request Body:** `application/x-www-form-urlencoded`
```
username=user@example.com&password=SecurePass123!
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**
- `401`: Incorrect email or password
- `403`: Please verify your email before signing in
- `403`: Account is inactive

---

### Logout

Revokes all refresh tokens for the authenticated user.

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### Refresh Token

Refreshes an access token using a refresh token. Implements token rotation.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:** `application/x-www-form-urlencoded`
```
refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**
- `401`: Invalid or expired refresh token
- `403`: Account is inactive

---

### Forgot Password

Initiates password reset by sending a reset email. Prevents email enumeration.

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "If an account exists with this email, a password reset link has been sent"
}
```

**Note:** Always returns success to prevent email enumeration.

---

### Reset Password

Resets a user's password using a token from the reset email.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-123",
  "new_password": "NewSecurePass456!",
  "confirm_password": "NewSecurePass456!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400`: Passwords do not match
- `400`: Password must be at least 8 characters
- `400`: Invalid reset token
- `400`: Reset token has expired
- `404`: User not found

---

### Get Current User

Returns the authenticated user's profile information.

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "organization": "Acme Corp",
  "role": "member",
  "profile_image": null,
  "email_verified": true,
  "is_active": true,
  "is_superuser": false,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z",
  "last_login": "2024-01-15T10:30:00Z"
}
```

---

### Update User Profile

Updates the authenticated user's profile information.

**Endpoint:** `PUT /api/auth/me`

**Authentication:** Required

**Request Body:**
```json
{
  "full_name": "John Updated",
  "organization": "New Org",
  "profile_image": "https://example.com/avatar.jpg"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Updated",
  "organization": "New Org",
  "role": "member",
  "profile_image": "https://example.com/avatar.jpg",
  "email_verified": true,
  "is_active": true,
  "is_superuser": false,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T11:00:00Z",
  "last_login": "2024-01-15T10:30:00Z"
}
```

---

## API Spec Endpoints

### Upload API Spec

Uploads an OpenAPI/Swagger specification file for analysis.

**Endpoint:** `POST /api/specs/upload`

**Authentication:** Required

**Request:** `multipart/form-data`
- `file`: The spec file (YAML, YML, or JSON)
- `name`: Spec name
- `version`: Spec version (optional)
- `description`: Spec description (optional)

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "User API",
  "version": "1.0.0",
  "description": "User management API",
  "file_path": "/uploads/specs/user-api.yaml",
  "uploaded_at": "2024-01-15T10:00:00Z",
  "endpoints_count": 15
}
```

---

### Get All API Specs

Retrieves all API specifications for the authenticated user.

**Endpoint:** `GET /api/specs`

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "User API",
    "version": "1.0.0",
    "description": "User management API",
    "file_path": "/uploads/specs/user-api.yaml",
    "uploaded_at": "2024-01-15T10:00:00Z",
    "endpoints_count": 15
  }
]
```

---

### Get API Spec by ID

Retrieves a specific API specification.

**Endpoint:** `GET /api/specs/{spec_id}`

**Authentication:** Required

**Path Parameters:**
- `spec_id` (integer): The spec ID

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "User API",
  "version": "1.0.0",
  "description": "User management API",
  "file_path": "/uploads/specs/user-api.yaml",
  "uploaded_at": "2024-01-15T10:00:00Z",
  "endpoints_count": 15,
  "spec_data": { ... }
}
```

---

### Delete API Spec

Deletes an API specification.

**Endpoint:** `DELETE /api/specs/{spec_id}`

**Authentication:** Required

**Path Parameters:**
- `spec_id` (integer): The spec ID

**Response:** `200 OK`
```json
{
  "message": "API spec deleted successfully"
}
```

---

## Security Analysis Endpoints

### Analyze API Spec

Performs security analysis on an API specification.

**Endpoint:** `POST /api/specs/{spec_id}/analyze`

**Authentication:** Required

**Path Parameters:**
- `spec_id` (integer): The spec ID

**Response:** `200 OK`
```json
{
  "analysis_id": 1,
  "spec_id": 1,
  "total_endpoints": 15,
  "critical_issues": 3,
  "high_issues": 5,
  "medium_issues": 7,
  "low_issues": 2,
  "security_score": 72,
  "created_at": "2024-01-15T10:00:00Z",
  "findings": [
    {
      "severity": "critical",
      "category": "Broken Authentication",
      "description": "No rate limiting on login endpoint",
      "endpoint": "/api/auth/login",
      "recommendation": "Implement rate limiting"
    }
  ]
}
```

---

### Get Security Analysis

Retrieves security analysis results.

**Endpoint:** `GET /api/analysis/{analysis_id}`

**Authentication:** Required

**Path Parameters:**
- `analysis_id` (integer): The analysis ID

**Response:** `200 OK`
```json
{
  "analysis_id": 1,
  "spec_id": 1,
  "total_endpoints": 15,
  "critical_issues": 3,
  "high_issues": 5,
  "medium_issues": 7,
  "low_issues": 2,
  "security_score": 72,
  "created_at": "2024-01-15T10:00:00Z",
  "findings": [ ... ]
}
```

---

## Risk Assessment Endpoints

### Assess Risk

Performs risk assessment on an API specification.

**Endpoint:** `POST /api/specs/{spec_id}/risk`

**Authentication:** Required

**Path Parameters:**
- `spec_id` (integer): The spec ID

**Response:** `200 OK`
```json
{
  "assessment_id": 1,
  "spec_id": 1,
  "overall_risk_score": 68,
  "risk_level": "medium",
  "created_at": "2024-01-15T10:00:00Z",
  "categories": {
    "authentication": 75,
    "authorization": 60,
    "data_validation": 70,
    "encryption": 80,
    "rate_limiting": 50
  }
}
```

---

### Get Risk Assessment

Retrieves risk assessment results.

**Endpoint:** `GET /api/risk/{assessment_id}`

**Authentication:** Required

**Path Parameters:**
- `assessment_id` (integer): The assessment ID

**Response:** `200 OK`
```json
{
  "assessment_id": 1,
  "spec_id": 1,
  "overall_risk_score": 68,
  "risk_level": "medium",
  "created_at": "2024-01-15T10:00:00Z",
  "categories": { ... }
}
```

---

## Dependency Graph Endpoints

### Generate Dependency Graph

Generates a dependency graph for API specifications.

**Endpoint:** `POST /api/specs/{spec_id}/dependencies`

**Authentication:** Required

**Path Parameters:**
- `spec_id` (integer): The spec ID

**Response:** `200 OK`
```json
{
  "graph_id": 1,
  "spec_id": 1,
  "nodes": [
    {
      "id": "user-service",
      "type": "service",
      "endpoints": 5
    }
  ],
  "edges": [
    {
      "source": "user-service",
      "target": "auth-service",
      "type": "depends_on"
    }
  ],
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

### Get Dependency Graph

Retrieves a dependency graph.

**Endpoint:** `GET /api/dependencies/{graph_id}`

**Authentication:** Required

**Path Parameters:**
- `graph_id` (integer): The graph ID

**Response:** `200 OK`
```json
{
  "graph_id": 1,
  "spec_id": 1,
  "nodes": [ ... ],
  "edges": [ ... ],
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

## AI Recommendations Endpoints

### Generate AI Recommendations

Generates AI-powered security recommendations.

**Endpoint:** `POST /api/specs/{spec_id}/recommendations`

**Authentication:** Required

**Path Parameters:**
- `spec_id` (integer): The spec ID

**Response:** `200 OK`
```json
{
  "recommendation_id": 1,
  "spec_id": 1,
  "recommendations": [
    {
      "priority": "high",
      "category": "Security",
      "title": "Implement OAuth 2.0",
      "description": "Replace basic auth with OAuth 2.0 for better security",
      "effort": "medium"
    }
  ],
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

### Get AI Recommendations

Retrieves AI recommendations.

**Endpoint:** `GET /api/recommendations/{recommendation_id}`

**Authentication:** Required

**Path Parameters:**
- `recommendation_id` (integer): The recommendation ID

**Response:** `200 OK`
```json
{
  "recommendation_id": 1,
  "spec_id": 1,
  "recommendations": [ ... ],
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

## Report Endpoints

### Generate Report

Generates a security report for an API specification.

**Endpoint:** `POST /api/specs/{spec_id}/report`

**Authentication:** Required

**Path Parameters:**
- `spec_id` (integer): The spec ID

**Request Body:**
```json
{
  "format": "pdf",
  "include_findings": true,
  "include_recommendations": true
}
```

**Response:** `200 OK`
```json
{
  "report_id": 1,
  "spec_id": 1,
  "format": "pdf",
  "file_path": "/reports/api-security-report-1.pdf",
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

### Get Report

Retrieves a report.

**Endpoint:** `GET /api/reports/{report_id}`

**Authentication:** Required

**Path Parameters:**
- `report_id` (integer): The report ID

**Response:** `200 OK`
```json
{
  "report_id": 1,
  "spec_id": 1,
  "format": "pdf",
  "file_path": "/reports/api-security-report-1.pdf",
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

### Download Report

Downloads a report file.

**Endpoint:** `GET /api/reports/{report_id}/download`

**Authentication:** Required

**Path Parameters:**
- `report_id` (integer): The report ID

**Response:** `200 OK`
- Content-Type: application/pdf or text/csv
- Body: File content

---

### Get All Reports

Retrieves all reports for the authenticated user.

**Endpoint:** `GET /api/reports`

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "report_id": 1,
    "spec_id": 1,
    "format": "pdf",
    "file_path": "/reports/api-security-report-1.pdf",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

---

### Delete Report

Deletes a report.

**Endpoint:** `DELETE /api/reports/{report_id}`

**Authentication:** Required

**Path Parameters:**
- `report_id` (integer): The report ID

**Response:** `200 OK`
```json
{
  "message": "Report deleted successfully"
}
```

---

## Dashboard Endpoints

### Get Dashboard Stats

Retrieves dashboard statistics for the authenticated user.

**Endpoint:** `GET /api/dashboard/stats`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "total_apis": 15,
  "critical_issues": 3,
  "security_score": 72,
  "risk_score": 68,
  "score_trend": [70, 72, 71, 72],
  "owasp_distribution": {
    "broken_authentication": 5,
    "broken_object_level_authorization": 3,
    "excessive_data_exposure": 2,
    "lack_of_resources_rate_limiting": 4
  },
  "recent_analysis": [
    {
      "spec_name": "User API",
      "score": 72,
      "analyzed_at": "2024-01-15T10:00:00Z"
    }
  ],
  "vulnerable_apis": [
    {
      "spec_id": 1,
      "name": "User API",
      "critical_count": 3
    }
  ]
}
```

---

### Get Upload History

Retrieves upload history for the authenticated user.

**Endpoint:** `GET /api/dashboard/upload-history`

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "User API",
    "version": "1.0.0",
    "uploaded_at": "2024-01-15T10:00:00Z",
    "status": "analyzed"
  }
]
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common error details:
- "Email already registered"
- "Username already taken"
- "Incorrect email or password"
- "Please verify your email before signing in"
- "Invalid verification token"
- "Verification token has expired"
- "Invalid reset token"
- "Reset token has expired"
- "Passwords do not match"
- "Password must be at least 8 characters"
- "Not authenticated"
- "Could not validate credentials"
- "Spec not found"
- "Analysis not found"

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 10 requests per minute
- **Upload endpoints**: 5 requests per minute
- **Analysis endpoints**: 20 requests per minute
- **General endpoints**: 100 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

When rate limited, the API returns:
```
429 Too Many Requests
```

---

## Security Considerations

1. **Always use HTTPS** in production
2. **Never expose tokens** in client-side code
3. **Implement proper token storage** (httpOnly cookies recommended)
4. **Validate all input** on both client and server
5. **Use refresh tokens** to maintain sessions
6. **Implement logout** to revoke tokens
7. **Monitor for suspicious activity** using audit logs
8. **Keep dependencies updated** for security patches

---

## Interactive Documentation

When the backend is running, access interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These provide:
- Interactive API testing
- Request/response examples
- Schema definitions
- Authentication testing

---

## SDK/Client Libraries

### JavaScript/TypeScript

A TypeScript client library is provided in `src/services/authApi.ts`:

```typescript
import { authApi } from './services/authApi'

// Login
await authApi.login(email, password)

// Get current user
const user = await authApi.getCurrentUser()

// Logout
await authApi.logout()
```

### Python

```python
import requests

# Login
response = requests.post(
    'http://localhost:8000/api/auth/login',
    data={'username': email, 'password': password}
)
tokens = response.json()

# Use token
headers = {'Authorization': f'Bearer {tokens["access_token"]}'}
response = requests.get(
    'http://localhost:8000/api/auth/me',
    headers=headers
)
user = response.json()
```

---

## Webhooks (Future)

Webhooks will be supported for:
- Analysis completion
- Report generation
- Security alerts
- Risk threshold breaches

---

## Changelog

### Version 1.0.0
- Initial API release
- Authentication endpoints
- API spec management
- Security analysis
- Risk assessment
- Dependency graphs
- AI recommendations
- Report generation
- Dashboard statistics

---

## Support

For API support:
- Check the interactive documentation at `/docs`
- Review error messages for guidance
- Contact the APIRADx team for assistance
