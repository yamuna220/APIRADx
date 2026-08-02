import { useState } from 'react'
import { ArrowLeft, Moon, Sun, Mail } from 'lucide-react'
import Logo from '../components/Logo'
import { authApi } from '../services/authApi'
import { useNotifications } from '../context/NotificationContext'

interface Props { onBack: () => void; isDark: boolean; onToggleDark: () => void }

export default function ForgotPassword({ onBack, isDark, onToggleDark }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { addNotification } = useNotifications()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await authApi.forgotPassword({ email })
      setSent(true)
      addNotification({
        category: 'general',
        priority: 'normal',
        title: 'Reset Email Sent',
        message: 'If an account exists with this email, a password reset link has been sent'
      })
    } catch (error) {
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'Request Failed',
        message: error instanceof Error ? error.message : 'Please try again later'
      })
    } finally {
      setLoading(false)
    }
  }

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
              Reset your<br />password.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              We'll send you a secure link to reset your password. The link will expire in 30 minutes for your security.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Secure password reset via email',
              '30-minute link expiration',
              'No account lockout',
              'Continue working while resetting',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--info) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--info) 35%, transparent)' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="var(--info)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
          <button onClick={onBack} className="flex items-center gap-2 text-[12px] font-500 mb-6 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={14} /> Back to sign in
          </button>

          <div className="flex items-center justify-between mb-8 lg:hidden">
            <Logo size={30} showText={true} />
            <button onClick={onToggleDark} className="p-2 rounded-[10px] transition-colors" style={{ color: 'var(--text-muted)', background: 'var(--card)' }}>
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

          {!sent ? (
            <>
              <h2 className="text-[24px] font-700 tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Forgot password?</h2>
              <p className="text-[14px] mt-1 mb-8" style={{ color: 'var(--text-secondary)' }}>Enter your email to receive a reset link</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-500 mb-1.5" style={{ color: 'var(--text-secondary)' }}>Work Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com" required
                    className="w-full px-4 py-3 text-[14px] rounded-[14px] border focus:outline-none transition-all"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>

                <button type="submit" disabled={loading}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] text-[14px] font-600 transition-colors disabled:opacity-60"
                  style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
                  onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--brand-hover)' }}
                  onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--brand)' }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : <><span>Send reset link</span><Mail size={15} /></>}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--success) 35%, transparent)' }}>
                <Mail size={32} style={{ color: 'var(--success)' }} />
              </div>
              <h2 className="text-[24px] font-700 tracking-tight mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Check your email</h2>
              <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
                We've sent a password reset link to <span className="font-500" style={{ color: 'var(--text-primary)' }}>{email}</span>
              </p>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                The link will expire in 30 minutes. If you don't see the email, check your spam folder.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="mt-6 text-[12px] font-500 transition-colors"
                style={{ color: 'var(--brand)' }}
              >
                Send another link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
