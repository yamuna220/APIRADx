import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Notification, NotificationCategory, NotificationStats } from '../types/notification'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  stats: NotificationStats
  isNotificationDropdownOpen: boolean
  setNotificationDropdownOpen: (open: boolean) => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
  getNotificationsByCategory: (category: NotificationCategory) => Notification[]
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Mock initial notifications
const initialNotifications: Notification[] = [
  {
    id: '1',
    category: 'security_alert',
    priority: 'critical',
    title: 'Critical Vulnerability Detected',
    message: 'Broken Object Level Authorization found in /api/users endpoint',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/security-analysis',
    actionLabel: 'View Details'
  },
  {
    id: '2',
    category: 'upload_complete',
    priority: 'normal',
    title: 'API Specification Uploaded',
    message: 'Payment API v2.0 has been successfully analyzed',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/api-inventory',
    actionLabel: 'View'
  },
  {
    id: '3',
    category: 'report_generated',
    priority: 'normal',
    title: 'Security Report Ready',
    message: 'Executive summary report for Acme Corp is ready for download',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
    actionUrl: '/reports',
    actionLabel: 'Download'
  },
  {
    id: '4',
    category: 'ai_recommendation',
    priority: 'high',
    title: 'AI Recommendation Available',
    message: 'New fix suggestion for authentication vulnerability',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/ai-recommendations',
    actionLabel: 'View'
  },
  {
    id: '5',
    category: 'scan_finished',
    priority: 'normal',
    title: 'Security Scan Completed',
    message: 'Weekly security scan finished with 3 findings',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    actionUrl: '/security-analysis',
    actionLabel: 'Review'
  }
]

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = localStorage.getItem('apiradx-notifications')
    return stored ? JSON.parse(stored) : initialNotifications
  })
  const [isNotificationDropdownOpen, setNotificationDropdownOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('apiradx-notifications', JSON.stringify(notifications))
  }, [notifications])

  const unreadCount = notifications.filter(n => !n.read).length

  const stats: NotificationStats = {
    total: notifications.length,
    unread: unreadCount,
    byCategory: notifications.reduce((acc, n) => {
      acc[n.category] = (acc[n.category] || 0) + 1
      return acc
    }, {} as Record<NotificationCategory, number>)
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const getNotificationsByCategory = (category: NotificationCategory): Notification[] => {
    return notifications.filter(n => n.category === category)
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      stats,
      isNotificationDropdownOpen,
      setNotificationDropdownOpen,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      getNotificationsByCategory
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
