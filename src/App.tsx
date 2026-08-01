import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import VerifyEmail from './pages/VerifyEmail'
import ResetPassword from './pages/ResetPassword'
import Shell from './components/Shell'
import Splash from './components/Splash'
import { ErrorBoundary } from './components/ErrorBoundary'
import { UploadProvider } from './context/UploadContext'
import { WorkspaceProvider } from './context/WorkspaceContext'
import { NotificationProvider } from './context/NotificationContext'
import { UserProvider } from './context/UserContext'

export type Page =
  | 'dashboard'
  | 'api-inventory'
  | 'upload-apis'
  | 'security-analysis'
  | 'dependency-graph'
  | 'risk-assessment'
  | 'ai-recommendations'
  | 'impact-prediction'
  | 'reports'
  | 'report-viewer'
  | 'settings'

export type AuthPage = 'login' | 'register' | 'forgot-password' | 'verify-email' | 'reset-password'

export default function App() {
  const [splashed, setSplashed] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [authPage, setAuthPage] = useState<AuthPage>('login')
  const [page, setPage] = useState<Page>('dashboard')
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('apiradx-theme')
    return stored ? stored === 'dark' : false
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('apiradx-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const handleNavigateAuth = (newAuthPage: AuthPage) => {
    setAuthPage(newAuthPage)
  }

  return (
    <ErrorBoundary>
      <WorkspaceProvider>
        <NotificationProvider>
          <UserProvider>
            <UploadProvider>
              {!splashed && <Splash onDone={() => setSplashed(true)} />}
              {!authed ? (
                <>
                  {authPage === 'login' && (
                    <Login 
                      onLogin={() => setAuthed(true)} 
                      isDark={isDark} 
                      onToggleDark={() => setIsDark(!isDark)} 
                      onNavigate={handleNavigateAuth}
                    />
                  )}
                  {authPage === 'register' && (
                    <Register 
                      onRegisterSuccess={() => setAuthPage('login')} 
                      isDark={isDark} 
                      onToggleDark={() => setIsDark(!isDark)} 
                    />
                  )}
                  {authPage === 'forgot-password' && (
                    <ForgotPassword 
                      onBack={() => setAuthPage('login')} 
                      isDark={isDark} 
                      onToggleDark={() => setIsDark(!isDark)} 
                    />
                  )}
                  {authPage === 'verify-email' && (
                    <VerifyEmail 
                      isDark={isDark} 
                      onToggleDark={() => setIsDark(!isDark)} 
                      onLogin={() => setAuthPage('login')} 
                    />
                  )}
                  {authPage === 'reset-password' && (
                    <ResetPassword 
                      isDark={isDark} 
                      onToggleDark={() => setIsDark(!isDark)} 
                      onLogin={() => setAuthPage('login')} 
                    />
                  )}
                </>
              ) : (
                <Shell page={page} onNavigate={setPage} isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />
              )}
            </UploadProvider>
          </UserProvider>
        </NotificationProvider>
      </WorkspaceProvider>
    </ErrorBoundary>
  )
}
