import { useState, useRef, useEffect } from 'react'
import { Search, Bell, Moon, Sun, Upload, ChevronDown, Plus, Settings, Users, LogOut, User, Check, Trash2, X, Key, Activity, HelpCircle, CreditCard } from 'lucide-react'
import type { Page } from '../App'
import { useWorkspaces } from '../context/WorkspaceContext'
import { useNotifications } from '../context/NotificationContext'
import { useUser } from '../context/UserContext'

function formatTimeAgo(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diff = now - then
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

interface Props {
  onNavigate: (p: Page) => void
  isDark: boolean
  onToggleDark: () => void
  onOpenCmd: () => void
}

export default function TopNav({ onNavigate, isDark, onToggleDark, onOpenCmd }: Props) {
  const { 
    currentWorkspace, 
    workspaces, 
    setCurrentWorkspace, 
    createWorkspace,
    getRecentWorkspaces,
    isWorkspaceDropdownOpen,
    setWorkspaceDropdownOpen
  } = useWorkspaces()
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isNotificationDropdownOpen,
    setNotificationDropdownOpen
  } = useNotifications()
  
  const { user, logout, isProfileDropdownOpen, setProfileDropdownOpen, isLoading } = useUser()
  
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceColor, setNewWorkspaceColor] = useState('#3B82F6')
  const workspaceRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  
  const recentWorkspaces = getRecentWorkspaces()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setWorkspaceDropdownOpen(false)
        setShowCreateWorkspace(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationDropdownOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setWorkspaceDropdownOpen, setNotificationDropdownOpen, setProfileDropdownOpen])

  const handleCreateWorkspace = () => {
    if (newWorkspaceName.trim()) {
      createWorkspace({ name: newWorkspaceName.trim(), color: newWorkspaceColor })
      setNewWorkspaceName('')
      setNewWorkspaceColor('#3B82F6')
      setShowCreateWorkspace(false)
      setWorkspaceDropdownOpen(false)
    }
  }

  const handleSwitchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId)
    if (workspace) {
      setCurrentWorkspace(workspace)
      setWorkspaceDropdownOpen(false)
    }
  }

  return (
    <header
      className="flex items-center gap-4 px-6 border-b flex-shrink-0"
      style={{ height: 60, background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}
    >
      {/* Search / Cmd palette trigger */}
      <div className="flex-1 max-w-sm">
        <button onClick={onOpenCmd}
          className="w-full flex items-center gap-2 pl-3 pr-3 py-2 rounded-[10px] border text-left transition-colors"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
        >
          <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span className="flex-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>Search APIs, endpoints...</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded-[5px] font-mono flex-shrink-0" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>⌘K</kbd>
        </button>
      </div>

      {/* Workspace selector */}
      <div ref={workspaceRef} className="relative">
        <button
          onClick={() => setWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-[10px] border transition-colors"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
        >
          <div className="w-5 h-5 rounded-[5px] flex items-center justify-center text-[10px] font-700" style={{ background: currentWorkspace?.color || 'var(--brand)', color: 'var(--brand-text)' }}>
            {currentWorkspace?.name.charAt(0).toUpperCase() || 'A'}
          </div>
          <span className="text-[13px] font-500" style={{ color: 'var(--text-primary)' }}>{currentWorkspace?.name || 'Select Workspace'}</span>
          <ChevronDown size={13} />
        </button>

        {isWorkspaceDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-72 rounded-[12px] border shadow-lg z-50" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="text-[11px] font-600 mb-2" style={{ color: 'var(--text-muted)' }}>RECENT WORKSPACES</div>
              {recentWorkspaces.map(workspace => (
                <button
                  key={workspace.id}
                  onClick={() => handleSwitchWorkspace(workspace.id)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-[8px] transition-colors text-left"
                  style={{ 
                    background: currentWorkspace?.id === workspace.id ? 'color-mix(in srgb, var(--brand) 12%, transparent)' : 'transparent',
                    color: 'var(--text-secondary)'
                  }}
                  onMouseEnter={(e) => { if (currentWorkspace?.id !== workspace.id) (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)' }}
                  onMouseLeave={(e) => { if (currentWorkspace?.id !== workspace.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <div className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[10px] font-700" style={{ background: workspace.color, color: 'var(--brand-text)' }}>
                    {workspace.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-500 truncate" style={{ color: 'var(--text-primary)' }}>{workspace.name}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{workspace.memberCount} members • {workspace.apiCount} APIs</div>
                  </div>
                  {currentWorkspace?.id === workspace.id && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand)' }} />
                  )}
                </button>
              ))}
            </div>

            <div className="p-2">
              {showCreateWorkspace ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Workspace name"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full px-3 py-2 rounded-[8px] text-[12px] border"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                  />
                  <div className="flex gap-2">
                    {['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'].map(color => (
                      <button
                        key={color}
                        onClick={() => setNewWorkspaceColor(color)}
                        className="w-6 h-6 rounded-full border-2 transition-all"
                        style={{ 
                          background: color, 
                          borderColor: newWorkspaceColor === color ? 'var(--brand)' : 'transparent',
                          boxShadow: newWorkspaceColor === color ? `0 0 0 2px var(--sidebar-bg)` : 'none'
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateWorkspace}
                      className="flex-1 py-2 rounded-[8px] text-[12px] font-600 transition-colors"
                      style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
                    >
                      Create
                    </button>
                    <button
                      onClick={() => { setShowCreateWorkspace(false); setNewWorkspaceName('') }}
                      className="flex-1 py-2 rounded-[8px] text-[12px] font-500 transition-colors"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowCreateWorkspace(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <Plus size={14} />
                    <span className="text-[12px] font-500">Create Workspace</span>
                  </button>
                  <button
                    onClick={() => onNavigate('settings')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <Settings size={14} />
                    <span className="text-[12px] font-500">Workspace Settings</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Upload */}
        <button
          onClick={() => onNavigate('upload-apis')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-600 transition-colors"
          style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--brand-hover)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--brand)')}
        >
          <Upload size={13} />
          Upload
        </button>

        {/* Notifications */}
        <div ref={notificationRef} className="relative">
          <button
            onClick={() => setNotificationDropdownOpen(!isNotificationDropdownOpen)}
            className="relative p-2 rounded-[10px] transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--card)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 flex items-center justify-center" style={{ background: 'var(--error)', borderColor: 'var(--sidebar-bg)' }} />
            )}
          </button>

          {isNotificationDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-96 rounded-[12px] border shadow-lg z-50 max-h-[400px] flex flex-col" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <div className="text-[12px] font-600" style={{ color: 'var(--text-primary)' }}>Notifications</div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-500 transition-colors"
                      style={{ color: 'var(--brand)' }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--brand-hover)'}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell size={24} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                    <p className="text-[12px] mt-2" style={{ color: 'var(--text-muted)' }}>No notifications</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b transition-colors ${!notification.read ? 'cursor-pointer' : ''}`}
                      style={{ 
                        borderColor: 'var(--border)',
                        background: !notification.read ? 'color-mix(in srgb, var(--brand) 4%, transparent)' : 'transparent'
                      }}
                      onClick={() => { if (!notification.read) markAsRead(notification.id) }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notification.read ? '' : 'opacity-0'}`} style={{ background: 'var(--brand)' }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-500 truncate" style={{ color: 'var(--text-primary)' }}>{notification.title}</p>
                            <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{formatTimeAgo(notification.timestamp)}</span>
                          </div>
                          <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{notification.message}</p>
                          {notification.actionLabel && (
                            <button
                              onClick={(e) => { e.stopPropagation(); if (notification.actionUrl) onNavigate(notification.actionUrl as any) }}
                              className="text-[10px] font-500 mt-2 transition-colors"
                              style={{ color: 'var(--brand)' }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--brand-hover)'}
                              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                            >
                              {notification.actionLabel}
                            </button>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id) }}
                          className="p-1 rounded-[4px] transition-colors opacity-0 group-hover:opacity-100"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--error)'}
                          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <button
                    onClick={() => { onNavigate('settings'); setNotificationDropdownOpen(false) }}
                    className="w-full py-2 rounded-[8px] text-[11px] font-500 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e: React.MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                    onMouseLeave={(e: React.MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    Notification Settings
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dark mode */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-[10px] transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--card)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

        {/* User */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-[10px] transition-colors"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--card)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-700" style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}>
              {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[12px] font-500 leading-none" style={{ color: 'var(--text-primary)' }}>{user?.fullName || 'Loading...'}</div>
              <div className="text-[10px] mt-0.5 leading-none" style={{ color: 'var(--text-muted)' }}>{user?.role || 'Member'}</div>
            </div>
          </button>

          {isProfileDropdownOpen && user && (
            <div className="absolute top-full right-0 mt-1 w-56 rounded-[12px] border shadow-lg z-50" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="text-[12px] font-600" style={{ color: 'var(--text-primary)' }}>{user.fullName}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{user.email}</div>
              </div>

              <div className="p-2">
                <button
                  onClick={() => { onNavigate('settings'); setProfileDropdownOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] transition-colors text-left"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <User size={14} />
                  <span className="text-[12px] font-500">Profile</span>
                </button>

                <button
                  onClick={() => { onNavigate('settings'); setProfileDropdownOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] transition-colors text-left"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <Users size={14} />
                  <span className="text-[12px] font-500">Organization: {user.organization}</span>
                </button>

                <button
                  onClick={() => { setProfileDropdownOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] transition-colors text-left"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <Settings size={14} />
                  <span className="text-[12px] font-500">Workspace Settings</span>
                </button>

                <button
                  onClick={() => { onNavigate('settings'); setProfileDropdownOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] transition-colors text-left"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <Settings size={14} />
                  <span className="text-[12px] font-500">Account Settings</span>
                </button>

                <button
                  onClick={() => { onNavigate('settings'); setProfileDropdownOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] transition-colors text-left"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <Key size={14} />
                  <span className="text-[12px] font-500">API Keys</span>
                </button>

                <button
                  onClick={() => { onNavigate('settings'); setProfileDropdownOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] transition-colors text-left"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <Activity size={14} />
                  <span className="text-[12px] font-500">Activity Log</span>
                </button>

                <button
                  onClick={() => { onNavigate('settings'); setProfileDropdownOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] transition-colors text-left"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <CreditCard size={14} />
                  <span className="text-[12px] font-500">Billing</span>
                </button>

                <button
                  onClick={() => { onNavigate('settings'); setProfileDropdownOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] transition-colors text-left"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <HelpCircle size={14} />
                  <span className="text-[12px] font-500">Help & Support</span>
                </button>
              </div>

              <div className="p-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={async () => {
                    await logout()
                    setProfileDropdownOpen(false)
                    window.location.reload()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] transition-colors text-left"
                  style={{ color: 'var(--error)' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--error) 8%, transparent)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <LogOut size={14} />
                  <span className="text-[12px] font-500">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
