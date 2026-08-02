import { useState } from 'react'
import { Eye, EyeOff, ArrowRight, Moon, Sun, Check, X } from 'lucide-react'
import Logo from '../components/Logo'
import { authApi } from '../services/authApi'
import { useNotifications } from '../context/NotificationContext'

interface Props { onRegisterSuccess: () => void; isDark: boolean; onToggleDark: () => void }

export default function Register({ onRegisterSuccess, isDark, onToggleDark }: Props) {
  const [fullName, setFullName] = useState('')
  const [organization, setOrganization] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [loading, setLoading] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
      const username = email.split('@')[0]
      await authApi.register({
        email,
        username,
        full_name: fullName,
        organization,
        password
      })
      addNotification({
        category: 'general',
        priority: 'normal',
        title: 'Registration Successful',
        message: 'Please check your email to verify your account'
      })
      onRegisterSuccess()
    } catch (error) {
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'Registration Failed',
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
              Join the future<br />of API security.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              Get started with AI-powered risk analysis, real-time vulnerability detection, and automated remediation.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Free 14-day trial',
              'No credit card required',
              'Enterprise-grade security',
              '24/7 support included',
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

          <h2 className="text-[24px] font-700 tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Create account</h2>
          <p className="text-[14px] mt-1 mb-8" style={{ color: 'var(--text-secondary)' }}>Start your 14-day free trial</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-500 mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
              <input
                type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="User Name" required
                className="w-full px-4 py-3 text-[14px] rounded-[14px] border focus:outline-none transition-all"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label className="block text-[12px] font-500 mb-1.5" style={{ color: 'var(--text-secondary)' }}>Organization</label>
              <input
                type="text" value={organization} onChange={(e) => setOrganization(e.target.value)}
                placeholder="Your Company" required
                className="w-full px-4 py-3 text-[14px] rounded-[14px] border focus:outline-none transition-all"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

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

            <div>
              <label className="block text-[12px] font-500 mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
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
                        <Check size={12} style={{ color: 'var(--success)' }} />
                      ) : (
                        <X size={12} style={{ color: 'var(--text-muted)' }} />
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
                  Creating account...
                </span>
              ) : <><span>Create account</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-center text-[12px] mt-5" style={{ color: 'var(--text-muted)' }}>
            {"Already have an account? "}
            <button type="button" onClick={onRegisterSuccess} className="font-500" style={{ color: 'var(--brand)' }}>Sign in</button>
          </p>
        </div>
      </div>
    </div>
  )
}
