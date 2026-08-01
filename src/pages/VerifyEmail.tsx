import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Moon, Sun, RefreshCw } from 'lucide-react'
import Logo from '../components/Logo'
import { authApi } from '../services/authApi'
import { useNotifications } from '../context/NotificationContext'

interface Props { isDark: boolean; onToggleDark: () => void; onLogin: () => void }

export default function VerifyEmail({ isDark, onToggleDark, onLogin }: Props) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const { addNotification } = useNotifications()

  useEffect(() => {
    const verifyToken = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      
      if (!token) {
        setStatus('error')
        setMessage('Invalid verification link. No token provided.')
        return
      }

      try {
        const result = await authApi.verifyEmail(token)
        setStatus('success')
        setMessage('Your email has been verified successfully!')
        addNotification({
          category: 'general',
          priority: 'normal',
          title: 'Email Verified',
          message: result.message
        })
      } catch (error) {
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Failed to verify email. The link may be expired or invalid.')
        addNotification({
          category: 'general',
          priority: 'high',
          title: 'Verification Failed',
          message: error instanceof Error ? error.message : 'Please try again or request a new verification email'
        })
      }
    }

    verifyToken()
  }, [addNotification])

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-[54%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)' }}
      >
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(var(--brand) 1px, transparent 1px), linear-gradient(90deg, var(--brand) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
        {/* Warm glow */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, color-mix(in srgb, var(--brand) 10%, transparent) 0%, transparent 70%)',
        }} />

        {/* Toggle dark mode */}
        <button onClick={onToggleDark}
          className="absolute top-6 right-6 p-2 rounded-[10px] z-20 transition-colors"
          style={{ color: 'var(--text-muted)', background: 'var(--card)' }}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="relative z-10">
          <Logo size={38} showText={true} />
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-[42px] font-800 leading-[1.1] tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>
              Verify your<br />email address.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              Confirming your email helps us secure your account and ensure you receive important security notifications.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Enhanced account security',
              'Important security alerts',
              'Feature updates and news',
              'Password reset capabilities',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--success) 35%, transparent)' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[12px]" style={{ color: 'var(--text-muted)' }}>© 2026 APIRADx. All rights reserved.</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[360px]">
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <Logo size={30} showText={true} />
            <button onClick={onToggleDark} className="p-2 rounded-[10px] transition-colors" style={{ color: 'var(--text-muted)', background: 'var(--card)' }}>
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

          {status === 'loading' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }} />
              <h2 className="text-[24px] font-700 tracking-tight mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Verifying...</h2>
              <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>Please wait while we verify your email</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--success) 35%, transparent)' }}>
                <CheckCircle size={40} style={{ color: 'var(--success)' }} />
              </div>
              <h2 className="text-[28px] font-700 tracking-tight mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Email Verified!</h2>
              <p className="text-[15px] mb-8" style={{ color: 'var(--text-secondary)' }}>
                {message}
              </p>
              <button
                onClick={onLogin}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] text-[14px] font-600 transition-colors"
                style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--brand-hover)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--brand)'}
              >
                Continue to sign in
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'color-mix(in srgb, var(--error) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--error) 35%, transparent)' }}>
                <XCircle size={40} style={{ color: 'var(--error)' }} />
              </div>
              <h2 className="text-[28px] font-700 tracking-tight mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Verification Failed</h2>
              <p className="text-[15px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                {message}
              </p>
              <p className="text-[12px] mb-8" style={{ color: 'var(--text-muted)' }}>
                The verification link may have expired. Please request a new verification email from the sign-in page.
              </p>
              <button
                onClick={onLogin}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] text-[14px] font-600 transition-colors"
                style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--brand-hover)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--brand)'}
              >
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
