'use client'

import { PageHeader, DataTable, Card, CardContent, StatsCard, Button, EmptyState } from '@/components'
import { useState, useEffect, useCallback } from 'react'
import { 
  Bell, Heart, MessageSquare, UserPlus, AtSign, Eye, EyeOff, 
  Filter, X, ChevronDown, ChevronUp, Calendar, Clock, User
} from 'lucide-react'

type NotificationType = 'like' | 'comment' | 'follow' | 'message' | 'mention' | 'post_hidden'
type NotificationDateRange = 'all' | 'today' | '7d' | '30d'
type NotificationReadStatus = 'all' | 'read' | 'unread'

interface NotificationStats {
  total: number
  unread: number
  notificationsToday: number
  dismissed: number
  byType: Record<string, number>
}

interface NotificationWithContext {
  id: string
  user_id: string
  type: NotificationType
  actor_id: string | null
  post_id: string | null
  comment_id: string | null
  conversation_id: string | null
  content: string | null
  read_at: string | null
  dismissed_at: string | null
  created_at: string
  recipient_username: string
  recipient_avatar_url: string | null
  actor_username: string | null
  actor_avatar_url: string | null
}

// Notification type configuration
const notificationTypeConfig: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
  like: { label: 'Likes', icon: Heart, color: 'text-error' },
  comment: { label: 'Comments', icon: MessageSquare, color: 'text-primary' },
  follow: { label: 'Follows', icon: UserPlus, color: 'text-success' },
  mention: { label: 'Mentions', icon: AtSign, color: 'text-post-ask' },
  message: { label: 'Messages', icon: MessageSquare, color: 'text-post-hangout' },
  post_hidden: { label: 'Post Hidden', icon: EyeOff, color: 'text-warning' },
}

export default function NotificationsPage() {
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [notifications, setNotifications] = useState<NotificationWithContext[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(20)
  
  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const [readStatus, setReadStatus] = useState<NotificationReadStatus>('all')
  const [dateRange, setDateRange] = useState<NotificationDateRange>('all')
  
  // Modal
  const [selectedNotification, setSelectedNotification] = useState<NotificationWithContext | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Fetch stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/notifications?action=stats')
        const data = await res.json()
        setStats(data.stats || null)
      } catch (error) {
        console.error('Error fetching notification stats:', error)
      }
    }
    fetchStats()
  }, [])

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        action: 'list',
        page: page.toString(),
        limit: limit.toString(),
        readStatus,
        dateRange,
      })
      if (typeFilter !== 'all') {
        params.set('type', typeFilter)
      }
      const res = await fetch(`/api/admin/notifications?${params}`)
      const data = await res.json()
      setNotifications(data.notifications || [])
      setTotalPages(data.totalPages || 0)
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
    setLoading(false)
  }, [page, limit, typeFilter, readStatus, dateRange])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [typeFilter, readStatus, dateRange, limit])

  // Open modal
  const handleViewNotification = async (notification: NotificationWithContext) => {
    try {
      const res = await fetch(`/api/admin/notifications?action=byId&id=${notification.id}`)
      const data = await res.json()
      if (data.notification) {
        setSelectedNotification(data.notification)
        setModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching notification details:', error)
    }
  }

  // Clear filters
  const clearFilters = () => {
    setTypeFilter('all')
    setReadStatus('all')
    setDateRange('all')
    setPage(1)
  }

  const hasActiveFilters = typeFilter !== 'all' || readStatus !== 'all' || dateRange !== 'all'

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString()
  }

  // Table columns
  const columns = [
    {
      key: 'type',
      header: 'Type',
      render: (notif: NotificationWithContext) => {
        const config = notificationTypeConfig[notif.type] || { label: notif.type, icon: Bell, color: 'text-text-secondary' }
        const Icon = config.icon
        return (
          <div className="flex items-center gap-2">
            <Icon size={16} className={config.color} />
            <span className="capitalize">{notif.type.replace('_', ' ')}</span>
          </div>
        )
      },
    },
    {
      key: 'recipient',
      header: 'Recipient',
      render: (notif: NotificationWithContext) => (
        <div className="flex items-center gap-2">
          {notif.recipient_avatar_url ? (
            <img src={notif.recipient_avatar_url} alt="" className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-surface-alt flex items-center justify-center">
              <User size={12} className="text-text-secondary" />
            </div>
          )}
          <span className="text-text">@{notif.recipient_username}</span>
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (notif: NotificationWithContext) => (
        notif.actor_username ? (
          <div className="flex items-center gap-2">
            {notif.actor_avatar_url ? (
              <img src={notif.actor_avatar_url} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-surface-alt flex items-center justify-center">
                <User size={12} className="text-text-secondary" />
              </div>
            )}
            <span className="text-text">@{notif.actor_username}</span>
          </div>
        ) : (
          <span className="text-text-secondary">System</span>
        )
      ),
    },
    {
      key: 'content',
      header: 'Content',
      render: (notif: NotificationWithContext) => (
        <span className="text-text-secondary text-sm truncate max-w-[200px] block">
          {notif.content || '—'}
        </span>
      ),
    },
    {
      key: 'read_at',
      header: 'Status',
      render: (notif: NotificationWithContext) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            notif.read_at
              ? 'bg-success/10 text-success'
              : 'bg-warning/10 text-warning'
          }`}
        >
          {notif.read_at ? 'Read' : 'Unread'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Time',
      render: (notif: NotificationWithContext) => (
        <span className="text-text-secondary text-sm">{formatRelativeTime(notif.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (notif: NotificationWithContext) => (
        <Button variant="ghost" size="sm" onClick={() => handleViewNotification(notif)}>
          View
        </Button>
      ),
    },
  ]

  // Get type breakdown data
  const typeBreakdown = Object.entries(stats?.byType || {}).map(([type, count]) => {
    const config = notificationTypeConfig[type] || { label: type, icon: Bell, color: 'text-text-secondary' }
    return { type, count, ...config }
  })

  return (
    <div className="fade-in">
      <PageHeader
        title="Notifications"
        description="View notification logs and delivery status"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Notifications"
          value={stats?.total || 0}
          icon={Bell}
        />
        <StatsCard
          title="Unread"
          value={stats?.unread || 0}
          icon={Eye}
        />
        <StatsCard
          title="Today"
          value={stats?.notificationsToday || 0}
          icon={Calendar}
        />
        <StatsCard
          title="Dismissed"
          value={stats?.dismissed || 0}
          icon={X}
        />
      </div>

      {/* Type Breakdown */}
      {typeBreakdown.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {typeBreakdown.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.type} padding="sm" hover className="cursor-pointer" onClick={() => setTypeFilter(item.type as NotificationType)}>
                <CardContent className="pt-0 text-center">
                  <Icon size={24} className={`${item.color} mx-auto mb-2`} />
                  <p className="text-xl font-bold text-text">{item.count.toLocaleString()}</p>
                  <p className="text-xs text-text-secondary capitalize">{item.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-text hover:text-primary transition-colors"
            >
              <Filter size={18} />
              <span className="font-medium">Filters</span>
              {hasActiveFilters && (
                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">Active</span>
              )}
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-text-secondary hover:text-error transition-colors"
              >
                <X size={14} />
                Clear filters
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
              {/* Type filter */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-text text-sm"
                >
                  <option value="all">All types</option>
                  <option value="like">Like</option>
                  <option value="comment">Comment</option>
                  <option value="follow">Follow</option>
                  <option value="mention">Mention</option>
                  <option value="message">Message</option>
                  <option value="post_hidden">Post Hidden</option>
                </select>
              </div>

              {/* Read status */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Read Status</label>
                <select
                  value={readStatus}
                  onChange={(e) => setReadStatus(e.target.value as NotificationReadStatus)}
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-text text-sm"
                >
                  <option value="all">All</option>
                  <option value="read">Read</option>
                  <option value="unread">Unread</option>
                </select>
              </div>

              {/* Date range */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as NotificationDateRange)}
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-text text-sm"
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
              </div>

              {/* Page size */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Per Page</label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-text text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results summary */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">
          Showing {notifications.length} of {total.toLocaleString()} notifications
        </p>
      </div>

      {/* Notifications Table */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading notifications...</p>
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications found"
          description={hasActiveFilters ? "Try adjusting your filters" : "Notifications will appear here"}
        />
      ) : (
        <DataTable
          columns={columns}
          data={notifications}
          pagination={{
            page,
            totalPages,
            onPageChange: setPage,
          }}
        />
      )}

      {/* Notification Detail Modal */}
      {modalOpen && selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => {
            setModalOpen(false)
            setSelectedNotification(null)
          }}
        />
      )}
    </div>
  )
}

// Modal Component
function NotificationDetailModal({
  notification,
  onClose,
}: {
  notification: NotificationWithContext
  onClose: () => void
}) {
  const config = notificationTypeConfig[notification.type] || { label: notification.type, icon: Bell, color: 'text-text-secondary' }
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md h-full bg-surface border-l border-border overflow-y-auto animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={20} className={config.color} />
            <h2 className="text-lg font-semibold text-text capitalize">
              {notification.type.replace('_', ' ')} Notification
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-alt rounded-lg transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                notification.read_at
                  ? 'bg-success/10 text-success'
                  : 'bg-warning/10 text-warning'
              }`}
            >
              {notification.read_at ? 'Read' : 'Unread'}
            </span>
            {notification.dismissed_at && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-surface-alt text-text-secondary">
                Dismissed
              </span>
            )}
          </div>

          {/* Recipient */}
          <div>
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Recipient</h3>
            <div className="flex items-center gap-3 p-3 bg-surface-alt rounded-lg">
              {notification.recipient_avatar_url ? (
                <img src={notification.recipient_avatar_url} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                  <User size={20} className="text-text-secondary" />
                </div>
              )}
              <div>
                <p className="font-medium text-text">@{notification.recipient_username}</p>
                <p className="text-xs text-text-secondary">User ID: {notification.user_id.slice(0, 8)}...</p>
              </div>
            </div>
          </div>

          {/* Actor */}
          {notification.actor_id && (
            <div>
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Actor</h3>
              <div className="flex items-center gap-3 p-3 bg-surface-alt rounded-lg">
                {notification.actor_avatar_url ? (
                  <img src={notification.actor_avatar_url} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                    <User size={20} className="text-text-secondary" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-text">@{notification.actor_username || 'Unknown'}</p>
                  <p className="text-xs text-text-secondary">User ID: {notification.actor_id.slice(0, 8)}...</p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {notification.content && (
            <div>
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Content</h3>
              <p className="text-text bg-surface-alt p-3 rounded-lg">{notification.content}</p>
            </div>
          )}

          {/* Related IDs */}
          <div>
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Related</h3>
            <div className="space-y-2 text-sm">
              {notification.post_id && (
                <div className="flex justify-between p-2 bg-surface-alt rounded">
                  <span className="text-text-secondary">Post ID</span>
                  <span className="text-text font-mono text-xs">{notification.post_id.slice(0, 12)}...</span>
                </div>
              )}
              {notification.comment_id && (
                <div className="flex justify-between p-2 bg-surface-alt rounded">
                  <span className="text-text-secondary">Comment ID</span>
                  <span className="text-text font-mono text-xs">{notification.comment_id.slice(0, 12)}...</span>
                </div>
              )}
              {notification.conversation_id && (
                <div className="flex justify-between p-2 bg-surface-alt rounded">
                  <span className="text-text-secondary">Conversation ID</span>
                  <span className="text-text font-mono text-xs">{notification.conversation_id.slice(0, 12)}...</span>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Timestamps</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-surface-alt rounded">
                <span className="text-text-secondary">Created</span>
                <span className="text-text">{new Date(notification.created_at).toLocaleString()}</span>
              </div>
              {notification.read_at && (
                <div className="flex justify-between p-2 bg-surface-alt rounded">
                  <span className="text-text-secondary">Read</span>
                  <span className="text-text">{new Date(notification.read_at).toLocaleString()}</span>
                </div>
              )}
              {notification.dismissed_at && (
                <div className="flex justify-between p-2 bg-surface-alt rounded">
                  <span className="text-text-secondary">Dismissed</span>
                  <span className="text-text">{new Date(notification.dismissed_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
