# APIRADx Backend

FastAPI backend for API security analysis and risk assessment platform.

## Features

- **Authentication**: JWT-based authentication with user registration and login
- **OpenAPI Upload**: Upload and parse OpenAPI specifications (YAML/JSON)
- **Security Analysis**: OWASP API Security Top 10 based security analysis
- **Dependency Graph**: Generate dependency graphs from API specifications
- **Risk Assessment**: Weighted risk scoring with multiple factors
- **Reports**: Generate downloadable security reports (PDF/CSV)
- **AI Recommendations**: AI-powered remediation recommendations

## Setup

### Prerequisites

- Python 3.9+
- PostgreSQL 12+
- pip

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Create PostgreSQL database:
```sql
CREATE DATABASE apiradx;
```

4. Run the application:
```bash
python main.py
```

Or using uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get access token
- `GET /api/auth/me` - Get current user info

### API Specifications

- `POST /api/specs/upload` - Upload OpenAPI specification
- `GET /api/specs` - Get all uploaded specs (legacy format)
- `GET /api/specs/{spec_id}` - Get specific spec
- `DELETE /api/specs/{spec_id}` - Delete spec

### Security Analysis

- `GET /api/specs/{spec_id}/security` - Get security analysis

### Risk Assessment

- `GET /api/specs/{spec_id}/risk` - Get risk assessment

### Dependency Graph

- `GET /api/specs/{spec_id}/dependency-graph` - Get dependency graph

### AI Recommendations

- `GET /api/specs/{spec_id}/ai-recommendations` - Get AI recommendations

### Reports

- `POST /api/specs/{spec_id}/reports/{report_type}` - Generate report

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics

### Health

- `GET /api/health` - Health check

## Frontend Integration

The backend is designed to match the frontend mock structure for easy integration:

- Legacy upload history format maintained for compatibility
- Response schemas match frontend expectations
- Same field names and data structures as mock services

To switch from mock to API:

1. Update service calls to use API endpoints instead of mock data
2. Add authentication headers with JWT token
3. Update base URL to point to backend server

## Database Models

- **User**: User accounts and authentication
- **APISpec**: Uploaded API specifications
- **SecurityAnalysis**: Security analysis results
- **RiskAssessment**: Risk assessment scores
- **DependencyGraph**: Dependency graph data
- **AIRecommendation**: AI-generated recommendations
- **Report**: Generated reports

## Configuration

Key configuration options in `config.py`:

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `CORS_ORIGINS`: Allowed CORS origins
- `MAX_UPLOAD_SIZE`: Maximum file upload size
- `AI_PROVIDER`: AI provider (mock/openai/anthropic)

## Development

The backend includes mock implementations for:
- Security analysis
- Risk assessment
- Dependency graph generation
- AI recommendations

These can be replaced with real implementations as needed.
