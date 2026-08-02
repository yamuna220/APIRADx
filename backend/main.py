from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import timedelta, datetime
import os
import uuid

from database import get_db, engine, Base
from models import User, APISpec, SecurityAnalysis, RiskAssessment, DependencyGraph, AIRecommendation, Report, VerificationToken, PasswordResetToken, AuditLog
from schemas import (
    UserCreate, UserResponse, UserUpdate, Token, APISpecUploadResponse, SecurityAnalysisResponse,
    RiskScoreResponse, DependencyGraphResponse, AIRecommendationResponse, ReportResponse,
    LegacyUploadHistory, DashboardStats, ForgotPasswordRequest, ResetPasswordRequest
)
from auth import (
    get_password_hash, authenticate_user, create_access_token, get_current_active_user,
    get_current_user, create_refresh_token, verify_refresh_token, revoke_refresh_token,
    generate_verification_token, generate_password_reset_token
)
from config import settings
from utils import (
    parse_openapi_spec, count_endpoints, format_file_size, time_ago,
    analyze_security_mock, assess_risk_mock, generate_dependency_graph_mock, generate_ai_recommendation_mock
)
from email_service import send_verification_email, send_password_reset_email

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API Security Analysis and Risk Assessment Platform"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Authentication Endpoints ───────────────────────────────────────────

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user with email verification."""
    # Check if user exists
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user with email_verified = False
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        organization=user.organization,
        hashed_password=hashed_password,
        email_verified=False,
        role="member"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Generate verification token
    verification_token = generate_verification_token()
    expires_at = datetime.utcnow() + timedelta(hours=settings.VERIFICATION_TOKEN_EXPIRE_HOURS)
    
    db_verification = VerificationToken(
        user_id=db_user.id,
        token=verification_token,
        expires_at=expires_at
    )
    db.add(db_verification)
    db.commit()
    
    # Send verification email
    try:
        await send_verification_email(
            recipient_email=db_user.email,
            recipient_name=db_user.full_name or db_user.username,
            verification_token=verification_token
        )
    except Exception as e:
        # Log error but don't fail registration
        print(f"Failed to send verification email: {e}")
    
    return db_user


@app.get("/api/auth/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify user email with token."""
    verification = db.query(VerificationToken).filter(VerificationToken.token == token).first()
    
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    if verification.is_expired():
        db.delete(verification)
        db.commit()
        raise HTTPException(status_code=400, detail="Verification token has expired")
    
    # Activate user
    user = db.query(User).filter(User.id == verification.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.email_verified = True
    db.delete(verification)
    db.commit()
    
    return {"message": "Email verified successfully", "email": user.email}


@app.post("/api/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login and get access token. Requires email verification."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before signing in"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Create refresh token
    refresh_token = create_refresh_token(user.id, db)
    
    # Log audit
    audit = AuditLog(
        user_id=user.id,
        action="login",
        details={"method": "password"}
    )
    db.add(audit)
    db.commit()
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@app.post("/api/auth/logout")
def logout(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Logout user by revoking refresh tokens."""
    # Revoke all refresh tokens for this user
    db.query(RefreshToken).filter(RefreshToken.user_id == current_user.id).update({"revoked_at": datetime.utcnow()})
    
    # Log audit
    audit = AuditLog(
        user_id=current_user.id,
        action="logout",
        details={}
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Logged out successfully"}


@app.post("/api/auth/refresh", response_model=Token)
def refresh_token(refresh_token: str = Form(...), db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    user = verify_refresh_token(refresh_token, db)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Create new refresh token (rotate tokens)
    new_refresh_token = create_refresh_token(user.id, db)
    
    return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}


@app.post("/api/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request password reset email."""
    user = db.query(User).filter(User.email == request.email).first()
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If an account exists with this email, a password reset link has been sent"}
    
    # Generate reset token
    reset_token = generate_password_reset_token()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    
    db_reset = PasswordResetToken(
        user_id=user.id,
        token=reset_token,
        expires_at=expires_at
    )
    db.add(db_reset)
    db.commit()
    
    # Send password reset email
    try:
        await send_password_reset_email(
            recipient_email=user.email,
            recipient_name=user.full_name or user.username,
            reset_token=reset_token
        )
    except Exception as e:
        print(f"Failed to send password reset email: {e}")
    
    return {"message": "If an account exists with this email, a password reset link has been sent"}


@app.post("/api/auth/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using token."""
    # Validate passwords match
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    # Validate password strength
    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    # Find reset token
    reset = db.query(PasswordResetToken).filter(PasswordResetToken.token == request.token).first()
    
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    if reset.is_expired():
        db.delete(reset)
        db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Get user
    user = db.query(User).filter(User.id == reset.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    db.delete(reset)
    
    # Log audit
    audit = AuditLog(
        user_id=user.id,
        action="password_reset",
        details={}
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Password reset successfully"}


@app.get("/api/auth/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user info."""
    return current_user


@app.put("/api/auth/me", response_model=UserResponse)
def update_users_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user info."""
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.organization is not None:
        current_user.organization = user_update.organization
    if user_update.profile_image is not None:
        current_user.profile_image = user_update.profile_image
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return current_user


# ── API Spec Upload and Parsing Endpoints ───────────────────────────────

@app.post("/api/specs/upload", response_model=APISpecUploadResponse)
async def upload_spec(
    file: UploadFile = File(...),
    name: str = Form(...),
    version: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload and parse an OpenAPI specification."""
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file format. Only .yaml, .yml, and .json are allowed.")
    
    # Validate file size
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
    
    # Parse spec
    try:
        spec_content = content.decode('utf-8')
        parsed_spec = parse_openapi_spec(spec_content, file_ext[1:])
        endpoints_count = count_endpoints(parsed_spec)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse OpenAPI spec: {str(e)}")
    
    # Create API spec record
    db_spec = APISpec(
        name=name,
        version=version,
        description=description,
        file_name=file.filename,
        file_size=len(content),
        spec_format=file_ext[1:],
        raw_content=spec_content,
        parsed_content=parsed_spec,
        endpoints_count=endpoints_count,
        status="parsed",
        owner_id=current_user.id
    )
    db.add(db_spec)
    db.commit()
    db.refresh(db_spec)
    
    # Run security analysis
    security_result = analyze_security_mock(parsed_spec, str(db_spec.id))
    db_security = SecurityAnalysis(
        api_spec_id=db_spec.id,
        total_findings=security_result["summary"]["totalFindings"],
        critical_count=security_result["summary"]["criticalCount"],
        high_count=security_result["summary"]["highCount"],
        medium_count=security_result["summary"]["mediumCount"],
        low_count=security_result["summary"]["lowCount"],
        findings=security_result["findings"]
    )
    db.add(db_security)
    
    # Run risk assessment
    risk_result = assess_risk_mock(parsed_spec, security_result["findings"])
    db_risk = RiskAssessment(
        api_spec_id=db_spec.id,
        overall_score=risk_result["overallScore"],
        severity=risk_result["severity"],
        trend=risk_result["trend"],
        breakdown=risk_result["breakdown"],
        top_contributors=risk_result["topContributors"]
    )
    db.add(db_risk)
    
    # Generate dependency graph
    graph_result = generate_dependency_graph_mock(parsed_spec)
    db_graph = DependencyGraph(
        api_spec_id=db_spec.id,
        nodes=graph_result["nodes"],
        edges=graph_result["edges"],
        total_nodes=graph_result["metadata"]["totalNodes"],
        total_edges=graph_result["metadata"]["totalEdges"],
        critical_paths=graph_result["metadata"]["criticalPaths"],
        circular_dependencies=graph_result["metadata"]["circularDependencies"],
        disconnected_services=graph_result["metadata"]["disconnectedServices"],
        single_points_of_failure=graph_result["metadata"]["singlePointsOfFailure"]
    )
    db.add(db_graph)
    
    db.commit()
    
    # Update spec status
    db_spec.status = "analyzed"
    db.commit()
    
    # Return response in legacy format for frontend compatibility
    return APISpecUploadResponse(
        id=db_spec.id,
        name=db_spec.name,
        file_name=db_spec.file_name,
        file_size=db_spec.file_size,
        status=db_spec.status,
        endpoints_count=db_spec.endpoints_count,
        created_at=db_spec.created_at,
        size=format_file_size(db_spec.file_size),
        uploadedAt=time_ago(db_spec.created_at),
        risks=security_result["summary"]["criticalCount"] + security_result["summary"]["highCount"]
    )


@app.get("/api/specs", response_model=List[LegacyUploadHistory])
def get_specs(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all uploaded specs (legacy format for frontend compatibility)."""
    specs = db.query(APISpec).filter(
        APISpec.owner_id == current_user.id
    ).order_by(APISpec.created_at.desc()).offset(skip).limit(limit).all()
    
    # Convert to legacy format
    legacy_specs = []
    for spec in specs:
        security = db.query(SecurityAnalysis).filter(SecurityAnalysis.api_spec_id == spec.id).first()
        risks = security.critical_count + security.high_count if security else 0
        
        legacy_specs.append(LegacyUploadHistory(
            id=str(spec.id),
            name=spec.name,
            size=format_file_size(spec.file_size),
            uploadedAt=time_ago(spec.created_at),
            status=spec.status,
            endpoints=spec.endpoints_count,
            risks=risks
        ))
    
    return legacy_specs


@app.get("/api/specs/{spec_id}", response_model=APISpecUploadResponse)
def get_spec(
    spec_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific spec by ID."""
    spec = db.query(APISpec).filter(
        APISpec.id == spec_id,
        APISpec.owner_id == current_user.id
    ).first()
    
    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")
    
    security = db.query(SecurityAnalysis).filter(SecurityAnalysis.api_spec_id == spec.id).first()
    risks = security.critical_count + security.high_count if security else 0
    
    return APISpecUploadResponse(
        id=spec.id,
        name=spec.name,
        file_name=spec.file_name,
        file_size=spec.file_size,
        status=spec.status,
        endpoints_count=spec.endpoints_count,
        created_at=spec.created_at,
        size=format_file_size(spec.file_size),
        uploadedAt=time_ago(spec.created_at),
        risks=risks
    )


@app.delete("/api/specs/{spec_id}")
def delete_spec(
    spec_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a spec by ID."""
    spec = db.query(APISpec).filter(
        APISpec.id == spec_id,
        APISpec.owner_id == current_user.id
    ).first()
    
    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")
    
    db.delete(spec)
    db.commit()
    
    return {"message": "Spec deleted successfully"}


# ── Security Analysis Endpoints ───────────────────────────────────────

@app.get("/api/specs/{spec_id}/security", response_model=SecurityAnalysisResponse)
def get_security_analysis(
    spec_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get security analysis for a spec."""
    spec = db.query(APISpec).filter(
        APISpec.id == spec_id,
        APISpec.owner_id == current_user.id
    ).first()
    
    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")
    
    security = db.query(SecurityAnalysis).filter(SecurityAnalysis.api_spec_id == spec_id).first()
    
    if not security:
        raise HTTPException(status_code=404, detail="Security analysis not found")
    
    return SecurityAnalysisResponse(
        findings=security.findings,
        summary={
            "totalFindings": security.total_findings,
            "criticalCount": security.critical_count,
            "highCount": security.high_count,
            "mediumCount": security.medium_count,
            "lowCount": security.low_count,
            "riskScore": None
        },
        timestamp=security.analyzed_at.isoformat(),
        specId=str(spec_id)
    )


# ── Risk Assessment Endpoints ─────────────────────────────────────────

@app.get("/api/specs/{spec_id}/risk", response_model=RiskScoreResponse)
def get_risk_assessment(
    spec_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get risk assessment for a spec."""
    spec = db.query(APISpec).filter(
        APISpec.id == spec_id,
        APISpec.owner_id == current_user.id
    ).first()
    
    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")
    
    risk = db.query(RiskAssessment).filter(RiskAssessment.api_spec_id == spec_id).first()
    
    if not risk:
        raise HTTPException(status_code=404, detail="Risk assessment not found")
    
    return RiskScoreResponse(
        overallScore=risk.overall_score,
        severity=risk.severity,
        trend=risk.trend,
        breakdown=risk.breakdown,
        topContributors=risk.top_contributors
    )


# ── Dependency Graph Endpoints ────────────────────────────────────────

@app.get("/api/specs/{spec_id}/dependency-graph", response_model=DependencyGraphResponse)
def get_dependency_graph(
    spec_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get dependency graph for a spec."""
    spec = db.query(APISpec).filter(
        APISpec.id == spec_id,
        APISpec.owner_id == current_user.id
    ).first()
    
    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")
    
    graph = db.query(DependencyGraph).filter(DependencyGraph.api_spec_id == spec_id).first()
    
    if not graph:
        raise HTTPException(status_code=404, detail="Dependency graph not found")
    
    return DependencyGraphResponse(
        nodes=graph.nodes,
        edges=graph.edges,
        metadata={
            "totalNodes": graph.total_nodes,
            "totalEdges": graph.total_edges,
            "criticalPaths": graph.critical_paths,
            "circularDependencies": graph.circular_dependencies,
            "disconnectedServices": graph.disconnected_services,
            "singlePointsOfFailure": graph.single_points_of_failure
        }
    )


# ── AI Recommendations Endpoints ───────────────────────────────────────

@app.get("/api/specs/{spec_id}/ai-recommendations", response_model=List[AIRecommendationResponse])
def get_ai_recommendations(
    spec_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI recommendations for a spec."""
    spec = db.query(APISpec).filter(
        APISpec.id == spec_id,
        APISpec.owner_id == current_user.id
    ).first()
    
    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")
    
    security = db.query(SecurityAnalysis).filter(SecurityAnalysis.api_spec_id == spec_id).first()
    
    if not security:
        raise HTTPException(status_code=404, detail="Security analysis not found")
    
    # Generate recommendations for each finding
    recommendations = []
    for finding in security.findings[:5]:  # Limit to top 5 findings
        rec = generate_ai_recommendation_mock(finding)
        recommendations.append(AIRecommendationResponse(**rec))
    
    return recommendations


# ── Reports Endpoints ───────────────────────────────────────────────

@app.post("/api/specs/{spec_id}/reports/{report_type}", response_model=ReportResponse)
def generate_report(
    spec_id: int,
    report_type: str,
    format: str = "pdf",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate a report for a spec."""
    spec = db.query(APISpec).filter(
        APISpec.id == spec_id,
        APISpec.owner_id == current_user.id
    ).first()
    
    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")
    
    # Create report record
    report_id = str(uuid.uuid4())
    db_report = Report(
        api_spec_id=spec_id,
        report_type=report_type,
        format=format,
        report_id=report_id,
        content={"status": "generated", "spec_id": spec_id}
    )
    db.add(db_report)
    db.commit()
    
    return ReportResponse(
        reportId=report_id,
        generatedAt=db_report.generated_at.isoformat(),
        specName=spec.name,
        format=format,
        reportType=report_type,
        downloadUrl=f"/api/specs/{spec_id}/reports/{report_id}/download"
    )


# ── Dashboard Stats Endpoints ───────────────────────────────────────

@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics."""
    specs = db.query(APISpec).filter(APISpec.owner_id == current_user.id).all()
    
    total_apis = len(specs)
    total_endpoints = sum(spec.endpoints_count for spec in specs)
    
    # Calculate total risks from security analyses
    total_risks = 0
    critical_apis = 0
    
    for spec in specs:
        security = db.query(SecurityAnalysis).filter(SecurityAnalysis.api_spec_id == spec.id).first()
        if security:
            risks = security.critical_count + security.high_count
            total_risks += risks
            if security.critical_count > 0:
                critical_apis += 1
    
    # Calculate average risk score
    avg_risk_score = 0.0
    if specs:
        total_risk_score = 0.0
        risk_count = 0
        for spec in specs:
            risk = db.query(RiskAssessment).filter(RiskAssessment.api_spec_id == spec.id).first()
            if risk:
                total_risk_score += risk.overall_score
                risk_count += 1
        if risk_count > 0:
            avg_risk_score = total_risk_score / risk_count
    
    return DashboardStats(
        totalAPIs=total_apis,
        criticalAPIs=critical_apis,
        totalEndpoints=total_endpoints,
        totalRisks=total_risks,
        avgRiskScore=avg_risk_score
    )


# ── Health Check ─────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.APP_VERSION}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
