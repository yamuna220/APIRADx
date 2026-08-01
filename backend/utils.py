import yaml
import json
from typing import Dict, List, Any, Optional
from datetime import datetime


def parse_openapi_spec(content: str, format: str) -> Dict[str, Any]:
    """Parse OpenAPI specification from YAML or JSON format."""
    try:
        if format == "yaml" or format == "yml":
            spec = yaml.safe_load(content)
        elif format == "json":
            spec = json.loads(content)
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        # Validate basic OpenAPI structure
        if not isinstance(spec, dict):
            raise ValueError("Invalid spec: not a dictionary")
        
        if "openapi" not in spec and "swagger" not in spec:
            raise ValueError("Invalid OpenAPI spec: missing version field")
        
        return spec
    except Exception as e:
        raise ValueError(f"Failed to parse spec: {str(e)}")


def count_endpoints(spec: Dict[str, Any]) -> int:
    """Count the number of endpoints in an OpenAPI spec."""
    count = 0
    if "paths" in spec:
        for path, path_item in spec["paths"].items():
            if isinstance(path_item, dict):
                for method in ["get", "post", "put", "delete", "patch", "options", "head"]:
                    if method in path_item:
                        count += 1
    return count


def format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"


def time_ago(timestamp: datetime) -> str:
    """Calculate time ago in human-readable format."""
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


# Mock security analysis (mirrors frontend logic)
def analyze_security_mock(spec: Dict[str, Any], spec_id: str) -> Dict[str, Any]:
    """Mock security analysis function."""
    findings = []
    
    # Check for missing authentication
    if "paths" in spec:
        for path, path_item in spec["paths"].items():
            if "auth" in path.lower() or "login" in path.lower():
                if "security" not in spec and not path_item.get("security"):
                    findings.append({
                        "id": f"missing_auth_{path}",
                        "title": "Missing Authentication",
                        "severity": "Critical",
                        "owaspCategory": "API2:2019-Broken Authentication",
                        "affectedEndpoint": path,
                        "affectedMethod": "POST",
                        "businessImpact": "Unauthorized access to sensitive operations",
                        "technicalDetails": "Endpoint lacks proper authentication",
                        "suggestedFix": "Implement JWT or OAuth2 authentication",
                        "confidence": "High"
                    })
    
    # Check for HTTP instead of HTTPS
    if "servers" in spec:
        for server in spec["servers"]:
            if server.get("url", "").startswith("http://"):
                findings.append({
                    "id": "http_insecure",
                    "title": "HTTP Instead of HTTPS",
                    "severity": "High",
                    "owaspCategory": "API9:2019-Improper Assets Management",
                    "affectedEndpoint": server["url"],
                    "affectedMethod": "ALL",
                    "businessImpact": "Data transmitted in plaintext",
                    "technicalDetails": "Server uses HTTP instead of HTTPS",
                    "suggestedFix": "Configure server to use HTTPS with TLS",
                    "confidence": "High"
                })
    
    # Generate summary
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
            "riskScore": critical_count * 25 + high_count * 15 + medium_count * 8 + low_count * 3
        },
        "timestamp": datetime.utcnow().isoformat(),
        "specId": spec_id
    }


# Mock risk assessment (mirrors frontend logic)
def assess_risk_mock(spec: Dict[str, Any], security_findings: List[Dict]) -> Dict[str, Any]:
    """Mock risk assessment function."""
    critical_count = sum(1 for f in security_findings if f["severity"] == "Critical")
    high_count = sum(1 for f in security_findings if f["severity"] == "High")
    
    overall_score = critical_count * 25 + high_count * 15
    
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
                "weight": 0.25,
                "score": critical_count * 10,
                "maxScore": 25,
                "description": "Authentication and authorization security"
            },
            "owaspViolations": {
                "name": "OWASP Violations",
                "weight": 0.20,
                "score": len(security_findings) * 5,
                "maxScore": 20,
                "description": "OWASP API Security Top 10 violations"
            }
        },
        "topContributors": [
            {
                "category": "Security",
                "factor": "Authentication",
                "score": critical_count * 10,
                "impact": str(critical_count * 10),
                "recommendation": "Implement proper authentication"
            }
        ]
    }


# Mock dependency graph (mirrors frontend logic)
def generate_dependency_graph_mock(spec: Dict[str, Any]) -> Dict[str, Any]:
    """Mock dependency graph generation."""
    nodes = []
    edges = []
    
    if "paths" in spec:
        services = set()
        for path in spec["paths"].keys():
            segments = path.split("/").filter(lambda s: s)
            if segments:
                services.add(segments[0])
        
        for service in services:
            nodes.append({
                "id": service,
                "type": "service",
                "label": service.capitalize(),
                "risk": "Healthy",
                "health": 100,
                "endpoints": 0,
                "isExternal": False
            })
        
        # Add some mock edges
        service_list = list(services)
        for i in range(len(service_list) - 1):
            edges.append({
                "id": f"{service_list[i]}_{service_list[i+1]}",
                "source": service_list[i],
                "target": service_list[i+1],
                "type": "dependency",
                "weight": 1,
                "isCritical": False
            })
    
    return {
        "nodes": nodes,
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


# Mock AI recommendations (mirrors frontend logic)
def generate_ai_recommendation_mock(finding: Dict[str, Any]) -> Dict[str, Any]:
    """Mock AI recommendation generation."""
    return {
        "explanation": f"This {finding['title']} vulnerability on {finding['affectedEndpoint']} represents a security risk.",
        "businessImpact": "Unauthorized access and potential data breach",
        "fix": "Implement proper security controls following OWASP guidelines",
        "estimatedTime": "2-4 hours",
        "codeExample": {
            "language": "typescript",
            "before": "// Vulnerable code",
            "after": "// Secure code with proper controls",
            "description": "Add security controls"
        },
        "priority": finding["severity"],
        "confidence": 0.85
    }
