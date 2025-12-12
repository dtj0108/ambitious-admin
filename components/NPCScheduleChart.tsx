'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components'
import {
  Clock,
  Calendar,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
} from 'lucide-react'

interface SchedulePost {
  id: string
  npcId: string
  npcName: string
  postType: string
  status: 'pending' | 'published'
}

interface HourlySummary {
  hour: number
  label: string
  totalPosts: number
  pendingPosts: number
  hasGap: boolean
}

interface ScheduleStats {
  totalPendingToday: number
  totalPendingWeek: number
  hoursWithCoverage: number
  hoursWithGaps: number
  busiestHour: string
  busiestHourCount: number
}

interface ScheduleData {
  coverage: Record<string, Record<number, SchedulePost[]>>
  hourlySummary: HourlySummary[]
  todayPosts: Array<{
    id: string
    scheduledFor: string
    npcId: string
    npcName: string
    postType: string
    status: 'pending'
  }>
  gapHours: string[]
  stats: ScheduleStats
  activeNPCs: number
}

// Color palette for NPCs
const NPC_COLORS = [
  '#4A9EFF', // Blue
  '#FF6B6B', // Red
  '#4ECB71', // Green
  '#FFB347', // Orange
  '#9B59B6', // Purple
  '#1ABC9C', // Teal
  '#E74C3C', // Crimson
  '#3498DB', // Sky Blue
  '#F39C12', // Amber
  '#2ECC71', // Emerald
]

function getNPCColor(npcId: string): string {
  // Generate a consistent color based on the NPC ID
  let hash = 0
  for (let i = 0; i < npcId.length; i++) {
    hash = npcId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return NPC_COLORS[Math.abs(hash) % NPC_COLORS.length]
}

export function NPCScheduleChart() {
  const [data, setData] = useState<ScheduleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState(0) // 0 = today, 1 = tomorrow, etc.
  const [selectedHour, setSelectedHour] = useState<number | null>(null) // Expanded hour view

  const fetchSchedule = async () => {
    try {
      setLoading(true)
      setError(null)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const response = await fetch(`/api/npc?schedule=true&timezone=${encodeURIComponent(timezone)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch schedule')
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching schedule:', err)
      setError('Failed to load schedule data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedule()
  }, [])

  if (loading && !data) {
    return (
      <Card padding="lg" className="animate-pulse">
        <div className="h-64 bg-elevated/50 rounded-xl" />
      </Card>
    )
  }

  if (error && !data) {
    return (
      <Card padding="lg">
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <AlertTriangle size={32} className="text-error" />
          <p className="text-text-secondary">{error}</p>
          <button
            onClick={fetchSchedule}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </Card>
    )
  }

  if (!data) return null

  // Get the dates for navigation
  const dates = Object.keys(data.coverage).sort()
  const currentDate = dates[selectedDay] || dates[0]
  const currentDayData = data.coverage[currentDate] || {}
  
  // Format date for display
  const formatDayLabel = (dateStr: string, index: number) => {
    if (index === 0) return 'Today'
    if (index === 1) return 'Tomorrow'
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-primary" />
            <span className="text-xs text-text-secondary">Today</span>
          </div>
          <p className="text-2xl font-bold text-text">{data.stats.totalPendingToday}</p>
          <p className="text-xs text-text-tertiary">posts scheduled</p>
        </div>
        
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-success" />
            <span className="text-xs text-text-secondary">This Week</span>
          </div>
          <p className="text-2xl font-bold text-text">{data.stats.totalPendingWeek}</p>
          <p className="text-xs text-text-tertiary">posts scheduled</p>
        </div>
        
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-success" />
            <span className="text-xs text-text-secondary">Coverage</span>
          </div>
          <p className="text-2xl font-bold text-text">{data.stats.hoursWithCoverage}</p>
          <p className="text-xs text-text-tertiary">hours covered</p>
        </div>
        
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={16} className={data.stats.hoursWithGaps > 0 ? 'text-error' : 'text-success'} />
            <span className="text-xs text-text-secondary">Gaps</span>
          </div>
          <p className={`text-2xl font-bold ${data.stats.hoursWithGaps > 0 ? 'text-error' : 'text-success'}`}>
            {data.stats.hoursWithGaps}
          </p>
          <p className="text-xs text-text-tertiary">hours empty</p>
        </div>
      </div>

      {/* 24-Hour Chart */}
      <Card padding="none" className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-surface/30">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            <h3 className="font-semibold text-text">24-Hour Coverage</h3>
          </div>
          
          {/* Day Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDay(Math.max(0, selectedDay - 1))}
              disabled={selectedDay === 0}
              className="p-1.5 rounded-lg hover:bg-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} className="text-text-secondary" />
            </button>
            <span className="text-sm font-medium text-text min-w-[120px] text-center">
              {formatDayLabel(currentDate, selectedDay)}
            </span>
            <button
              onClick={() => setSelectedDay(Math.min(dates.length - 1, selectedDay + 1))}
              disabled={selectedDay >= dates.length - 1}
              className="p-1.5 rounded-lg hover:bg-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} className="text-text-secondary" />
            </button>
          </div>
          
          <button
            onClick={fetchSchedule}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-elevated transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={`text-text-secondary ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Chart Grid */}
        <div className="p-4">
          <div className="grid grid-cols-24 gap-1">
            {/* Hour labels */}
            {Array.from({ length: 24 }).map((_, hour) => (
              <div key={`label-${hour}`} className="text-center">
                <span className="text-[10px] text-text-tertiary">
                  {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
                </span>
              </div>
            ))}
            
            {/* Coverage cells */}
            {Array.from({ length: 24 }).map((_, hour) => {
              const posts = currentDayData[hour] || []
              const hasContent = posts.length > 0
              const postCount = posts.length
              const isSelected = selectedHour === hour
              
              return (
                <div
                  key={`cell-${hour}`}
                  onClick={() => setSelectedHour(isSelected ? null : hour)}
                  className={`
                    relative h-16 rounded-lg border transition-all cursor-pointer
                    ${isSelected
                      ? 'border-primary ring-2 ring-primary/50 bg-primary/20 scale-105 z-10'
                      : hasContent 
                        ? 'border-primary/30 bg-gradient-to-b from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20' 
                        : 'border-border/30 bg-elevated/30 hover:bg-elevated/50'
                    }
                  `}
                  title={`Click to ${isSelected ? 'collapse' : 'expand'}`}
                >
                  {/* NPC color indicators */}
                  <div className="absolute inset-1 flex flex-col gap-0.5 overflow-hidden">
                    {posts.slice(0, 4).map((post) => (
                      <div
                        key={post.id}
                        className="flex-1 rounded-sm min-h-[4px]"
                        style={{ backgroundColor: getNPCColor(post.npcId) }}
                        title={post.npcName}
                      />
                    ))}
                    {posts.length > 4 && (
                      <div className="text-[8px] text-primary font-bold text-center">
                        +{posts.length - 4}
                      </div>
                    )}
                  </div>
                  
                  {/* Gap indicator */}
                  {!hasContent && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <XCircle size={12} className="text-text-tertiary" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Expanded Hour View */}
          {selectedHour !== null && (
            <div className="mt-4 p-4 bg-elevated/50 rounded-xl border border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  <h4 className="font-semibold text-text">
                    {selectedHour === 0 ? '12:00 AM' : selectedHour < 12 ? `${selectedHour}:00 AM` : selectedHour === 12 ? '12:00 PM' : `${selectedHour - 12}:00 PM`}
                    {' - '}
                    {selectedHour === 23 ? '12:00 AM' : selectedHour < 11 ? `${selectedHour + 1}:00 AM` : selectedHour === 11 ? '12:00 PM' : `${selectedHour - 11}:00 PM`}
                  </h4>
                  <span className="text-xs text-text-tertiary">
                    ({formatDayLabel(currentDate, selectedDay)})
                  </span>
                </div>
                <button
                  onClick={() => setSelectedHour(null)}
                  className="p-1.5 rounded-lg hover:bg-surface transition-colors"
                >
                  <X size={16} className="text-text-secondary" />
                </button>
              </div>
              
              {(currentDayData[selectedHour] || []).length === 0 ? (
                <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <AlertTriangle size={20} className="text-warning" />
                  <div>
                    <p className="text-sm font-medium text-text">No posts scheduled</p>
                    <p className="text-xs text-text-secondary">
                      This is a coverage gap. Consider scheduling an NPC to post during this hour.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {(currentDayData[selectedHour] || []).map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border/30"
                    >
                      <div
                        className="w-3 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: getNPCColor(post.npcId) }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text">{post.npcName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-text-tertiary capitalize flex items-center gap-1">
                            <FileText size={10} />
                            {post.postType}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            post.status === 'pending' 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-success/10 text-success'
                          }`}>
                            {post.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-text-secondary">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gradient-to-b from-primary/20 to-primary/10 border border-primary/30" />
                <span>Has posts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-elevated/30 border border-border/30" />
                <span>Gap (no posts)</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-tertiary">
                <span>•</span>
                <span>Click any hour to expand</span>
              </div>
            </div>
            
            {data.gapHours.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <AlertTriangle size={12} className="text-warning" />
                <span className="text-text-secondary">
                  Gaps at: <span className="text-text font-medium">{data.gapHours.slice(0, 5).join(', ')}</span>
                  {data.gapHours.length > 5 && ` +${data.gapHours.length - 5} more`}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Today's Timeline */}
      {selectedDay === 0 && data.todayPosts.length > 0 && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-primary" />
            <h4 className="font-semibold text-text">Today&apos;s Schedule</h4>
            <span className="text-xs text-text-tertiary">({data.todayPosts.length} posts)</span>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.todayPosts.map((post) => {
              const time = new Date(post.scheduledFor).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })
              const isPast = new Date(post.scheduledFor) < new Date()
              
              return (
                <div
                  key={post.id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    isPast ? 'bg-elevated/30 opacity-60' : 'bg-elevated/50'
                  }`}
                >
                  <div
                    className="w-2 h-8 rounded-full"
                    style={{ backgroundColor: getNPCColor(post.npcId) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{post.npcName}</p>
                    <p className="text-xs text-text-tertiary capitalize">{post.postType}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${isPast ? 'text-text-tertiary' : 'text-text'}`}>
                      {time}
                    </p>
                    <p className={`text-xs ${isPast ? 'text-text-tertiary' : 'text-success'}`}>
                      {isPast ? 'Past' : 'Upcoming'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

