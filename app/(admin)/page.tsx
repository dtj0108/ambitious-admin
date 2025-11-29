'use client'

import { useEffect, useState } from 'react'
import { StatsCard, Card, CardHeader, CardTitle, CardContent } from '@/components'
import { PostTypeBadge } from '@/components/PostTypeBadge'
import {
  Users,
  FileText,
  MessageSquare,
  Heart,
  TrendingUp,
  UserPlus,
  Flame,
  EyeOff,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Calendar,
  Activity,
  Trophy,
} from 'lucide-react'
import { getDashboardData, getActivityMetrics, type DashboardData, type ActivityMetrics, type TimePeriod, timePeriodLabels } from '@/lib/queries'
import { type PostType } from '@/lib/utils'

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toLocaleString()
}

const periods: TimePeriod[] = ['today', '7d', '30d', '90d', 'all']

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [activityData, setActivityData] = useState<ActivityMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<TimePeriod>('7d')

  const fetchData = async (selectedPeriod: TimePeriod) => {
    try {
      setLoading(true)
      setError(null)
      const [dashboardData, activityMetrics] = await Promise.all([
        getDashboardData(selectedPeriod),
        getActivityMetrics(),
      ])
      setData(dashboardData)
      setActivityData(activityMetrics)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load dashboard data. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(period)
  }, [period])

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod)
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-text font-medium">Loading dashboard</p>
            <p className="text-sm text-text-tertiary">Fetching your data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center">
            <AlertCircle size={32} className="text-error" />
          </div>
          <div>
            <p className="text-text font-medium mb-1">Something went wrong</p>
            <p className="text-sm text-text-secondary">{error || 'Failed to load data'}</p>
          </div>
          <button
            onClick={() => fetchData(period)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const stats = [
    {
      title: 'Total Users',
      value: formatNumber(data.totalUsers),
      icon: Users,
      iconColor: 'text-primary',
      accentColor: 'from-primary/20 to-primary/5',
    },
    {
      title: `Posts`,
      value: formatNumber(data.postsCount),
      icon: FileText,
      iconColor: 'text-post-win',
      accentColor: 'from-post-win/20 to-post-win/5',
    },
    {
      title: `Comments`,
      value: formatNumber(data.commentsCount),
      icon: MessageSquare,
      iconColor: 'text-post-ask',
      accentColor: 'from-post-ask/20 to-post-ask/5',
    },
    {
      title: `Likes`,
      value: formatNumber(data.likesCount),
      icon: Heart,
      iconColor: 'text-error',
      accentColor: 'from-error/20 to-error/5',
    },
  ]

  const quickStats = [
    { label: 'Active Users', sublabel: 'Last 7 days', value: formatNumber(data.activeUsers7d), icon: TrendingUp, color: 'text-success' },
    { label: 'New Signups', sublabel: timePeriodLabels[period], value: formatNumber(data.newSignups), icon: UserPlus, color: 'text-primary' },
    { label: 'Avg Streak', sublabel: 'All users', value: data.avgStreak.toFixed(1), icon: Flame, color: 'text-post-win' },
    { label: 'Hidden Posts', sublabel: 'Moderated', value: formatNumber(data.hiddenPosts), icon: EyeOff, color: 'text-text-tertiary' },
  ]

  const totalPosts = data.postsByType.reduce((sum, p) => sum + p.count, 0)

  // Get max value for chart scaling
  const maxTrendValue = activityData ? Math.max(...activityData.trend.map(t => t.total), 1) : 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">Dashboard</h1>
            <p className="text-text-secondary mt-1">
              Welcome back! Here&apos;s what&apos;s happening with Ambitious Social.
            </p>
          </div>
          <button
            onClick={() => fetchData(period)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface border border-border/50 text-text-secondary rounded-xl font-medium hover:bg-elevated hover:text-text transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Time Period Filter */}
        <div className="flex items-center gap-2 p-1.5 bg-surface border border-border/50 rounded-xl w-fit">
          <Calendar size={16} className="text-text-tertiary ml-2" />
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                period === p
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text hover:bg-elevated'
              }`}
            >
              {timePeriodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Metrics Section */}
      {activityData && (
        <Card gradient>
          <CardHeader>
            <CardTitle subtitle="User engagement across the platform">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-primary" />
                Activity Overview
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* DAU/WAU/MAU Pills */}
              <div className="lg:col-span-1 space-y-3">
                <div className="p-4 bg-gradient-to-br from-success/10 to-success/5 rounded-xl border border-success/20">
                  <p className="text-xs font-medium text-success uppercase tracking-wide mb-1">DAU</p>
                  <p className="text-3xl font-bold text-text">{formatNumber(activityData.dau)}</p>
                  <p className="text-xs text-text-tertiary mt-1">Daily Active Users</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                  <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">WAU</p>
                  <p className="text-3xl font-bold text-text">{formatNumber(activityData.wau)}</p>
                  <p className="text-xs text-text-tertiary mt-1">Weekly Active Users</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-post-hangout/10 to-post-hangout/5 rounded-xl border border-post-hangout/20">
                  <p className="text-xs font-medium text-post-hangout uppercase tracking-wide mb-1">MAU</p>
                  <p className="text-3xl font-bold text-text">{formatNumber(activityData.mau)}</p>
                  <p className="text-xs text-text-tertiary mt-1">Monthly Active Users</p>
                </div>
              </div>

              {/* Activity Trend Chart */}
              <div className="lg:col-span-2">
                <p className="text-sm font-medium text-text mb-3">Activity Trend (7 Days)</p>
                <div className="flex items-end gap-1 h-48">
                  {activityData.trend.map((day, idx) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="relative w-full flex flex-col justify-end h-40">
                        {/* Stacked bars */}
                        <div 
                          className="w-full bg-error/80 rounded-t transition-all duration-300 group-hover:bg-error"
                          style={{ height: `${(day.likes / maxTrendValue) * 100}%` }}
                          title={`${day.likes} likes`}
                        />
                        <div 
                          className="w-full bg-post-ask/80 transition-all duration-300 group-hover:bg-post-ask"
                          style={{ height: `${(day.comments / maxTrendValue) * 100}%` }}
                          title={`${day.comments} comments`}
                        />
                        <div 
                          className="w-full bg-primary/80 rounded-b transition-all duration-300 group-hover:bg-primary"
                          style={{ height: `${(day.posts / maxTrendValue) * 100}%` }}
                          title={`${day.posts} posts`}
                        />
                        
                        {/* Tooltip */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded-lg px-2 py-1 shadow-lg z-10 whitespace-nowrap pointer-events-none">
                          <p className="text-xs font-medium text-text">{day.total} total</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-text-tertiary truncate w-full text-center">
                        {day.label.split(' ')[0]}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-primary" />
                    <span className="text-xs text-text-secondary">Posts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-post-ask" />
                    <span className="text-xs text-text-secondary">Comments</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-error" />
                    <span className="text-xs text-text-secondary">Likes</span>
                  </div>
                </div>
              </div>

              {/* Top Active Users */}
              <div className="lg:col-span-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-text">Top Users</p>
                  <Trophy size={14} className="text-post-win" />
                </div>
                <div className="space-y-2">
                  {activityData.topUsers.length === 0 ? (
                    <p className="text-sm text-text-tertiary text-center py-4">No activity yet</p>
                  ) : (
                    activityData.topUsers.map((user, idx) => (
                      <div 
                        key={user.id} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-elevated/50 transition-colors"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm font-medium">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              user.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          {idx < 3 && (
                            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              idx === 0 ? 'bg-post-win text-black' : idx === 1 ? 'bg-gray-300 text-black' : 'bg-orange-400 text-white'
                            }`}>
                              {idx + 1}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">@{user.username}</p>
                          <p className="text-xs text-text-tertiary">
                            {user.posts}p · {user.comments}c · {user.likes}l
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-text">{user.score}</p>
                          <p className="text-[10px] text-text-tertiary">score</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={stat.title}
            className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${loading ? 'opacity-50' : ''}`}
            style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'backwards' }}
          >
            <StatsCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconColor={stat.iconColor}
              accentColor={stat.accentColor}
            />
          </div>
        ))}
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <Card className="lg:col-span-2" gradient>
          <CardHeader>
            <CardTitle subtitle="Key performance indicators">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className={`group relative flex flex-col p-4 bg-elevated/50 hover:bg-elevated rounded-xl border border-border/30 hover:border-border/50 transition-all duration-200 ${loading ? 'opacity-50' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-surface border border-border/50 flex items-center justify-center mb-3 ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                  <p className="text-2xl font-bold text-text">{stat.value}</p>
                  <p className="text-sm font-medium text-text-secondary mt-1">{stat.label}</p>
                  <p className="text-xs text-text-tertiary">{stat.sublabel}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader 
            action={
              <button className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </button>
            }
          >
            <CardTitle subtitle="Latest platform events">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.length === 0 ? (
                <p className="text-text-tertiary text-center py-8">No recent activity</p>
              ) : (
                data.recentActivity.slice(0, 6).map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-elevated/50 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        activity.type === 'post'
                          ? 'bg-primary/10 text-primary'
                          : activity.type === 'comment'
                          ? 'bg-post-ask/10 text-post-ask'
                          : 'bg-success/10 text-success'
                      }`}
                    >
                      {activity.type === 'post' ? (
                        <FileText size={14} />
                      ) : activity.type === 'comment' ? (
                        <MessageSquare size={14} />
                      ) : (
                        <UserPlus size={14} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text truncate">
                        {activity.message}
                      </p>
                      <p className="text-xs text-text-tertiary mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts by Type */}
      <Card gradient>
        <CardHeader>
          <CardTitle subtitle="Distribution of content across categories">Posts by Type</CardTitle>
        </CardHeader>
        <CardContent>
          {totalPosts === 0 ? (
            <div className="h-32 flex items-center justify-center">
              <p className="text-text-tertiary">No posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.postsByType
                .filter((p) => p.count > 0)
                .sort((a, b) => b.count - a.count)
                .map((postType) => {
                  const percentage = Math.round((postType.count / totalPosts) * 100)
                  return (
                    <div 
                      key={postType.type} 
                      className={`p-4 bg-elevated/50 rounded-xl border border-border/30 hover:border-border/50 transition-all ${loading ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <PostTypeBadge type={postType.type as PostType} />
                        <span className="text-lg font-bold text-text">
                          {formatNumber(postType.count)}
                        </span>
                      </div>
                      <div className="h-2 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getPostTypeColor(postType.type),
                          }}
                        />
                      </div>
                      <p className="text-xs text-text-tertiary mt-2">{percentage}% of all posts</p>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getPostTypeColor(type: string): string {
  const colors: Record<string, string> = {
    win: '#FFD700',
    dream: '#4A9EFF',
    ask: '#FF9500',
    hangout: '#5856D6',
    intro: '#4A9EFF',
    general: '#909090',
  }
  return colors[type] || colors.general
}
