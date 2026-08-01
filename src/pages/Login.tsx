import { useState } from 'react'
import { Eye, EyeOff, ArrowRight, Moon, Sun } from 'lucide-react'
import Logo from '../components/Logo'
import { authApi } from '../services/authApi'
import { useNotifications } from '../context/NotificationContext'
import type { AuthPage } from '../App'

interface Props { onLogin: () => void; isDark: boolean; onToggleDark: () => void; onNavigate: (page: AuthPage) => void }

export default function Login({ onLogin, isDark, onToggleDark, onNavigate }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addNotification } = useNotifications()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await authApi.login(email, password)
      addNotification({
        category: 'general',
        priority: 'normal',
        title: 'Login Successful',
        message: 'Welcome back to APIRADx'
      })
      onLogin()
    } catch (error) {
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'Login Failed',
        message: error instanceof Error ? error.message : 'Please check your credentials and try again'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    onNavigate('forgot-password')
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
              Secure your<br />API surface.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              AI-powered risk analysis, real-time vulnerability detection, and automated remediation for your entire API ecosystem.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Parse OpenAPI & Swagger specs automatically',
              'Detect OWASP API Security Top 10 risks',
              'Visualize API dependency chains',
              'Predict downstream impact of changes',
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

          <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex -space-x-2">
              {['#5A4A33', '#7A674C', '#2E7D32', '#D97706'].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-700"
                  style={{ backgroundColor: c, borderColor: 'var(--sidebar-bg)', color: '#FFF6EA' }}>
                  {['AB', 'CK', 'ML', 'SR'][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="text-[13px] font-500" style={{ color: 'var(--text-primary)' }}>Trusted by 2,400+ security teams</div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>across 68 countries</div>
            </div>
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

          <h2 className="text-[24px] font-700 tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Welcome back</h2>
          <p className="text-[14px] mt-1 mb-8" style={{ color: 'var(--text-secondary)' }}>Sign in to your security dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-500 mb-1.5" style={{ color: 'var(--text-secondary)' }}>Work email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan@company.com" required
                className="w-full px-4 py-3 text-[14px] rounded-[14px] border focus:outline-none transition-all"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-500" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <button type="button" onClick={handleForgotPassword} className="text-[12px] font-400" style={{ color: 'var(--brand)' }}>Forgot password?</button>
              </div>
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
                  Signing in...
                </span>
              ) : <><span>Sign in</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="mt-5 p-3.5 rounded-[12px] border text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Demo: use any email and password to sign in</p>
          </div>

          <p className="text-center text-[12px] mt-5" style={{ color: 'var(--text-muted)' }}>
            {"Don't have an account? "}
            <button type="button" onClick={() => onNavigate('register')} className="font-500" style={{ color: 'var(--brand)' }}>Request access</button>
          </p>
        </div>
      </div>
    </div>
  )
}
