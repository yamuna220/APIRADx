import yaml
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import re

def parse_openapi_spec(content: str, format: str) -> Dict[str, Any]:
    """Parse OpenAPI specification from YAML or JSON format and extract comprehensive details."""
    try:
        # Validate format and empty files
        if not content or not content.strip():
            raise ValueError("File is empty")
            
        if format in ["yaml", "yml"]:
            spec = yaml.safe_load(content)
        elif format == "json":
            spec = json.loads(content)
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        if not isinstance(spec, dict):
            raise ValueError("Invalid spec: not a dictionary")
        
        if "openapi" not in spec and "swagger" not in spec:
            raise ValueError("Invalid OpenAPI spec: missing version field")
            
        return spec
    except yaml.YAMLError as e:
        raise ValueError(f"Invalid YAML format: {str(e)}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format: {str(e)}")
    except Exception as e:
        raise ValueError(f"Failed to parse spec: {str(e)}")

def count_endpoints(spec: Dict[str, Any]) -> int:
    """Count the number of endpoints in an OpenAPI spec."""
    count = 0
    if "paths" in spec and isinstance(spec["paths"], dict):
        for path, path_item in spec["paths"].items():
            if isinstance(path_item, dict):
                for method in ["get", "post", "put", "delete", "patch", "options", "head"]:
                    if method in path_item:
                        count += 1
    return count

def format_file_size(size_bytes: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"

def time_ago(timestamp: datetime) -> str:
    delta = datetime.utcnow() - timestamp
    seconds = delta.total_seconds()
    if seconds < 60:
        return f"{int(seconds)} sec ago"
    elif seconds < 3600:
        return f"{int(seconds / 60)} min ago"
    elif seconds < 86400:
        return f"{int(seconds / 3600)} hr ago"
    elif seconds < 604800:
        return f"{int(seconds / 86400)} day ago"
    else:
        return f"{int(seconds / 604800)} days ago"

def analyze_security_engine(spec: Dict[str, Any], spec_id: str) -> Dict[str, Any]:
    """Dynamic rule-based security analysis."""
    findings = []
    
    # 1. Missing Security Scheme
    components = spec.get("components", {})
    security_schemes = components.get("securitySchemes", {})
    if not security_schemes and "securityDefinitions" not in spec:
        findings.append({
            "id": "missing_security_scheme",
            "title": "Missing Security Scheme",
            "severity": "Critical",
            "owaspCategory": "API2:2019-Broken Authentication",
            "affectedEndpoint": "Global",
            "affectedMethod": "ALL",
            "businessImpact": "Entire API lacks standardized authentication definitions.",
            "technicalDetails": "No security schemes defined in components.",
            "suggestedFix": "Define JWT or OAuth2 in securitySchemes.",
            "confidence": "High"
        })
        
    # 2. HTTP instead of HTTPS / Basic Auth without HTTPS
    servers = spec.get("servers", [])
    if servers:
        for s in servers:
            if isinstance(s, dict) and s.get("url", "").startswith("http://"):
                findings.append({
                    "id": f"insecure_server_{s.get('url')}",
                    "title": "HTTP Instead of HTTPS",
                    "severity": "High",
                    "owaspCategory": "API9:2019-Improper Assets Management",
                    "affectedEndpoint": s.get("url"),
                    "affectedMethod": "ALL",
                    "businessImpact": "Data transmitted in plaintext is vulnerable to interception.",
                    "technicalDetails": "Server URL uses http://",
                    "suggestedFix": "Enforce https:// for all servers.",
                    "confidence": "High"
                })
    elif spec.get("schemes") and "https" not in spec.get("schemes", []):
        # Swagger 2.0
        findings.append({
            "id": "insecure_schemes",
            "title": "Missing HTTPS Scheme",
            "severity": "High",
            "owaspCategory": "API9:2019-Improper Assets Management",
            "affectedEndpoint": "Global",
            "affectedMethod": "ALL",
            "businessImpact": "Data transmitted in plaintext is vulnerable to interception.",
            "technicalDetails": "HTTPS not specified in schemes.",
            "suggestedFix": "Enforce https:// schemes.",
            "confidence": "High"
        })
        
    # 3. Deprecated OpenAPI/Swagger Version
    if "swagger" in spec and str(spec["swagger"]).startswith("2"):
        findings.append({
            "id": "deprecated_swagger",
            "title": "Deprecated Swagger Version",
            "severity": "Medium",
            "owaspCategory": "API9:2019-Improper Assets Management",
            "affectedEndpoint": "Global",
            "affectedMethod": "ALL",
            "businessImpact": "Using outdated standards risks compatibility and security.",
            "technicalDetails": "Using Swagger 2.0.",
            "suggestedFix": "Migrate to OpenAPI 3.0 or 3.1.",
            "confidence": "High"
        })

    # Path-level checks
    paths = spec.get("paths", {})
    if isinstance(paths, dict):
        for path, path_item in paths.items():
            if not isinstance(path_item, dict):
                continue
                
            path_lower = path.lower()
            
            for method in ["get", "post", "put", "delete", "patch", "options", "head"]:
                if method not in path_item:
                    continue
                
                op = path_item[method]
                if not isinstance(op, dict):
                    continue
                    
                # 4. Missing Authentication
                has_global_security = bool(spec.get("security"))
                has_local_security = bool(op.get("security"))
                
                # Check if it explicitly overrides global to empty
                explicitly_unsecured = op.get("security") == []
                
                if not has_global_security and not has_local_security:
                    findings.append({
                        "id": f"missing_auth_{path}_{method}",
                        "title": "Missing Authentication",
                        "severity": "Critical",
                        "owaspCategory": "API2:2019-Broken Authentication",
                        "affectedEndpoint": path,
                        "affectedMethod": method.upper(),
                        "businessImpact": "Unauthenticated users may access sensitive resources.",
                        "technicalDetails": f"Endpoint lacks security requirements.",
                        "suggestedFix": "Implement JWT or OAuth2 authentication.",
                        "confidence": "High"
                    })
                elif explicitly_unsecured and ("admin" in path_lower or "users" in path_lower):
                    findings.append({
                        "id": f"unsecured_sensitive_{path}_{method}",
                        "title": "Public Admin/Sensitive Endpoint",
                        "severity": "Critical",
                        "owaspCategory": "API1:2019-Broken Object Level Authorization",
                        "affectedEndpoint": path,
                        "affectedMethod": method.upper(),
                        "businessImpact": "Anyone can access sensitive administrative functions.",
                        "technicalDetails": "Security is explicitly set to [] for sensitive path.",
                        "suggestedFix": "Require admin-level authentication.",
                        "confidence": "High"
                    })

                # 5. Missing operationId
                if "operationId" not in op:
                    findings.append({
                        "id": f"missing_opid_{path}_{method}",
                        "title": "Missing operationId",
                        "severity": "Low",
                        "owaspCategory": "API9:2019-Improper Assets Management",
                        "affectedEndpoint": path,
                        "affectedMethod": method.upper(),
                        "businessImpact": "Hinders code generation and API tracking.",
                        "technicalDetails": "No operationId defined.",
                        "suggestedFix": "Add a unique operationId.",
                        "confidence": "High"
                    })
                    
                # 6. Sensitive Endpoint Names
                sensitive_terms = ["admin", "payments", "token", "password", "secret", "creditcard"]
                if any(term in path_lower for term in sensitive_terms):
                    if method == "get" and "token" in path_lower:
                         findings.append({
                            "id": f"sensitive_get_{path}_{method}",
                            "title": "Sensitive Data in GET Request",
                            "severity": "High",
                            "owaspCategory": "API3:2019-Excessive Data Exposure",
                            "affectedEndpoint": path,
                            "affectedMethod": method.upper(),
                            "businessImpact": "Sensitive data might be logged in URLs or browser history.",
                            "technicalDetails": "GET request used for sensitive endpoint.",
                            "suggestedFix": "Use POST for sensitive operations.",
                            "confidence": "Medium"
                        })

    # Summary Generation
    critical_count = sum(1 for f in findings if f["severity"] == "Critical")
    high_count = sum(1 for f in findings if f["severity"] == "High")
    medium_count = sum(1 for f in findings if f["severity"] == "Medium")
    low_count = sum(1 for f in findings if f["severity"] == "Low")
    
    return {
        "findings": findings,
        "summary": {
            "totalFindings": len(findings),
            "criticalCount": critical_count,
            "highCount": high_count,
            "mediumCount": medium_count,
            "lowCount": low_count,
            "riskScore": None # calculated in assess_risk
        },
        "timestamp": datetime.utcnow().isoformat(),
        "specId": spec_id
    }

def assess_risk_engine(spec: Dict[str, Any], security_findings: List[Dict]) -> Dict[str, Any]:
    """Dynamic risk calculation using formula."""
    critical_count = sum(1 for f in security_findings if f["severity"] == "Critical")
    high_count = sum(1 for f in security_findings if f["severity"] == "High")
    medium_count = sum(1 for f in security_findings if f["severity"] == "Medium")
    low_count = sum(1 for f in security_findings if f["severity"] == "Low")
    
    base_score = (critical_count * 10) + (high_count * 6) + (medium_count * 3) + (low_count * 1)
    
    # Penalties
    auth_penalty = 15 if any("Authentication" in f["title"] for f in security_findings) else 0
    https_penalty = 10 if any("HTTPS" in f["title"] for f in security_findings) else 0
    sensitive_penalty = 10 if any("Sensitive" in f["title"] for f in security_findings) else 0
    
    overall_score = min(100, base_score + auth_penalty + https_penalty + sensitive_penalty)
    
    if overall_score >= 80:
        severity = "Critical"
    elif overall_score >= 60:
        severity = "High"
    elif overall_score >= 40:
        severity = "Medium"
    else:
        severity = "Low"
    
    return {
        "overallScore": overall_score,
        "severity": severity,
        "trend": "Stable",
        "breakdown": {
            "authentication": {
                "name": "Authentication",
                "weight": 0.30,
                "score": min(25, critical_count * 10 + auth_penalty),
                "maxScore": 25,
                "description": "Authentication and authorization security"
            },
            "owaspViolations": {
                "name": "OWASP Violations",
                "weight": 0.70,
                "score": min(75, base_score),
                "maxScore": 75,
                "description": "OWASP API Security Top 10 violations"
            }
        },
        "topContributors": [
            {
                "category": "Security",
                "factor": f["title"],
                "score": 10 if f["severity"] == "Critical" else 6,
                "impact": f["severity"],
                "recommendation": f["suggestedFix"]
            } for f in security_findings[:3]
        ]
    }

def generate_dependency_graph_engine(spec: Dict[str, Any]) -> Dict[str, Any]:
    """Dynamic dependency graph based on paths, tags, and schemas."""
    nodes = {}
    edges = []
    
    paths = spec.get("paths", {})
    if isinstance(paths, dict):
        for path, path_item in paths.items():
            if not isinstance(path_item, dict): continue
            
            # Use base path as service node
            segments = [s for s in path.split("/") if s and not s.startswith("{")]
            service_name = segments[0] if segments else "root"
            
            if service_name not in nodes:
                nodes[service_name] = {
                    "id": service_name,
                    "type": "service",
                    "label": service_name.capitalize(),
                    "risk": "Healthy",
                    "health": 100,
                    "endpoints": 0,
                    "isExternal": False
                }
            nodes[service_name]["endpoints"] += 1
            
            # Check for tags and schema refs
            for method in ["get", "post", "put", "delete", "patch"]:
                if method in path_item and isinstance(path_item[method], dict):
                    op = path_item[method]
                    tags = op.get("tags", [])
                    # Add tag edges
                    for tag in tags:
                        tag_node_id = f"tag_{tag}"
                        if tag_node_id not in nodes:
                            nodes[tag_node_id] = {
                                "id": tag_node_id,
                                "type": "database",
                                "label": f"Tag: {tag}",
                                "risk": "Healthy",
                                "health": 100,
                                "endpoints": 0,
                                "isExternal": False
                            }
                        edges.append({
                            "id": f"{service_name}_{tag_node_id}_{method}",
                            "source": service_name,
                            "target": tag_node_id,
                            "type": "dependency",
                            "weight": 1,
                            "isCritical": False
                        })
                        
    return {
        "nodes": list(nodes.values()),
        "edges": edges,
        "metadata": {
            "totalNodes": len(nodes),
            "totalEdges": len(edges),
            "criticalPaths": [],
            "circularDependencies": [],
            "disconnectedServices": [],
            "singlePointsOfFailure": []
        }
    }

def generate_ai_recommendation_engine(finding: Dict[str, Any]) -> Dict[str, Any]:
    """Rule-based AI recommendation logic."""
    title = finding.get("title", "")
    
    rec = {
        "explanation": f"The '{title}' vulnerability on '{finding.get('affectedEndpoint')}' exposes the API to serious risks.",
        "businessImpact": finding.get("businessImpact", "Unauthorized access and potential data breach"),
        "fix": finding.get("suggestedFix", "Implement proper security controls following OWASP guidelines"),
        "estimatedTime": "1-2 hours",
        "priority": finding.get("severity", "High"),
        "confidence": 0.95
    }
    
    if "Authentication" in title:
        rec["codeExample"] = {
            "language": "yaml",
            "before": "security: []",
            "after": "security:\n  - bearerAuth: []",
            "description": "Require Bearer token authentication"
        }
        rec["estimatedTime"] = "20 minutes"
    elif "HTTPS" in title:
        rec["codeExample"] = {
            "language": "yaml",
            "before": "servers:\n  - url: http://api.example.com",
            "after": "servers:\n  - url: https://api.example.com",
            "description": "Use HTTPS for all servers"
        }
        rec["estimatedTime"] = "10 minutes"
    else:
        rec["codeExample"] = {
            "language": "json",
            "before": "// Vulnerable configuration",
            "after": "// Secure configuration",
            "description": "Apply standard security practices"
        }
        
    return rec
