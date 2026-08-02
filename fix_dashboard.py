import os
import re

def fix_dashboard():
    with open('src/pages/Dashboard.tsx', 'r') as f:
        content = f.read()

    # 1. Add handleUpload
    content = content.replace(
        "const totalCritical = stats.criticalIssues\nreturn (",
        "const totalCritical = stats.criticalIssues\n  const handleUpload = () => onNavigate('upload-apis')\nreturn ("
    )

    # 2. Fix KPI values
    content = content.replace(
        """<KPICard 
          id="score" 
          label="Security Score" 
          value={91}""",
        """<KPICard 
          id="score" 
          label="Security Score" 
          value={stats.securityScore || 91}"""
    )
    
    content = content.replace(
        """<KPICard 
          id="risk" 
          label="Risk Score" 
          value={3.2}""",
        """<KPICard 
          id="risk" 
          label="Risk Score" 
          value={stats.riskScore || 3.2}"""
    )

    # 3. Add onClick to UploadCard and pass onUpload prop
    content = content.replace(
        "function UploadCard({ uploadHistory }: { uploadHistory: any[] }) {",
        "function UploadCard({ uploadHistory, onUpload }: { uploadHistory: any[], onUpload: () => void }) {"
    )
    
    content = content.replace(
        "onDrop={(e) => { e.preventDefault(); setDrag(false) }}",
        "onDrop={(e) => { e.preventDefault(); setDrag(false) }}\n        onClick={onUpload}"
    )
    
    content = content.replace(
        "<UploadCard uploadHistory={uploadHistory} />",
        "<UploadCard uploadHistory={uploadHistory} onUpload={handleUpload} />"
    )

    with open('src/pages/Dashboard.tsx', 'w') as f:
        f.write(content)

def fix_service():
    with open('src/services/dashboardService.ts', 'r') as f:
        content = f.read()
        
    content = content.replace(
        "totalInsights: aiInsights.length,",
        "totalInsights: aiInsights.length,\n            riskScore: (totalCritical > 0 ? 8.5 : (totalHigh > 0 ? 5.2 : 2.1)),"
    )
    
    with open('src/services/dashboardService.ts', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    fix_dashboard()
    fix_service()
    print("Dashboard fixed")
