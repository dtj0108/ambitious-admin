'use client'

import { useEffect, useState, useRef } from 'react'
import { StatsCard, Card, CardHeader, CardTitle, CardContent } from '@/components'
import {
  BarChart3,
  Users,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Filter,
  ExternalLink,
  Zap,
  ArrowDown,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  UserPlus,
  ChevronDown,
  X,
  Check,
  Play,
} from 'lucide-react'
import {
  getAnalyticsData,
  getUniqueEventNames,
  getKeyEventsMetrics,
  getEngagementMetrics,
  getLoopMetrics,
  type AnalyticsData,
  type AnalyticsFilters,
  type AnalyticsDateRange,
  type AnalyticsPlatform,
  type KeyEventsMetrics,
  type EngagementMetrics,
  type LoopMetrics,
} from '@/lib/queries'

const dateRangeOptions: { value: AnalyticsDateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
]

const platformOptions: { value: AnalyticsPlatform; label: string; icon: typeof Monitor }[] = [
  { value: 'all', label: 'All Platforms', icon: Globe },
  { value: 'web', label: 'Web', icon: Monitor },
  { value: 'ios', label: 'iOS', icon: Smartphone },
  { value: 'android', label: 'Android', icon: Smartphone },
]

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toLocaleString()
}

function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case 'web':
      return Monitor
    case 'ios':
    case 'android':
      return Smartphone
    default:
      return Globe
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [keyEvents, setKeyEvents] = useState<KeyEventsMetrics | null>(null)
  const [engagement, setEngagement] = useState<EngagementMetrics | null>(null)
  const [loops, setLoops] = useState<LoopMetrics | null>(null)
  const [eventNames, setEventNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false)
  const eventDropdownRef = useRef<HTMLDivElement>(null)
  
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: '7d',
    platform: 'all',
    eventType: undefined,
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [analyticsData, names, keyEventsData, engagementData, loopsData] = await Promise.all([
        getAnalyticsData(filters),
        getUniqueEventNames(),
        getKeyEventsMetrics(filters),
        getEngagementMetrics(filters),
        getLoopMetrics(filters),
      ])
      setData(analyticsData)
      setEventNames(names)
      setKeyEvents(keyEventsData)
      setEngagement(engagementData)
      setLoops(loopsData)
    } catch (err) {
      console.error('Failed to fetch analytics data:', err)
      setError('Failed to load analytics data. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target as Node)) {
        setEventDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDateRangeChange = (dateRange: AnalyticsDateRange) => {
    setFilters(prev => ({ ...prev, dateRange }))
  }

  const handlePlatformChange = (platform: AnalyticsPlatform) => {
    setFilters(prev => ({ ...prev, platform }))
  }

  const handleEventTypeChange = (eventType: string) => {
    setFilters(prev => ({ ...prev, eventType: eventType || undefined }))
    setEventDropdownOpen(false)
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
            <p className="text-text font-medium">Loading analytics</p>
            <p className="text-sm text-text-tertiary">Fetching event data...</p>
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
            <p className="text-sm text-text-secondary">{error}</p>
          </div>
          <button
            onClick={fetchData}
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

  const maxTrendValue = Math.max(...data.trend.map(t => t.count), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text flex items-center gap-2">
              <BarChart3 size={28} className="text-primary" />
              Analytics
            </h1>
            <p className="text-text-secondary mt-1">
              Track user behavior and engagement metrics across platforms.
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface border border-border/50 text-text-secondary rounded-xl font-medium hover:bg-elevated hover:text-text transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2 p-1.5 bg-surface border border-border/50 rounded-xl">
            <Calendar size={16} className="text-text-tertiary ml-2" />
            {dateRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleDateRangeChange(option.value)}
                disabled={loading}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  filters.dateRange === option.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text hover:bg-elevated'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-2 p-1.5 bg-surface border border-border/50 rounded-xl">
            <Globe size={16} className="text-text-tertiary ml-2" />
            {platformOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => handlePlatformChange(option.value)}
                  disabled={loading}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    filters.platform === option.value
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text hover:bg-elevated'
                  }`}
                >
                  <Icon size={14} />
                  {option.label}
                </button>
              )
            })}
          </div>

          {/* Event Type Filter - Custom Dropdown */}
          <div className="relative" ref={eventDropdownRef}>
            <button
              onClick={() => !loading && setEventDropdownOpen(!eventDropdownOpen)}
              disabled={loading}
              className={`flex items-center gap-2 px-3 py-2 bg-surface border rounded-xl transition-all duration-200 min-w-[180px] ${
                eventDropdownOpen 
                  ? 'border-primary/50 ring-2 ring-primary/20' 
                  : 'border-border/50 hover:border-border'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Filter size={16} className="text-text-tertiary" />
              <span className={`flex-1 text-left text-sm truncate ${filters.eventType ? 'text-text' : 'text-text-secondary'}`}>
                {filters.eventType || 'All Events'}
              </span>
              {filters.eventType ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEventTypeChange('')
                  }}
                  className="p-0.5 hover:bg-elevated rounded transition-colors"
                >
                  <X size={14} className="text-text-tertiary hover:text-text" />
                </button>
              ) : (
                <ChevronDown 
                  size={16} 
                  className={`text-text-tertiary transition-transform duration-200 ${eventDropdownOpen ? 'rotate-180' : ''}`} 
                />
              )}
            </button>

            {/* Dropdown Menu */}
            {eventDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full min-w-[240px] max-h-[300px] overflow-y-auto bg-card border border-border/50 rounded-xl shadow-lg z-50 py-1">
                {/* All Events Option */}
                <button
                  onClick={() => handleEventTypeChange('')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                    !filters.eventType 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-text-secondary hover:bg-elevated hover:text-text'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    !filters.eventType ? 'border-primary bg-primary' : 'border-border'
                  }`}>
                    {!filters.eventType && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-medium">All Events</span>
                </button>

                {/* Divider */}
                {eventNames.length > 0 && (
                  <div className="my-1 mx-3 border-t border-border/50" />
                )}

                {/* Event Name Options */}
                {eventNames.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-text-tertiary">
                    No events found
                  </div>
                ) : (
                  eventNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleEventTypeChange(name)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                        filters.eventType === name 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-text-secondary hover:bg-elevated hover:text-text'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        filters.eventType === name ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                        {filters.eventType === name && <Check size={12} className="text-white" />}
                      </div>
                      <span className="truncate">{name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Events Hero - Impressions */}
      {keyEvents && (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Eye size={24} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">Impressions</h2>
                  <p className="text-sm text-text-secondary">Content views across the platform</p>
                </div>
              </div>
              {keyEvents.impressionsTrend !== 'neutral' && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                  keyEvents.impressionsTrend === 'up' 
                    ? 'bg-success/10 text-success' 
                    : 'bg-error/10 text-error'
                }`}>
                  {keyEvents.impressionsTrend === 'up' ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                  {keyEvents.trendPercentage}% vs last week
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl p-5 text-center">
                <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">Today</p>
                <p className="text-4xl font-bold text-text">{formatNumber(keyEvents.impressionsToday)}</p>
              </div>
              <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl p-5 text-center">
                <p className="text-xs font-medium text-post-ask uppercase tracking-wide mb-2">This Week</p>
                <p className="text-4xl font-bold text-text">{formatNumber(keyEvents.impressionsWeek)}</p>
              </div>
              <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl p-5 text-center">
                <p className="text-xs font-medium text-post-hangout uppercase tracking-wide mb-2">This Month</p>
                <p className="text-4xl font-bold text-text">{formatNumber(keyEvents.impressionsMonth)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Events"
          value={formatNumber(data.overview.totalEvents)}
          icon={Activity}
          iconColor="text-primary"
          accentColor="from-primary/20 to-primary/5"
        />
        <StatsCard
          title="Unique Users"
          value={formatNumber(data.overview.uniqueUsers)}
          icon={Users}
          iconColor="text-success"
          accentColor="from-success/20 to-success/5"
        />
        <StatsCard
          title="Sessions"
          value={formatNumber(data.overview.uniqueSessions)}
          icon={Zap}
          iconColor="text-post-win"
          accentColor="from-post-win/20 to-post-win/5"
        />
        <StatsCard
          title="Avg Events/Session"
          value={data.overview.avgEventsPerSession.toFixed(1)}
          icon={BarChart3}
          iconColor="text-post-hangout"
          accentColor="from-post-hangout/20 to-post-hangout/5"
        />
      </div>

      {/* Engagement Metrics */}
      {engagement && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-error" />
              <h2 className="text-lg font-semibold text-text">Engagement Metrics</h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-elevated/50 rounded-lg">
              <span className="text-xs text-text-tertiary">Engagement Rate:</span>
              <span className="text-sm font-bold text-text">{engagement.engagementRate}%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Likes */}
            <div className="group relative bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-border transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-error/20 to-error/5 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 transition-opacity duration-300 group-hover:opacity-70" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-error/20 to-error/10 border border-error/20">
                    <Heart size={24} className="text-error" />
                  </div>
                  <p className="text-2xl font-bold text-text">{formatNumber(engagement.likes.month)}</p>
                </div>
                <p className="text-sm font-medium text-text mb-2">Likes</p>
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    {formatNumber(engagement.likes.today)} today
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {formatNumber(engagement.likes.week)} week
                  </span>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="group relative bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-border transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-primary/5 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 transition-opacity duration-300 group-hover:opacity-70" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                    <MessageSquare size={24} className="text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-text">{formatNumber(engagement.comments.month)}</p>
                </div>
                <p className="text-sm font-medium text-text mb-2">Comments</p>
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    {formatNumber(engagement.comments.today)} today
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {formatNumber(engagement.comments.week)} week
                  </span>
                </div>
              </div>
            </div>

            {/* Shares */}
            <div className="group relative bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-border transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-success/20 to-success/5 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 transition-opacity duration-300 group-hover:opacity-70" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-success/20 to-success/10 border border-success/20">
                    <Share2 size={24} className="text-success" />
                  </div>
                  <p className="text-2xl font-bold text-text">{formatNumber(engagement.shares.month)}</p>
                </div>
                <p className="text-sm font-medium text-text mb-2">Shares</p>
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    {formatNumber(engagement.shares.today)} today
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {formatNumber(engagement.shares.week)} week
                  </span>
                </div>
              </div>
            </div>

            {/* Follows */}
            <div className="group relative bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-border transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-post-hangout/20 to-post-hangout/5 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 transition-opacity duration-300 group-hover:opacity-70" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-post-hangout/20 to-post-hangout/10 border border-post-hangout/20">
                    <UserPlus size={24} className="text-post-hangout" />
                  </div>
                  <p className="text-2xl font-bold text-text">{formatNumber(engagement.follows.month)}</p>
                </div>
                <p className="text-sm font-medium text-text mb-2">Follows</p>
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    {formatNumber(engagement.follows.today)} today
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {formatNumber(engagement.follows.week)} week
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loops Performance */}
      {loops && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play size={20} className="text-post-hangout" />
              <h2 className="text-lg font-semibold text-text">Loops Performance</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-elevated/50 rounded-lg">
                <Users size={14} className="text-text-tertiary" />
                <span className="text-xs text-text-tertiary">Viewers:</span>
                <span className="text-sm font-bold text-text">{formatNumber(loops.uniqueViewers)}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-elevated/50 rounded-lg">
                <span className="text-xs text-text-tertiary">Avg Views/Loop:</span>
                <span className="text-sm font-bold text-text">{loops.avgViewsPerLoop}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Loop Views */}
            <div className="group relative bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-border transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-post-hangout/20 to-post-hangout/5 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 transition-opacity duration-300 group-hover:opacity-70" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-post-hangout/20 to-post-hangout/10 border border-post-hangout/20">
                    <Eye size={24} className="text-post-hangout" />
                  </div>
                  <p className="text-2xl font-bold text-text">{formatNumber(loops.views.month)}</p>
                </div>
                <p className="text-sm font-medium text-text mb-2">Loop Views</p>
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    {formatNumber(loops.views.today)} today
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {formatNumber(loops.views.week)} week
                  </span>
                </div>
              </div>
            </div>

            {/* Loop Likes */}
            <div className="group relative bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-border transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-error/20 to-error/5 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 transition-opacity duration-300 group-hover:opacity-70" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-error/20 to-error/10 border border-error/20">
                    <Heart size={24} className="text-error" />
                  </div>
                  <p className="text-2xl font-bold text-text">{formatNumber(loops.likes.month)}</p>
                </div>
                <p className="text-sm font-medium text-text mb-2">Loop Likes</p>
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    {formatNumber(loops.likes.today)} today
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {formatNumber(loops.likes.week)} week
                  </span>
                </div>
              </div>
            </div>

            {/* Loop Comments */}
            <div className="group relative bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-border transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-primary/5 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 transition-opacity duration-300 group-hover:opacity-70" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                    <MessageSquare size={24} className="text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-text">{formatNumber(loops.comments.month)}</p>
                </div>
                <p className="text-sm font-medium text-text mb-2">Loop Comments</p>
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    {formatNumber(loops.comments.today)} today
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {formatNumber(loops.comments.week)} week
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Trend Chart */}
        <Card className="lg:col-span-2" gradient>
          <CardHeader>
            <CardTitle subtitle="Event activity over time">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                Events Trend
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-48">
              {data.trend.map((day, idx) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex flex-col justify-end h-40">
                    <div
                      className="w-full bg-primary/80 rounded-t transition-all duration-300 group-hover:bg-primary"
                      style={{ height: `${(day.count / maxTrendValue) * 100}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                      title={`${day.count} events`}
                    />
                    
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded-lg px-2 py-1 shadow-lg z-10 whitespace-nowrap pointer-events-none">
                      <p className="text-xs font-medium text-text">{formatNumber(day.count)} events</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-tertiary truncate w-full text-center">
                    {day.label.split(' ')[0]}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Retention Metrics */}
        <Card gradient>
          <CardHeader>
            <CardTitle subtitle="User activity metrics">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-success" />
                Retention
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-br from-success/10 to-success/5 rounded-xl border border-success/20">
                <p className="text-xs font-medium text-success uppercase tracking-wide mb-1">DAU</p>
                <p className="text-3xl font-bold text-text">{formatNumber(data.retention.dau)}</p>
                <p className="text-xs text-text-tertiary mt-1">Daily Active Users</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">WAU</p>
                <p className="text-3xl font-bold text-text">{formatNumber(data.retention.wau)}</p>
                <p className="text-xs text-text-tertiary mt-1">Weekly Active Users</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-post-hangout/10 to-post-hangout/5 rounded-xl border border-post-hangout/20">
                <p className="text-xs font-medium text-post-hangout uppercase tracking-wide mb-1">MAU</p>
                <p className="text-3xl font-bold text-text">{formatNumber(data.retention.mau)}</p>
                <p className="text-xs text-text-tertiary mt-1">Monthly Active Users</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-elevated/50 rounded-lg">
                  <p className="text-xs text-text-tertiary">DAU/WAU</p>
                  <p className="text-lg font-bold text-text">{data.retention.dauWauRatio}%</p>
                </div>
                <div className="p-3 bg-elevated/50 rounded-lg">
                  <p className="text-xs text-text-tertiary">DAU/MAU</p>
                  <p className="text-lg font-bold text-text">{data.retention.dauMauRatio}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Events */}
        <Card gradient>
          <CardHeader>
            <CardTitle subtitle="Most frequent events">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-post-ask" />
                Top Events
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topEvents.length === 0 ? (
              <div className="h-32 flex items-center justify-center">
                <p className="text-text-tertiary">No events recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.topEvents.map((event, idx) => (
                  <div key={event.eventName} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-text truncate">{event.eventName}</p>
                        <p className="text-sm text-text-secondary">{formatNumber(event.count)}</p>
                      </div>
                      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${event.percentage}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-text-tertiary w-12 text-right">{event.percentage}%</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card gradient>
          <CardHeader>
            <CardTitle subtitle="Events by platform">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-post-dream" />
                Platform Distribution
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.platformBreakdown.length === 0 ? (
              <div className="h-32 flex items-center justify-center">
                <p className="text-text-tertiary">No platform data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual Bar */}
                <div className="h-8 rounded-lg overflow-hidden flex">
                  {data.platformBreakdown.map((platform) => (
                    <div
                      key={platform.platform}
                      className="h-full transition-all duration-500"
                      style={{ 
                        width: `${platform.percentage}%`, 
                        backgroundColor: platform.color,
                        minWidth: platform.percentage > 0 ? '20px' : '0'
                      }}
                      title={`${platform.platform}: ${platform.percentage}%`}
                    />
                  ))}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-3">
                  {data.platformBreakdown.map((platform) => {
                    const Icon = getPlatformIcon(platform.platform)
                    return (
                      <div
                        key={platform.platform}
                        className="flex items-center gap-3 p-3 bg-elevated/50 rounded-xl"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${platform.color}20` }}
                        >
                          <Icon size={20} style={{ color: platform.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text capitalize">{platform.platform}</p>
                          <p className="text-xs text-text-tertiary">
                            {formatNumber(platform.count)} ({platform.percentage}%)
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Funnel */}
        <Card gradient>
          <CardHeader>
            <CardTitle subtitle="User journey conversion">
              <div className="flex items-center gap-2">
                <TrendingDown size={18} className="text-post-win" />
                User Funnel
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.funnel.every(f => f.count === 0) ? (
              <div className="h-32 flex items-center justify-center">
                <p className="text-text-tertiary">No funnel data yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.funnel.map((step, idx) => {
                  const maxCount = Math.max(...data.funnel.map(f => f.count), 1)
                  const widthPercent = (step.count / maxCount) * 100
                  
                  return (
                    <div key={step.eventName} className="relative">
                      <div
                        className="h-12 rounded-lg flex items-center px-4 transition-all duration-500"
                        style={{
                          width: `${Math.max(widthPercent, 20)}%`,
                          backgroundColor: `rgba(74, 158, 255, ${0.3 - (idx * 0.05)})`,
                        }}
                      >
                        <span className="text-sm font-medium text-text truncate">{step.name}</span>
                      </div>
                      <div className="absolute right-0 top-0 h-12 flex items-center gap-3 pr-2">
                        <span className="text-sm font-bold text-text">{formatNumber(step.count)}</span>
                        {idx > 0 && (
                          <span className={`text-xs font-medium ${step.dropOffRate > 50 ? 'text-error' : 'text-success'}`}>
                            {step.dropOffRate > 0 && <ArrowDown size={12} className="inline" />}
                            {step.dropOffRate}% drop
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Insights */}
        <Card gradient>
          <CardHeader>
            <CardTitle subtitle="Session behavior analysis">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-success" />
                Session Insights
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-elevated/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-text">{data.sessionInsights.avgEventsPerSession.toFixed(1)}</p>
                  <p className="text-xs text-text-tertiary">Avg Events/Session</p>
                </div>
                <div className="p-3 bg-elevated/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-text">{data.sessionInsights.avgSessionDurationMinutes.toFixed(1)}m</p>
                  <p className="text-xs text-text-tertiary">Avg Duration</p>
                </div>
                <div className="p-3 bg-elevated/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-text">{data.sessionInsights.bounceRate}%</p>
                  <p className="text-xs text-text-tertiary">Bounce Rate</p>
                </div>
              </div>

              {/* Top Pages */}
              <div>
                <p className="text-sm font-medium text-text mb-2">Top Pages</p>
                {data.sessionInsights.topPages.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No page data yet</p>
                ) : (
                  <div className="space-y-2">
                    {data.sessionInsights.topPages.map((page, idx) => (
                      <div
                        key={page.url}
                        className="flex items-center justify-between p-2 bg-elevated/30 rounded-lg hover:bg-elevated/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <ExternalLink size={14} className="text-text-tertiary shrink-0" />
                          <p className="text-sm text-text truncate">{page.url}</p>
                        </div>
                        <span className="text-sm font-medium text-text-secondary ml-2">{formatNumber(page.count)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

