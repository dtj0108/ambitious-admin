'use client'

import { useState, useEffect } from 'react'
import { Card, Button } from '@/components'
import { 
  Mail, 
  MessageSquare,
  Calendar,
  Users,
  MessagesSquare,
  Image as ImageIcon,
  Video,
  Bot,
  RefreshCw,
  TrendingUp,
  Lock,
} from 'lucide-react'
import { 
  getMessageStats, 
  getMessageActivityTrend,
  type MessageStats,
  type MessageActivityPoint,
} from '@/lib/queries'

export default function MessagesPage() {
  const [stats, setStats] = useState<MessageStats | null>(null)
  const [trend, setTrend] = useState<MessageActivityPoint[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    const [statsData, trendData] = await Promise.all([
      getMessageStats(),
      getMessageActivityTrend(7),
    ])
    setStats(statsData)
    setTrend(trendData)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const maxTrendValue = Math.max(...trend.map(t => t.count), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Messages</h1>
          <p className="text-text-secondary mt-1">
            Messaging activity overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={fetchData}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <Lock size={20} className="text-primary" />
        <div>
          <p className="text-sm font-medium text-text">Private Messages</p>
          <p className="text-xs text-text-secondary">Message content is not accessible for privacy. Only aggregate statistics are shown.</p>
        </div>
      </div>

      {/* RLS Notice - show if all zeros */}
      {!loading && stats?.total === 0 && (
        <div className="flex items-center gap-3 p-4 bg-post-win/5 border border-post-win/20 rounded-xl">
          <MessagesSquare size={20} className="text-post-win" />
          <div>
            <p className="text-sm font-medium text-text">No Data Available</p>
            <p className="text-xs text-text-secondary">
              If you have messages, check that RLS (Row Level Security) on the <code className="bg-elevated px-1 rounded">messages</code> table allows read access for the admin, or the table may be empty.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {loading ? '—' : formatNumber(stats?.total || 0)}
              </p>
              <p className="text-sm text-text-secondary">Total Messages</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Calendar size={24} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">
                {loading ? '—' : formatNumber(stats?.messagesToday || 0)}
              </p>
              <p className="text-sm text-text-secondary">Today</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-post-win/10 flex items-center justify-center">
              <MessagesSquare size={24} className="text-post-win" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {loading ? '—' : formatNumber(stats?.activeConversations7d || 0)}
              </p>
              <p className="text-sm text-text-secondary">Conversations (7d)</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-post-hangout/10 flex items-center justify-center">
              <Users size={24} className="text-post-hangout" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {loading ? '—' : formatNumber(stats?.uniqueSenders7d || 0)}
              </p>
              <p className="text-sm text-text-secondary">Senders (7d)</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Types */}
        <Card>
          <h3 className="text-lg font-semibold text-text mb-4">Message Types</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-elevated/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-text">Text</p>
                    <p className="text-xs text-text-tertiary">Regular messages</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-text">{formatNumber(stats?.byType.text || 0)}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-text-tertiary/10 flex items-center justify-center">
                    <Bot size={18} className="text-text-tertiary" />
                  </div>
                  <div>
                    <p className="font-medium text-text">System</p>
                    <p className="text-xs text-text-tertiary">Automated messages</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-text">{formatNumber(stats?.byType.system || 0)}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-post-win/10 flex items-center justify-center">
                    <ImageIcon size={18} className="text-post-win" />
                  </div>
                  <div>
                    <p className="font-medium text-text">Image</p>
                    <p className="text-xs text-text-tertiary">Photo messages</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-text">{formatNumber(stats?.byType.image || 0)}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-post-hangout/10 flex items-center justify-center">
                    <Video size={18} className="text-post-hangout" />
                  </div>
                  <div>
                    <p className="font-medium text-text">Video</p>
                    <p className="text-xs text-text-tertiary">Video messages</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-text">{formatNumber(stats?.byType.video || 0)}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Activity Trend */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text">Daily Activity</h3>
            <div className="flex items-center gap-1 text-text-tertiary text-xs">
              <TrendingUp size={12} />
              Last 7 days
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="h-10 bg-elevated/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : trend.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
              <Mail size={32} className="mb-2" />
              <p className="text-sm">No message activity</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trend.map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <p className="text-xs text-text-tertiary w-24 flex-shrink-0">{day.label}</p>
                  <div className="flex-1 h-8 bg-elevated/50 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-lg transition-all duration-500"
                      style={{ width: `${(day.count / maxTrendValue) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm font-medium text-text w-12 text-right">{day.count}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Week Summary */}
      <Card>
        <h3 className="text-lg font-semibold text-text mb-4">This Week Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-surface rounded-xl border border-border/50">
            <p className="text-3xl font-bold text-text">
              {loading ? '—' : formatNumber(stats?.messagesThisWeek || 0)}
            </p>
            <p className="text-sm text-text-secondary mt-1">Messages Sent</p>
          </div>
          <div className="text-center p-4 bg-surface rounded-xl border border-border/50">
            <p className="text-3xl font-bold text-primary">
              {loading ? '—' : formatNumber(stats?.activeConversations7d || 0)}
            </p>
            <p className="text-sm text-text-secondary mt-1">Active Threads</p>
          </div>
          <div className="text-center p-4 bg-surface rounded-xl border border-border/50">
            <p className="text-3xl font-bold text-success">
              {loading ? '—' : formatNumber(stats?.uniqueSenders7d || 0)}
            </p>
            <p className="text-sm text-text-secondary mt-1">Active Users</p>
          </div>
          <div className="text-center p-4 bg-surface rounded-xl border border-border/50">
            <p className="text-3xl font-bold text-text">
              {loading || !stats?.messagesThisWeek ? '—' : 
                Math.round(stats.messagesThisWeek / 7).toLocaleString()
              }
            </p>
            <p className="text-sm text-text-secondary mt-1">Avg per Day</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
