import { useState, useEffect } from 'react'
import { Users, Key, Shield, Bell, Globe, Moon, Sun, RefreshCw, AlertCircle, User, Palette, CreditCard, Loader2, Plus, Trash2, Eye, EyeOff, Copy } from 'lucide-react'
import { settingsService } from '../services/settingsService'
import { useNotifications } from '../context/NotificationContext'

type Tab = 'workspace' | 'team' | 'notifications' | 'security' | 'api-keys' | 'theme' | 'billing'

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18 }

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'workspace', label: 'Workspace', icon: User },
  { id: 'team', label: 'Team Members', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="relative w-9 h-5 rounded-full transition-colors focus:outline-none"
      style={{ background: checked ? 'var(--brand)' : 'var(--border)' }}
    >
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  )
}

function Field({ label, value, type = 'text', onChange }: { label: string; value: string; type?: string; onChange?: (value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input 
        type={type} 
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-full px-4 py-2.5 text-[13px] rounded-[12px] border focus:outline-none transition-colors"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
      />
    </div>
  )
}

function WorkspaceTab() {
  const { addNotification } = useNotifications()
  const [workspaceName, setWorkspaceName] = useState(() => {
    const saved = localStorage.getItem('apiradx-workspace-name')
    return saved || 'Acme Corp'
  })
  const [organization, setOrganization] = useState(() => {
    const saved = localStorage.getItem('apiradx-organization')
    return saved || 'Acme Corporation'
  })
  const [description, setDescription] = useState(() => {
    const saved = localStorage.getItem('apiradx-description')
    return saved || 'Enterprise API security management'
  })
  const [timezone, setTimezone] = useState(() => {
    const saved = localStorage.getItem('apiradx-timezone')
    return saved || 'UTC'
  })
  const [defaultTheme, setDefaultTheme] = useState(() => {
    const saved = localStorage.getItem('apiradx-default-theme')
    return saved || 'light'
  })
  const [smtpHost, setSmtpHost] = useState(() => {
    const saved = localStorage.getItem('apiradx-smtp-host')
    return saved || ''
  })
  const [smtpPort, setSmtpPort] = useState(() => {
    const saved = localStorage.getItem('apiradx-smtp-port')
    return saved || '587'
  })
  const [smtpUser, setSmtpUser] = useState(() => {
    const saved = localStorage.getItem('apiradx-smtp-user')
    return saved || ''
  })
  const [riskThreshold, setRiskThreshold] = useState(() => {
    const saved = localStorage.getItem('apiradx-risk-threshold')
    return saved || 'high'
  })
  const [apiRetention, setApiRetention] = useState(() => {
    const saved = localStorage.getItem('apiradx-api-retention')
    return saved || '90'
  })
  const [allowedFileTypes, setAllowedFileTypes] = useState(() => {
    const saved = localStorage.getItem('apiradx-allowed-file-types')
    return saved || '.json,.yaml,.yml,.openapi'
  })
  const [maxUploadSize, setMaxUploadSize] = useState(() => {
    const saved = localStorage.getItem('apiradx-max-upload-size')
    return saved || '10'
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Track unsaved changes
  useEffect(() => {
    const savedWorkspaceName = localStorage.getItem('apiradx-workspace-name') || 'Acme Corp'
    const savedOrganization = localStorage.getItem('apiradx-organization') || 'Acme Corporation'
    const savedDescription = localStorage.getItem('apiradx-description') || 'Enterprise API security management'
    const savedTimezone = localStorage.getItem('apiradx-timezone') || 'UTC'
    const savedDefaultTheme = localStorage.getItem('apiradx-default-theme') || 'light'
    const savedSmtpHost = localStorage.getItem('apiradx-smtp-host') || ''
    const savedSmtpPort = localStorage.getItem('apiradx-smtp-port') || '587'
    const savedSmtpUser = localStorage.getItem('apiradx-smtp-user') || ''
    const savedRiskThreshold = localStorage.getItem('apiradx-risk-threshold') || 'high'
    const savedApiRetention = localStorage.getItem('apiradx-api-retention') || '90'
    const savedAllowedFileTypes = localStorage.getItem('apiradx-allowed-file-types') || '.json,.yaml,.yml,.openapi'
    const savedMaxUploadSize = localStorage.getItem('apiradx-max-upload-size') || '10'

    const isDirty = 
      workspaceName !== savedWorkspaceName ||
      organization !== savedOrganization ||
      description !== savedDescription ||
      timezone !== savedTimezone ||
      defaultTheme !== savedDefaultTheme ||
      smtpHost !== savedSmtpHost ||
      smtpPort !== savedSmtpPort ||
      smtpUser !== savedSmtpUser ||
      riskThreshold !== savedRiskThreshold ||
      apiRetention !== savedApiRetention ||
      allowedFileTypes !== savedAllowedFileTypes ||
      maxUploadSize !== savedMaxUploadSize

    setHasUnsavedChanges(isDirty)

    // Warn before leaving with unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [workspaceName, organization, description, timezone, defaultTheme, smtpHost, smtpPort, smtpUser, riskThreshold, apiRetention, allowedFileTypes, maxUploadSize])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!workspaceName.trim()) {
      newErrors.workspaceName = 'Workspace name is required'
    }
    if (!organization.trim()) {
      newErrors.organization = 'Organization is required'
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (smtpHost && !smtpHost.includes('.')) {
      newErrors.smtpHost = 'Invalid SMTP host'
    }
    if (smtpPort && (isNaN(parseInt(smtpPort)) || parseInt(smtpPort) < 1 || parseInt(smtpPort) > 65535)) {
      newErrors.smtpPort = 'Valid port number required (1-65535)'
    }
    if (apiRetention && (isNaN(parseInt(apiRetention)) || parseInt(apiRetention) < 1)) {
      newErrors.apiRetention = 'Must be a positive number'
    }
    if (maxUploadSize && (isNaN(parseInt(maxUploadSize)) || parseInt(maxUploadSize) < 1)) {
      newErrors.maxUploadSize = 'Must be a positive number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      return
    }

    setSaving(true)
    setErrors({})

    try {
      // Simulate backend API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Save to local storage
      localStorage.setItem('apiradx-workspace-name', workspaceName)
      localStorage.setItem('apiradx-organization', organization)
      localStorage.setItem('apiradx-description', description)
      localStorage.setItem('apiradx-timezone', timezone)
      localStorage.setItem('apiradx-default-theme', defaultTheme)
      localStorage.setItem('apiradx-smtp-host', smtpHost)
      localStorage.setItem('apiradx-smtp-port', smtpPort)
      localStorage.setItem('apiradx-smtp-user', smtpUser)
      localStorage.setItem('apiradx-risk-threshold', riskThreshold)
      localStorage.setItem('apiradx-api-retention', apiRetention)
      localStorage.setItem('apiradx-allowed-file-types', allowedFileTypes)
      localStorage.setItem('apiradx-max-upload-size', maxUploadSize)

      // Log audit entry
      const auditLog = JSON.parse(localStorage.getItem('apiradx-audit-log') || '[]')
      auditLog.push({
        action: 'workspace_updated',
        user: 'current_user',
        timestamp: new Date().toISOString(),
        changedFields: ['workspace settings']
      })
      localStorage.setItem('apiradx-audit-log', JSON.stringify(auditLog))

      setSaving(false)
      setHasUnsavedChanges(false)
      
      addNotification({
        category: 'general',
        priority: 'normal',
        title: 'Settings Saved',
        message: 'Workspace settings updated successfully'
      })
    } catch (error) {
      setSaving(false)
      setErrors({ general: 'Failed to save settings. Please try again.' })
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'Save Failed',
        message: 'Failed to save workspace settings'
      })
    }
  }

  return (
    <div className="space-y-4">
      <div style={card} className="p-5">
        <h3 className="text-[13px] font-600 mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Workspace Settings</h3>
        
        {errors.general && (
          <div className="mb-4 p-3 rounded-[8px]" style={{ background: 'color-mix(in srgb, var(--error) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--error) 22%, transparent)' }}>
            <p className="text-[11px]" style={{ color: 'var(--error)' }}>{errors.general}</p>
          </div>
        )}

        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-[12px] flex items-center justify-center text-[22px] font-800" style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}>A</div>
          <div>
            <button className="text-[12px] font-500" style={{ color: 'var(--brand)' }}>Change logo</button>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>PNG, max 2MB</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Workspace Name" value={workspaceName} onChange={setWorkspaceName} />
          <Field label="Organization" value={organization} onChange={setOrganization} />
          <Field label="Timezone" value={timezone} onChange={setTimezone} />
          <div>
            <label className="block text-[11px] font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Default Theme</label>
            <select
              value={defaultTheme}
              onChange={(e) => setDefaultTheme(e.target.value)}
              className="w-full px-4 py-2.5 text-[13px] rounded-[12px] border focus:outline-none transition-colors"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <Field label="Description" value={description} onChange={setDescription} />
        </div>

        <div className="mt-6">
          <h4 className="text-[12px] font-600 mb-3" style={{ color: 'var(--text-primary)' }}>SMTP Settings</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="SMTP Host" value={smtpHost} onChange={setSmtpHost} />
            <Field label="SMTP Port" value={smtpPort} onChange={setSmtpPort} />
            <Field label="SMTP Username" value={smtpUser} onChange={setSmtpUser} />
            <Field label="SMTP Password" value="" onChange={() => {}} type="password" />
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-[12px] font-600 mb-3" style={{ color: 'var(--text-primary)' }}>Security & Retention</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Default Risk Threshold</label>
              <select
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(e.target.value)}
                className="w-full px-4 py-2.5 text-[13px] rounded-[12px] border focus:outline-none transition-colors"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <Field label="API Retention Period (days)" value={apiRetention} onChange={setApiRetention} />
            <Field label="Allowed File Types" value={allowedFileTypes} onChange={setAllowedFileTypes} />
            <Field label="Max Upload Size (MB)" value={maxUploadSize} onChange={setMaxUploadSize} />
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-[12px] font-600 mb-3" style={{ color: 'var(--text-primary)' }}>Notification Preferences</h4>
          <div className="space-y-2">
            {[
              { key: 'email', label: 'Email notifications', desc: 'Receive security alerts via email' },
              { key: 'slack', label: 'Slack integration', desc: 'Send alerts to Slack channel' },
              { key: 'webhook', label: 'Webhook notifications', desc: 'POST alerts to custom endpoint' },
            ].map((pref) => (
              <div key={pref.key} className="flex items-center justify-between p-3 rounded-[8px]" style={{ background: 'var(--bg-secondary)' }}>
                <div>
                  <div className="text-[12px] font-500" style={{ color: 'var(--text-primary)' }}>{pref.label}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{pref.desc}</div>
                </div>
                <Toggle checked={true} onChange={() => {}} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-500 transition-colors disabled:opacity-50"
            style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
            onMouseEnter={(e) => { if (!saving) (e.currentTarget as HTMLElement).style.background = 'var(--brand-hover)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--brand)' }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TeamTab() {
  const { addNotification } = useNotifications()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('apiradx-team-members')
    if (saved) {
      return JSON.parse(saved)
    }
    return [
      { name: 'Jordan Smith', email: 'jordan@acme.com', role: 'Owner', initials: 'JS', color: 'var(--brand)' },
      { name: 'Alex Chen', email: 'alex@acme.com', role: 'Admin', initials: 'AC', color: 'var(--info)' },
      { name: 'Sarah Miller', email: 'sarah@acme.com', role: 'Member', initials: 'SM', color: 'var(--success)' },
    ]
  })

  useEffect(() => {
    localStorage.setItem('apiradx-team-members', JSON.stringify(members))
  }, [members])

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'Email Required',
        message: 'Please enter an email address to invite'
      })
      return
    }

    const newMember = {
      name: inviteEmail.split('@')[0].charAt(0).toUpperCase() + inviteEmail.split('@')[0].slice(1),
      email: inviteEmail,
      role: inviteRole.charAt(0).toUpperCase() + inviteRole.slice(1),
      initials: inviteEmail.split('@')[0].substring(0, 2).toUpperCase(),
      color: ['var(--brand)', 'var(--info)', 'var(--success)', '#A78BFA', 'var(--warning)'][members.length % 5]
    }

    setMembers([...members, newMember])
    setInviteEmail('')
    setShowInviteModal(false)
    addNotification({
      category: 'general',
      priority: 'normal',
      title: 'Invitation Sent',
      message: `Invitation sent to ${inviteEmail}`
    })
  }

  const handleRemoveMember = (email: string) => {
    setMembers(members.filter((m: any) => m.email !== email))
    addNotification({
      category: 'general',
      priority: 'normal',
      title: 'Member Removed',
      message: `Team member has been removed`
    })
  }

  return (
    <>
      <div style={{ ...card, overflow: 'hidden' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-[13px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Team Members</h3>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[12px] font-500 transition-colors"
            style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
          >
            <Plus size={13} /> Invite
          </button>
        </div>
        {members.map((m: any) => (
          <div key={m.email} className="flex items-center gap-4 px-5 py-4 border-b transition-colors" style={{ borderColor: 'var(--border-subtle)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--card-hover)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-700 flex-shrink-0" style={{ background: m.color, color: 'var(--brand-text)' }}>{m.initials}</div>
            <div className="flex-1">
              <div className="text-[13px] font-500" style={{ color: 'var(--text-primary)' }}>{m.name}</div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{m.email}</div>
            </div>
            <span className="text-[11px] font-500 px-2.5 py-1 rounded-[6px]" style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>{m.role}</span>
            <button 
              onClick={() => handleRemoveMember(m.email)}
              className="p-1.5 rounded-[5px] transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--error)'; (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--error) 14%, transparent)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            ><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div style={card} className="p-6 w-full max-w-md">
            <h3 className="text-[16px] font-600 mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Invite Team Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Email</label>
                <input 
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-4 py-2.5 text-[13px] rounded-[12px] border focus:outline-none transition-colors"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
              <div>
                <label className="block text-[11px] font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Role</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2.5 text-[13px] rounded-[12px] border focus:outline-none transition-colors"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-2.5 rounded-[10px] text-[13px] font-500 border transition-colors"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleInvite}
                className="flex-1 py-2.5 rounded-[10px] text-[13px] font-500 transition-colors"
                style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NotificationsTab() {
  const [s, setS] = useState(() => {
    const saved = localStorage.getItem('apiradx-notification-settings')
    if (saved) {
      return JSON.parse(saved)
    }
    return { crit: true, high: true, med: false, weekly: true, scan: true, email: true, slack: true }
  })

  useEffect(() => {
    localStorage.setItem('apiradx-notification-settings', JSON.stringify(s))
  }, [s])

  type Key = keyof typeof s
  const toggle = (k: Key) => setS((p: typeof s) => ({ ...p, [k]: !p[k] }))
  const rows: { key: Key; label: string; sub: string }[] = [
    { key: 'crit', label: 'Critical findings', sub: 'CVSS ≥ 9.0' },
    { key: 'high', label: 'High findings', sub: 'CVSS 7.0–8.9' },
    { key: 'med', label: 'Medium findings', sub: 'CVSS 4.0–6.9' },
    { key: 'weekly', label: 'Weekly digest', sub: 'Every Monday 9AM' },
    { key: 'scan', label: 'Scan completed', sub: 'Notify on finish' },
    { key: 'email', label: 'Email delivery', sub: 'jordan@acme.com' },
    { key: 'slack', label: 'Slack delivery', sub: '#security-alerts' },
  ]
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      {rows.map((r) => (
        <div key={r.key as string} className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <div className="text-[13px] font-500" style={{ color: 'var(--text-primary)' }}>{r.label}</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.sub}</div>
          </div>
          <Toggle checked={s[r.key]} onChange={() => toggle(r.key)} />
        </div>
      ))}
    </div>
  )
}

function SecurityTab() {
  const { addNotification } = useNotifications()
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('apiradx-security-settings')
    if (saved) {
      return JSON.parse(saved)
    }
    return {
      twoFactor: false,
      sso: true,
      ipAllowlist: false,
      sessionTimeout: true
    }
  })

  useEffect(() => {
    localStorage.setItem('apiradx-security-settings', JSON.stringify(settings))
  }, [settings])

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }))
    addNotification({
      category: 'general',
      priority: 'normal',
      title: 'Setting Updated',
      message: `${String(key)} has been ${!settings[key] ? 'enabled' : 'disabled'}`
    })
  }

  return (
    <div className="space-y-4">
      {[
        { key: 'twoFactor' as const, title: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account', action: 'Enable' },
        { key: 'sso' as const, title: 'SSO / SAML', desc: 'Connect your identity provider for single sign-on', action: 'Configure' },
        { key: 'ipAllowlist' as const, title: 'IP Allowlist', desc: 'Restrict dashboard access to specific IP ranges', action: 'Configure' },
        { key: 'sessionTimeout' as const, title: 'Session Timeout', desc: 'Automatically sign out after 4 hours of inactivity', action: 'Change' },
      ].map((item) => (
        <div key={item.title} style={card} className="flex items-center gap-4 p-5">
          <Shield size={18} style={{ color: settings[item.key] ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }} />
          <div className="flex-1">
            <div className="text-[13px] font-600" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
          </div>
          <button 
            onClick={() => handleToggle(item.key)}
            className="px-3 py-2 rounded-[8px] text-[12px] font-500 border transition-colors"
            style={{
              color: settings[item.key] ? 'var(--success)' : 'var(--text-secondary)',
              borderColor: settings[item.key] ? 'color-mix(in srgb, var(--success) 40%, transparent)' : 'var(--border)',
              background: settings[item.key] ? 'color-mix(in srgb, var(--success) 10%, transparent)' : 'transparent',
            }}
          >{settings[item.key] ? '✓ ' : ''}{item.action}</button>
        </div>
      ))}
    </div>
  )
}

function APIKeysTab() {
  const { addNotification } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [keys, setKeys] = useState<any[]>([])
  const [visible, setVisible] = useState<string | null>(null)
  const [showNewKeyModal, setShowNewKeyModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const data = await settingsService.getAPIKeys()
        setKeys(data)
      } catch (err) {
        console.error('Failed to load API keys:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const realKey = async (prefix: string) => {
    const key = await settingsService.getFullKey(prefix)
    return key
  }

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'Name Required',
        message: 'Please enter a name for the API key'
      })
      return
    }

    const newKey = {
      id: Date.now().toString(),
      name: newKeyName,
      prefix: 'apirx_' + Math.random().toString(36).substring(2, 10),
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUsed: 'Never'
    }

    setKeys([...keys, newKey])
    setNewKeyName('')
    setShowNewKeyModal(false)
    addNotification({
      category: 'general',
      priority: 'normal',
      title: 'API Key Created',
      message: `New API key "${newKeyName}" has been created`
    })
  }

  const handleDeleteKey = (id: string) => {
    setKeys(keys.filter(k => k.id !== id))
    addNotification({
      category: 'general',
      priority: 'normal',
      title: 'API Key Deleted',
      message: 'API key has been deleted'
    })
  }

  const handleCopyKey = async (prefix: string) => {
    const key = await realKey(prefix)
    navigator.clipboard.writeText(key)
    addNotification({
      category: 'general',
      priority: 'normal',
      title: 'Copied to Clipboard',
      message: 'API key has been copied to clipboard'
    })
  }

  return (
    <>
      <div className="space-y-4">
        <div style={{ ...card, overflow: 'hidden' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-[13px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>API Keys</h3>
            <button 
              onClick={() => setShowNewKeyModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[12px] font-500 transition-colors"
              style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
            >
              <Plus size={13} /> New key
            </button>
          </div>
          {keys.map((k) => {
            const show = visible === k.id
            return (
              <div key={k.id} className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-500" style={{ color: 'var(--text-primary)' }}>{k.name}</span>
                      <span className="text-[9px] font-600 px-1.5 py-0.5 rounded-full" style={{ color: 'var(--success)', background: 'color-mix(in srgb, var(--success) 14%, transparent)' }}>Active</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-[11px] font-mono p-2 rounded-[6px] flex-1 min-w-0 truncate" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        {show ? realKey(k.prefix) : k.prefix + '•'.repeat(32)}
                      </code>
                      <button 
                        onClick={() => setVisible(show ? null : k.id)} 
                        className="p-1.5 transition-colors" 
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
                      >{show ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                      <button 
                        onClick={() => handleCopyKey(k.prefix)}
                        className="p-1.5 transition-colors" 
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
                      ><Copy size={13} /></button>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Created {k.created}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Last used {k.lastUsed}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteKey(k.id)}
                    className="p-1.5 rounded-[5px] transition-colors flex-shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--error)'; (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--error) 14%, transparent)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  ><Trash2 size={14} /></button>
                </div>
              </div>
            )
          })}
        </div>
        <div className="p-4 rounded-[12px] border flex items-start gap-3" style={{ background: 'color-mix(in srgb, var(--warning) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--warning) 30%, transparent)' }}>
          <Shield size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--warning)' }} />
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Treat API keys like passwords. Rotate immediately if compromised. Never expose in client-side code.</p>
        </div>
      </div>

      {showNewKeyModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div style={card} className="p-6 w-full max-w-md">
            <h3 className="text-[16px] font-600 mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Create New API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Key Name</label>
                <input 
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                  className="w-full px-4 py-2.5 text-[13px] rounded-[12px] border focus:outline-none transition-colors"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowNewKeyModal(false)}
                className="flex-1 py-2.5 rounded-[10px] text-[13px] font-500 border transition-colors"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateKey}
                className="flex-1 py-2.5 rounded-[10px] text-[13px] font-500 transition-colors"
                style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
              >
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ThemeTab() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('light')
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable')
  return (
    <div className="space-y-4">
      <div style={card} className="p-5">
        <h3 className="text-[13px] font-600 mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Appearance</h3>
        <div className="grid grid-cols-3 gap-3">
          {(['dark', 'light', 'system'] as const).map((t) => (
            <button key={t} onClick={() => setTheme(t)}
              className="p-4 rounded-[12px] border-2 text-left transition-all"
              style={{ background: 'var(--bg-secondary)', borderColor: theme === t ? 'var(--brand)' : 'var(--border)' }}
            >
              <div className="w-full h-10 rounded-[6px] mb-2.5 border" style={{ background: t === 'dark' ? '#18140F' : t === 'light' ? '#FFF6EA' : 'linear-gradient(135deg, #18140F 50%, #FFF6EA 50%)', borderColor: 'var(--border)' }} />
              <div className="text-[11px] font-500 capitalize" style={{ color: theme === t ? 'var(--brand)' : 'var(--text-secondary)' }}>{t}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={card} className="p-5">
        <h3 className="text-[13px] font-600 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Display Density</h3>
        <div className="flex gap-3">
          {(['compact', 'comfortable', 'spacious'] as const).map((d) => (
            <button key={d} onClick={() => setDensity(d)}
              className="flex-1 py-2.5 px-3 rounded-[10px] border-2 text-[12px] font-500 capitalize transition-all"
              style={{
                borderColor: density === d ? 'var(--brand)' : 'var(--border)',
                color: density === d ? 'var(--brand)' : 'var(--text-secondary)',
                background: density === d ? 'color-mix(in srgb, var(--brand) 10%, transparent)' : 'transparent',
              }}
            >{d}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

function BillingTab() {
  return (
    <div className="space-y-4">
      <div style={card} className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[13px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Enterprise Plan</h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Billed annually</p>
          </div>
          <div className="text-right">
            <div className="text-[26px] font-800" style={{ color: 'var(--text-primary)' }}>$2,400</div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>/month</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4" style={{ borderColor: 'var(--border)' }}>
          {[['API Scans', 'Unlimited'], ['Team Members', '25 seats'], ['Retention', '2 years']].map(([l, v]) => (
            <div key={l}>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{l}</div>
              <div className="text-[13px] font-600 mt-0.5" style={{ color: 'var(--text-primary)' }}>{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 rounded-[8px] text-[13px] font-500 border transition-colors" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>Manage plan</button>
          <button className="px-4 py-2 rounded-[8px] text-[13px] font-500 transition-colors" style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}>Download invoice</button>
        </div>
      </div>
      <div style={card} className="p-5">
        <h3 className="text-[13px] font-600 mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Payment Method</h3>
        <div className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: 'var(--bg-secondary)' }}>
          <CreditCard size={16} style={{ color: 'var(--text-muted)' }} />
          <div>
            <div className="text-[12px] font-500" style={{ color: 'var(--text-primary)' }}>Visa ending in 4242</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Expires 12/27</div>
          </div>
          <button className="ml-auto text-[11px] font-500" style={{ color: 'var(--brand)' }}>Update</button>
        </div>
      </div>
    </div>
  )
}

const tabContent: Record<Tab, React.ComponentType> = {
  workspace: WorkspaceTab, team: TeamTab, notifications: NotificationsTab,
  security: SecurityTab, 'api-keys': APIKeysTab, theme: ThemeTab, billing: BillingTab,
}

export default function Settings() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<Tab>('workspace')
  const Content = tabContent[active]

  if (loading) {
    return (
      <div className="p-6 space-y-5 max-w-[1400px]">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--brand)' }} />
            <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-5 max-w-[1400px]">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle size={32} style={{ color: 'var(--error)' }} />
            <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-[12px] text-[13px] font-500 transition-colors"
              style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1000px]">
      <div className="mb-6">
        <h1 className="text-[22px] font-700 tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Settings</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>Manage your workspace, team, and preferences.</p>
      </div>
      <div className="flex gap-6">
        <nav className="w-52 flex-shrink-0 space-y-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = active === tab.id
            return (
              <button key={tab.id} onClick={() => setActive(tab.id)}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-[10px] text-left transition-all"
                style={{ background: isActive ? 'color-mix(in srgb, var(--brand) 14%, transparent)' : 'transparent', color: isActive ? 'var(--brand)' : 'var(--text-secondary)' }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)' }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <Icon size={14} />
                <span className="text-[13px] font-500">{tab.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="flex-1 min-w-0"><Content /></div>
      </div>
    </div>
  )
}
