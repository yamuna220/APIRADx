from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Boolean, JSON, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


# Workspace Members Association Table
workspace_members = Table(
    "workspace_members",
    Base.metadata,
    Column("workspace_id", Integer, ForeignKey("workspaces.id"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("role", String, default="member")  # admin, member, viewer
)


class Workspace(Base):
    __tablename__ = "workspaces"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    organization = Column(String)
    settings = Column(JSON, default={})
    api_limits = Column(Integer, default=100)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    members = relationship("User", secondary=workspace_members, back_populates="workspaces")
    api_specs = relationship("APISpec", back_populates="workspace", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="workspace", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="workspace", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    organization = Column(String)
    role = Column(String, default="member")  # admin, member, viewer
    profile_image = Column(String)
    email_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    
    active_workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    
    # Relationships
    # Relationships
    workspaces = relationship("Workspace", secondary=workspace_members, back_populates="members")
    active_workspace = relationship("Workspace", foreign_keys=[active_workspace_id])
    api_specs = relationship("APISpec", back_populates="owner")
    verification_tokens = relationship("VerificationToken", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")


class APISpec(Base):
    __tablename__ = "api_specs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    version = Column(String)
    description = Column(Text)
    file_name = Column(String, nullable=False)
    file_size = Column(Integer)
    file_path = Column(String)
    spec_format = Column(String)  # "yaml" or "json"
    raw_content = Column(Text)
    parsed_content = Column(JSON)
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="api_specs")
    
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    workspace = relationship("Workspace", back_populates="api_specs")
    
    # Analysis results
    endpoints_count = Column(Integer, default=0)
    status = Column(String, default="pending")  # pending, parsed, analyzed, error
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    security_analysis = relationship("SecurityAnalysis", back_populates="api_spec", uselist=False)
    risk_assessment = relationship("RiskAssessment", back_populates="api_spec", uselist=False)
    dependency_graph = relationship("DependencyGraph", back_populates="api_spec", uselist=False)
    reports = relationship("Report", back_populates="api_spec")


class SecurityAnalysis(Base):
    __tablename__ = "security_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    api_spec_id = Column(Integer, ForeignKey("api_specs.id"), unique=True)
    api_spec = relationship("APISpec", back_populates="security_analysis")
    
    # Summary
    total_findings = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    
    # Findings stored as JSON
    findings = Column(JSON)
    
    # Analysis metadata
    analyzed_at = Column(DateTime, default=datetime.utcnow)
    analysis_version = Column(String, default="1.0.0")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    api_spec_id = Column(Integer, ForeignKey("api_specs.id"), unique=True)
    api_spec = relationship("APISpec", back_populates="risk_assessment")
    
    # Risk scores
    overall_score = Column(Float)
    severity = Column(String)
    trend = Column(String)
    
    # Breakdown stored as JSON
    breakdown = Column(JSON)
    top_contributors = Column(JSON)
    
    # Assessment metadata
    assessed_at = Column(DateTime, default=datetime.utcnow)
    assessment_version = Column(String, default="1.0.0")


class DependencyGraph(Base):
    __tablename__ = "dependency_graphs"
    
    id = Column(Integer, primary_key=True, index=True)
    api_spec_id = Column(Integer, ForeignKey("api_specs.id"), unique=True)
    api_spec = relationship("APISpec", back_populates="dependency_graph")
    
    # Graph data stored as JSON
    nodes = Column(JSON)
    edges = Column(JSON)
    
    # Analysis results
    total_nodes = Column(Integer, default=0)
    total_edges = Column(Integer, default=0)
    critical_paths = Column(JSON)
    circular_dependencies = Column(JSON)
    disconnected_services = Column(JSON)
    single_points_of_failure = Column(JSON)
    
    # Graph metadata
    generated_at = Column(DateTime, default=datetime.utcnow)
    graph_version = Column(String, default="1.0.0")


class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    api_spec_id = Column(Integer, ForeignKey("api_specs.id"))
    vulnerability_id = Column(String)
    
    # Recommendation content
    explanation = Column(Text)
    business_impact = Column(Text)
    fix = Column(Text)
    estimated_time = Column(String)
    code_example = Column(JSON)
    priority = Column(String)
    confidence = Column(Float)
    
    # Metadata
    provider = Column(String, default="mock")
    generated_at = Column(DateTime, default=datetime.utcnow)


class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    api_spec_id = Column(Integer, ForeignKey("api_specs.id"))
    api_spec = relationship("APISpec", back_populates="reports")
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    workspace = relationship("Workspace", back_populates="reports")
    
    # Report details
    title = Column(String)
    report_id = Column(String, unique=True, index=True)
    scan_id = Column(String)
    report_type = Column(String)  # executive, technical, audit, compliance
    format = Column(String)  # pdf, csv
    file_path = Column(String)
    file_name = Column(String)
    pdf_path = Column(String)
    csv_path = Column(String)
    
    # Report content (stored as JSON for flexibility)
    content = Column(JSON)
    
    # Metadata
    generated_at = Column(DateTime, default=datetime.utcnow)
    generated_by = Column(Integer, ForeignKey("users.id"))


class VerificationToken(Base):
    __tablename__ = "verification_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="verification_tokens")
    
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def is_expired(self):
        return datetime.utcnow() > self.expires_at


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="password_reset_tokens")
    
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def is_expired(self):
        return datetime.utcnow() > self.expires_at


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="refresh_tokens")
    
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    revoked_at = Column(DateTime)
    
    def is_expired(self):
        return datetime.utcnow() > self.expires_at
    
    def is_revoked(self):
        return self.revoked_at is not None


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="audit_logs")
    
    action = Column(String, nullable=False)  # login, logout, register, password_reset, etc.
    ip_address = Column(String)
    user_agent = Column(String)
    details = Column(JSON)  # Additional context
    timestamp = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    workspace = relationship("Workspace", back_populates="notifications")
    
    title = Column(String, nullable=False)
    message = Column(Text)
    type = Column(String)  # info, warning, error, success
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


