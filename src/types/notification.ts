// Notification types

export type NotificationCategory = 
  | 'security_alert'
  | 'upload_complete'
  | 'report_generated'
  | 'scan_finished'
  | 'ai_recommendation'
  | 'password_changed'
  | 'verification_successful'
  | 'workspace_invite'
  | 'member_added'
  | 'general'

export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low'

export interface Notification {
  id: string
  category: NotificationCategory
  priority: NotificationPriority
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

export interface NotificationStats {
  total: number
  unread: number
  byCategory: Record<NotificationCategory, number>
}
