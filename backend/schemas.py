from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime


# Workspace Schemas
class WorkspaceBase(BaseModel):
    name: str
    organization: Optional[str] = None
    settings: Optional[Dict[str, Any]] = {}
    api_limits: Optional[int] = 100

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceResponse(WorkspaceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    organization: Optional[str] = None
    active_workspace_id: Optional[int] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    organization: Optional[str] = None
    profile_image: Optional[str] = None
    active_workspace_id: Optional[int] = None


class UserResponse(UserBase):
    id: int
    email: EmailStr
    username: str
    full_name: Optional[str]
    organization: Optional[str]
    role: str
    profile_image: Optional[str]
    email_verified: bool
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]
    active_workspace_id: Optional[int]
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str


# API Spec Schemas
class APISpecBase(BaseModel):
    name: str
    version: Optional[str] = None
    description: Optional[str] = None
    workspace_id: Optional[int] = None


class APISpecCreate(APISpecBase):
    pass


class APISpecResponse(APISpecBase):
    id: int
    file_name: str
    file_size: int
    spec_format: str
    endpoints_count: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class APISpecUploadResponse(BaseModel):
    id: int
    name: str
    file_name: str
    file_size: int
    status: str
    endpoints_count: int
    created_at: datetime
    # Include legacy format for frontend compatibility
    size: str
    uploadedAt: str
    risks: Optional[int] = None


# Security Finding Schemas
class SecurityFinding(BaseModel):
    id: str
    title: str
    severity: str
    owaspCategory: str
    affectedEndpoint: str
    affectedMethod: str
    businessImpact: str
    technicalDetails: str
    suggestedFix: str
    confidence: str


class SecurityAnalysisSummary(BaseModel):
    totalFindings: int
    criticalCount: int
    highCount: int
    mediumCount: int
    lowCount: int
    riskScore: Optional[float] = None


class SecurityAnalysisResponse(BaseModel):
    findings: List[SecurityFinding]
    summary: SecurityAnalysisSummary
    timestamp: str
    specId: str


# Risk Assessment Schemas
class RiskFactor(BaseModel):
    name: str
    weight: float
    score: float
    maxScore: float
    description: str


class RiskContributor(BaseModel):
    category: str
    factor: str
    score: float
    impact: str
    recommendation: str


class RiskScoreResponse(BaseModel):
    overallScore: float
    severity: str
    trend: str
    breakdown: Dict[str, RiskFactor]
    topContributors: List[RiskContributor]


# Dependency Graph Schemas
class GraphNode(BaseModel):
    id: str
    type: str
    label: str
    risk: str
    health: int
    endpoints: int
    isExternal: bool


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str
    weight: int
    isCritical: bool


class DependencyGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    metadata: Dict[str, Any]


# AI Recommendation Schemas
class CodeExample(BaseModel):
    language: str
    before: str
    after: str
    description: str


class AIRecommendationResponse(BaseModel):
    explanation: str
    businessImpact: str
    fix: str
    estimatedTime: str
    codeExample: CodeExample
    priority: str
    confidence: float


# Report Schemas
class ReportResponse(BaseModel):
    reportId: str
    generatedAt: str
    specName: str
    format: str
    reportType: str
    downloadUrl: Optional[str] = None


# Legacy compatibility schemas (matching frontend mock structure)
class LegacyUploadHistory(BaseModel):
    id: str
    name: str
    size: str
    uploadedAt: str
    status: str
    endpoints: int
    risks: int


class DashboardStats(BaseModel):
    totalAPIs: int
    criticalAPIs: int
    totalEndpoints: int
    totalRisks: int
    avgRiskScore: float
