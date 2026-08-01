# APIRADx - Enterprise API Security Platform

A comprehensive API security analysis and risk assessment platform with enterprise-grade authentication, real-time vulnerability detection, and automated remediation capabilities.

## Features

- **Enterprise Authentication**: Complete authentication system with email verification, password reset, and session management
- **API Security Analysis**: Parse OpenAPI/Swagger specs automatically and detect OWASP API Security Top 10 risks
- **Risk Assessment**: AI-powered risk scoring and impact prediction
- **Dependency Visualization**: Interactive dependency graphs for API ecosystems
- **Report Generation**: Professional PDF and CSV reports with company branding
- **Audit Logging**: Comprehensive activity tracking for compliance

## Tech Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL with SQLAlchemy 2.0.23
- **Migrations**: Alembic 1.12.1
- **Authentication**: JWT (python-jose) with bcrypt password hashing
- **Email**: FastAPI-Mail 1.4.1 for SMTP email sending
- **Security**: Rate limiting (slowapi), CSRF protection, secure cookies

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4
- **State Management**: React Context API
- **UI Components**: Custom components with modern design

## Prerequisites

- Node.js (v18 or higher)
- Python 3.10 or higher
- PostgreSQL 14 or higher
- pnpm (for frontend dependencies)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Complete current task (1)"
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure environment variables:

```bash
cp backend.env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/apiradx

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=noreply@apiradx.com
SMTP_FROM_NAME=APIRADx
SMTP_TLS=True
SMTP_SSL=False

# Frontend URL
FRONTEND_URL=http://localhost:8443
```

Initialize the database:

```bash
# Create database tables
python -c "from database import engine, Base; Base.metadata.create_all(bind=engine)"
```

Start the backend server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`

### 3. Frontend Setup

Navigate to the project root:

```bash
cd ..
```

Install dependencies:

```bash
pnpm install
```

Configure environment variables:

Create a `.env` file in the root directory:

```env
VITE_API_BASE=http://localhost:8000
```

Start the frontend development server:

```bash
pnpm dev
```

The frontend will be available at `http://localhost:8443`

## Database Migrations (Optional)

If you prefer to use Alembic for database migrations:

```bash
cd backend

# Initialize Alembic (first time only)
alembic init alembic

# Generate migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

## SMTP Configuration

### Gmail SMTP Setup

1. Enable 2-Factor Authentication on your Google Account
2. Go to Google Account > Security > App Passwords
3. Generate a new App Password
4. Use the App Password in your `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_TLS=True
```

### Mailtrap SMTP Setup (Development)

1. Sign up at [Mailtrap](https://mailtrap.io)
2. Create a new inbox
3. Copy the SMTP credentials:

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USERNAME=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
SMTP_TLS=False
```

## API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Authentication Endpoints

### Register
- **POST** `/api/auth/register`
- Creates a new user with email verification
- Sends verification email to user

### Verify Email
- **GET** `/api/auth/verify-email?token=<token>`
- Verifies user email address
- Activates account for login

### Login
- **POST** `/api/auth/login`
- Authenticates user and returns JWT tokens
- Requires email verification

### Logout
- **POST** `/api/auth/logout`
- Revokes refresh tokens
- Clears session

### Refresh Token
- **POST** `/api/auth/refresh`
- Refreshes access token using refresh token
- Implements token rotation

### Forgot Password
- **POST** `/api/auth/forgot-password`
- Sends password reset email
- Prevents email enumeration

### Reset Password
- **POST** `/api/auth/reset-password`
- Resets user password with token
- Validates password strength

### Get Current User
- **GET** `/api/auth/me`
- Returns authenticated user profile

### Update User
- **PUT** `/api/auth/me`
- Updates user profile information

## Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Tokens**: Access tokens (30 min) and refresh tokens (7 days)
- **Email Verification**: Required before login
- **Token Rotation**: Refresh tokens are rotated on each use
- **Rate Limiting**: Implemented using slowapi
- **CSRF Protection**: Enabled for state-changing operations
- **Secure Cookies**: HttpOnly, Secure, SameSite flags
- **Password Strength**: Minimum 8 characters, uppercase, lowercase, number, special character

## Development

### Backend Development

```bash
cd backend
uvicorn main:app --reload
```

### Frontend Development

```bash
pnpm dev
```

### Code Formatting

Backend:
```bash
# No specific formatter configured
```

Frontend:
```bash
pnpm format
```

## Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
pnpm test
```

## Deployment

### Backend Deployment

1. Set environment variables in production
2. Use a production WSGI server (Gunicorn):
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```
3. Configure PostgreSQL for production
4. Enable HTTPS
5. Set strong `SECRET_KEY`

### Frontend Deployment

1. Build the frontend:
```bash
pnpm build
```
2. Deploy the `dist` folder to your hosting service
3. Configure `VITE_API_BASE` to point to production backend

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists: `createdb apiradx`

### Email Not Sending

- Verify SMTP credentials
- Check SMTP port (587 for TLS, 465 for SSL)
- Ensure app password is used for Gmail
- Check firewall settings

### CORS Errors

- Verify `CORS_ORIGINS` in backend config
- Ensure frontend URL is included

## License

Proprietary - All rights reserved

## Support

For support and documentation, contact the APIRADx team.
