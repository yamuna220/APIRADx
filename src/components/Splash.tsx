import { useEffect, useState } from 'react'
import Logo from './Logo'

interface Props { onDone: () => void }

export default function Splash({ onDone }: Props) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1200)
    const doneTimer = setTimeout(() => onDone(), 1600)
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6"
      style={{
        background: 'var(--bg)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.4s ease',
        pointerEvents: 'none',
      }}
    >
      {/* Radial glow behind mark */}
      <div
        className="absolute"
        style={{
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--brand) 12%, transparent) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-5">
        <Logo size={64} showText={false} />

        <div style={{ textAlign: 'center', lineHeight: 1 }}>
          <div
            style={{
              fontFamily: 'Alegreya, Georgia, serif',
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
            }}
          >
            APIRA<span style={{ color: 'var(--brand)' }}>D</span>x
          </div>
          <div
            style={{
              fontFamily: 'Alegreya, Georgia, serif',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginTop: 6,
            }}
          >
            Risk Intelligence
          </div>
        </div>

        {/* Loading bar */}
        <div
          className="rounded-full overflow-hidden"
          style={{ width: 120, height: 2, background: 'var(--border)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: 'var(--brand)',
              animation: 'splashProgress 1.1s ease forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes splashProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}
