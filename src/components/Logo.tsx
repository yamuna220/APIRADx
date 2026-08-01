interface LogoProps {
  size?: number
  showText?: boolean
  collapsed?: boolean
  /** Force wordmark color — defaults to var(--text-primary) */
  wordmarkColor?: string
}

/**
 * Official APIRADx brand mark — geometric network "A" lattice with wordmark.
 * Colors derive from CSS custom properties so it adapts to light / dark theme.
 */
export default function Logo({
  size = 34,
  showText = true,
  collapsed = false,
  wordmarkColor,
}: LogoProps) {
  const W = 44
  const H = 46

  return (
    <div className="flex items-center select-none" style={{ gap: showText && !collapsed ? 10 : 0 }}>
      {/* ── Geometric "A" lattice mark ── */}
      <svg
        width={size}
        height={Math.round(size * (H / W))}
        viewBox={`0 0 ${W} ${H}`}
        fill="none"
        style={{ flexShrink: 0, display: 'block' }}
      >
        {/* Primary structure lines — brand color */}
        {/* Left leg: bottom-left → left shoulder → apex */}
        <line x1="3"  y1="44" x2="16" y2="18" stroke="var(--brand)" strokeWidth="2"   strokeLinecap="round" />
        <line x1="16" y1="18" x2="22" y2="3"  stroke="var(--brand)" strokeWidth="2"   strokeLinecap="round" />
        {/* Right leg: apex → right shoulder → bottom-right */}
        <line x1="22" y1="3"  x2="28" y2="18" stroke="var(--brand)" strokeWidth="2"   strokeLinecap="round" />
        <line x1="28" y1="18" x2="41" y2="44" stroke="var(--brand)" strokeWidth="2"   strokeLinecap="round" />
        {/* Crossbar */}
        <line x1="10" y1="30" x2="34" y2="30" stroke="var(--brand)" strokeWidth="2"   strokeLinecap="round" />

        {/* Internal lattice diagonals — accent, slightly receded */}
        <line x1="16" y1="18" x2="34" y2="30" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" opacity="0.65" />
        <line x1="28" y1="18" x2="10" y2="30" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" opacity="0.65" />

        {/* ── Nodes: ordered back-to-front by visual importance ── */}

        {/* Foot nodes — smallest */}
        <circle cx="3"  cy="44" r="2"   fill="var(--brand)" />
        <circle cx="41" cy="44" r="2"   fill="var(--brand)" />

        {/* Crossbar accent intersections */}
        <circle cx="10" cy="30" r="2.8" fill="var(--accent)" />
        <circle cx="34" cy="30" r="2.8" fill="var(--accent)" />

        {/* Crossbar midpoint — subtle */}
        <circle cx="22" cy="30" r="1.8" fill="var(--brand)" opacity="0.45" />

        {/* Shoulder nodes */}
        <circle cx="16" cy="18" r="2.4" fill="var(--brand)" />
        <circle cx="28" cy="18" r="2.4" fill="var(--brand)" />

        {/* Apex — most prominent node */}
        <circle cx="22" cy="3"  r="3"   fill="var(--brand)" />
      </svg>

      {/* ── Wordmark ── */}
      {showText && !collapsed && (
        <div style={{ lineHeight: 1 }}>
          <div
            style={{
              fontFamily: 'Alegreya, Georgia, serif',
              fontSize: Math.round(size * 0.44),
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: wordmarkColor ?? 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            APIRA<span style={{ color: 'var(--brand)' }}>D</span>x
          </div>
          <div
            style={{
              fontFamily: 'Alegreya, Georgia, serif',
              fontSize: Math.round(size * 0.265),
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginTop: Math.round(size * 0.07),
              lineHeight: 1,
            }}
          >
            Risk Intelligence
          </div>
        </div>
      )}
    </div>
  )
}
