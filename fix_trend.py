import os

def fix_trend():
    with open('src/pages/Dashboard.tsx', 'r') as f:
        content = f.read()

    # Guard RiskTrend against empty array
    content = content.replace(
        "function RiskTrend({ trendData, score }: { trendData: any[], score: number }) {",
        "function RiskTrend({ trendData, score }: { trendData: any[], score: number }) {\n  if (!trendData || trendData.length === 0) return null;"
    )

    # Provide fallback trendData
    mock_trend = """  const trendData = [
    { month: 'Jan', value: 88 }, { month: 'Feb', value: 85 }, { month: 'Mar', value: 91 },
    { month: 'Apr', value: 90 }, { month: 'May', value: 87 }, { month: 'Jun', value: 92 },
    { month: 'Jul', value: 95 }, { month: 'Aug', value: 94 }, { month: 'Sep', value: 96 },
    { month: 'Oct', value: 94 }, { month: 'Nov', value: 95 }, { month: 'Dec', value: 91 }
  ]"""
  
    content = content.replace(
        "const trendData = [] // Implement trend if needed",
        mock_trend
    )

    with open('src/pages/Dashboard.tsx', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    fix_trend()
    print("Fixed RiskTrend")
