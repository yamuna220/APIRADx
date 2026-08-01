import { useState, useEffect } from 'react'
import { Eye, EyeOff, CheckCircle, XCircle, Moon, Sun, ArrowLeft } from 'lucide-react'
import Logo from '../components/Logo'
import { authApi } from '../services/authApi'
import { useNotifications } from '../context/NotificationContext'

interface Props { isDark: boolean; onToggleDark: () => void; onLogin: () => void }

export default function ResetPassword({ isDark, onToggleDark, onLogin }: Props) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<'input' | 'success' | 'error'>('input')
  const [message, setMessage] = useState('')
  const { addNotification } = useNotifications()

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
    { label: 'Special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]

  const isPasswordValid = passwordRequirements.every(req => req.met)
  const passwordsMatch = password === confirmPassword && password !== ''

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const resetToken = urlParams.get('token')
    if (resetToken) {
      setToken(resetToken)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      setStatus('error')
      setMessage('Invalid reset link. No token provided.')
      return
    }

    if (!isPasswordValid) {
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'Invalid Password',
        message: 'Please meet all password requirements'
      })
      return
    }

    if (!passwordsMatch) {
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'Passwords Do Not Match',
        message: 'Please ensure both passwords are identical'
      })
      return
    }

    setLoading(true)

    try {
      await authApi.resetPassword({
        token,
        new_password: password,
        confirm_password: confirmPassword
      })
      setStatus('success')
      setMessage('Your password has been reset successfully!')
      addNotification({
        category: 'general',
        priority: 'normal',
        title: 'Password Reset',
        message: 'Your password has been updated. Please sign in with your new password.'
      })
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Failed to reset password. The link may be expired or invalid.')
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'Reset Failed',
        message: error instanceof Error ? error.message : 'Please request a new password reset link'
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
              Set a new<br />password.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              Choose a strong password to protect your account. Your new password should be different from your previous passwords.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Minimum 8 characters',
              'Mix of letters and numbers',
              'Special characters recommended',
              'Unique from previous passwords',
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
          {status === 'input' && (
            <>
              <button onClick={onLogin} className="flex items-center gap-2 text-[12px] font-500 mb-6 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <ArrowLeft size={14} /> Back to sign in
              </button>

              <div className="flex items-center justify-between mb-8 lg:hidden">
                <Logo size={30} showText={true} />
                <button onClick={onToggleDark} className="p-2 rounded-[10px] transition-colors" style={{ color: 'var(--text-muted)', background: 'var(--card)' }}>
                  {isDark ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              </div>

              <h2 className="text-[24px] font-700 tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>New password</h2>
              <p className="text-[14px] mt-1 mb-8" style={{ color: 'var(--text-secondary)' }}>Enter your new password below</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-500 mb-1.5" style={{ color: 'var(--text-secondary)' }}>New Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" required
                      className="w-full px-4 py-3 pr-11 text-[14px] rounded-[14px] border focus:outline-none transition-all"
                      style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 space-y-1">
                      {passwordRequirements.map((req, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {req.met ? (
                            <CheckCircle size={12} style={{ color: 'var(--success)' }} />
                          ) : (
                            <XCircle size={12} style={{ color: 'var(--text-muted)' }} />
                          )}
                          <span className="text-[11px]" style={{ color: req.met ? 'var(--success)' : 'var(--text-muted)' }}>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-500 mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••" required
                      className="w-full px-4 py-3 pr-11 text-[14px] rounded-[14px] border focus:outline-none transition-all"
                      style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                    />
                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-[11px] mt-1" style={{ color: 'var(--error)' }}>Passwords do not match</p>
                  )}
                </div>

                <button type="submit" disabled={loading || !isPasswordValid || !passwordsMatch}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] text-[14px] font-600 transition-colors disabled:opacity-60"
                  style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
                  onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--brand-hover)' }}
                  onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--brand)' }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </span>
                  ) : 'Reset password'}
                </button>
              </form>
            </>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--success) 35%, transparent)' }}>
                <CheckCircle size={40} style={{ color: 'var(--success)' }} />
              </div>
              <h2 className="text-[28px] font-700 tracking-tight mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Password Reset!</h2>
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
                Sign in with new password
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'color-mix(in srgb, var(--error) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--error) 35%, transparent)' }}>
                <XCircle size={40} style={{ color: 'var(--error)' }} />
              </div>
              <h2 className="text-[28px] font-700 tracking-tight mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Reset Failed</h2>
              <p className="text-[15px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                {message}
              </p>
              <p className="text-[12px] mb-8" style={{ color: 'var(--text-muted)' }}>
                The reset link may have expired. Please request a new password reset link.
              </p>
              <button
                onClick={onLogin}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] text-[14px] font-600 transition-colors"
                style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--brand-hover)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--brand)'}
              >
                Request new reset link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
