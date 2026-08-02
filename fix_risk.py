import os

def fix_all():
    with open('src/services/dashboardService.ts', 'r') as f:
        content = f.read()
    
    content = content.replace(
        "insights: [15, 18, 24, 21, 28, 32, 36, 42]",
        "insights: [15, 18, 24, 21, 28, 32, 36, 42],\n      risk: [4.2, 4.0, 3.8, 3.6, 3.4, 3.5, 3.3, 3.2]"
    )
    
    with open('src/services/dashboardService.ts', 'w') as f:
        f.write(content)
        
    with open('src/pages/Dashboard.tsx', 'r') as f:
        content = f.read()
    
    content = content.replace(
        """<KPICard 
          id="risk" 
          label="Risk Score" 
          value={32} 
          display="3.2" """,
        """<KPICard 
          id="risk" 
          label="Risk Score" 
          value={stats?.riskScore || 0}
          display={stats?.riskScore?.toString() || "0"} """
    )
    
    content = content.replace(
        "function Sparkline({ data, color }: { data: number[], color: string }) {",
        "function Sparkline({ data, color }: { data: number[], color: string }) {\n  if (!data || data.length === 0) return null;"
    )

    with open('src/pages/Dashboard.tsx', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    fix_all()
    print("Fixed Risk KPI")
