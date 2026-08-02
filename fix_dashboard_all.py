import os
import re

def fix_all_dashboard():
    with open('src/pages/Dashboard.tsx', 'r') as f:
        content = f.read()

    # Pass stats to Hero
    content = content.replace(
        "function Hero({ onScan, onUpload, onNavigate }: { onScan: () => void; onUpload: () => void; onNavigate: (page: Page) => void }) {",
        "function Hero({ onScan, onUpload, onNavigate, stats }: { onScan: () => void; onUpload: () => void; onNavigate: (page: Page) => void, stats: any }) {"
    )
    
    content = content.replace(
        """              {[
                { label: '284 APIs', sub: 'Monitored', color: 'var(--info)' },
                { label: '12 Critical', sub: 'Need attention', color: 'var(--error)' },
                { label: 'Score 91', sub: 'Security grade', color: 'var(--success)' },
              ].map((m) => (""",
        """              {[
                { label: `${stats?.totalAPIs || 0} APIs`, sub: 'Monitored', color: 'var(--info)' },
                { label: `${stats?.criticalIssues || 0} Critical`, sub: 'Need attention', color: 'var(--error)' },
                { label: `Score ${stats?.securityScore || 0}`, sub: 'Security grade', color: 'var(--success)' },
              ].map((m) => ("""
    )
    
    content = content.replace(
        "<Hero onScan={() => {}} onUpload={handleUpload} onNavigate={onNavigate} />",
        "<Hero onScan={() => {}} onUpload={handleUpload} onNavigate={onNavigate} stats={stats} />"
    )

    # Fix OWASP Distribution hardcoded 91
    content = content.replace(
        """function DonutChart({ segs }: { segs: any[] }) {""",
        """function DonutChart({ segs, score }: { segs: any[], score: number }) {"""
    )
    
    content = content.replace(
        """Score 91/100""",
        """Score {score}/100"""
    )
    
    content = content.replace(
        """<text x={cx} y={cy - 7} textAnchor="middle" style={{ fontSize: 'clamp(18px, 5vw, 23px)', fontWeight: 800, fontFamily: 'Alegreya, serif', fill: 'var(--text-primary)' }}>91</text>""",
        """<text x={cx} y={cy - 7} textAnchor="middle" style={{ fontSize: 'clamp(18px, 5vw, 23px)', fontWeight: 800, fontFamily: 'Alegreya, serif', fill: 'var(--text-primary)' }}>{score}</text>"""
    )
    
    content = content.replace(
        """284 APIs · API2:2023 top violated""",
        """API2:2023 top violated"""
    )
    
    content = content.replace(
        """<DonutChart segs={owaspDistribution} />""",
        """<DonutChart segs={owaspDistribution} score={stats.securityScore || 0} />"""
    )
    
    # Fix Risk Trend hardcoded 91 and +33 pts YoY
    content = content.replace(
        """function RiskTrend({ trendData }: { trendData: any[] }) {""",
        """function RiskTrend({ trendData, score }: { trendData: any[], score: number }) {"""
    )
    
    content = content.replace(
        """{filteredData.at(-1)?.value || 91}""",
        """{score}"""
    )
    
    content = content.replace(
        """<RiskTrend trendData={trendData} />""",
        """<RiskTrend trendData={trendData} score={stats.securityScore || 0} />"""
    )

    with open('src/pages/Dashboard.tsx', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    fix_all_dashboard()
    print("Dashboard fully fixed")
