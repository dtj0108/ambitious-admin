'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Bot, 
  Zap, 
  Brain, 
  Sparkles,
  Play, 
  Pause, 
  Settings, 
  Clock, 
  FileText,
  Heart,
  MessageCircle,
  Calendar,
  RefreshCw,
  Trash2,
  Send,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Button } from './Button'
import { NPCCreateModal } from './NPCCreateModal'
import type { 
  NPCProfile, 
  NPCPostQueueItem,
  NPCEngagementLog,
  ScheduleMode,
} from '@/lib/queries-npc'

interface NPCDetailModalProps {
  npcId: string | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

export function NPCDetailModal({ npcId, isOpen, onClose, onUpdated }: NPCDetailModalProps) {
  const [npc, setNPC] = useState<NPCProfile | null>(null)
  const [queue, setQueue] = useState<NPCPostQueueItem[]>([])
  const [engagementLogs, setEngagementLogs] = useState<NPCEngagementLog[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'activity'>('overview')
  
  // Actions
  const [generating, setGenerating] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [generationCount, setGenerationCount] = useState(3)
  
  // Queue selection
  const [selectedQueueIds, setSelectedQueueIds] = useState<Set<string>>(new Set())
  const [deletingSelected, setDeletingSelected] = useState(false)
  
  // Quick schedule edit
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('posts_per_day')
  const [postsPerDay, setPostsPerDay] = useState(3)
  const [postsPerWeek, setPostsPerWeek] = useState(10)
  const [minIntervalHours, setMinIntervalHours] = useState(4)
  const [maxIntervalHours, setMaxIntervalHours] = useState(8)
  const [activeHoursStart, setActiveHoursStart] = useState(8)
  const [activeHoursEnd, setActiveHoursEnd] = useState(22)
  const [savingSchedule, setSavingSchedule] = useState(false)
  
  const fetchNPCDetails = async () => {
    if (!npcId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/npc/${npcId}?include=all`)
      const data = await response.json()
      
      setNPC(data.npc)
      setQueue(data.queue?.items || [])
      setEngagementLogs(data.engagement?.logs || [])
      
      // Initialize schedule settings from NPC data
      if (data.npc?.posting_times) {
        const pt = data.npc.posting_times
        setScheduleMode(pt.mode || 'posts_per_day')
        setPostsPerDay(pt.posts_per_day || 3)
        setPostsPerWeek(pt.posts_per_week || 10)
        setMinIntervalHours(pt.min_interval_hours || 4)
        setMaxIntervalHours(pt.max_interval_hours || 8)
        setActiveHoursStart(pt.active_hours?.start || 8)
        setActiveHoursEnd(pt.active_hours?.end || 22)
      }
    } catch (error) {
      console.error('Error fetching NPC details:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && npcId) {
      fetchNPCDetails()
    }
  }, [isOpen, npcId])

  const handleToggleActive = async () => {
    if (!npc) return
    
    setToggling(true)
    try {
      await fetch(`/api/npc/${npc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggle_active: !npc.is_active }),
      })
      fetchNPCDetails()
      onUpdated()
    } catch (error) {
      console.error('Error toggling NPC:', error)
    } finally {
      setToggling(false)
    }
  }

  const handleGeneratePosts = async () => {
    if (!npc) return
    
    setGenerating(true)
    try {
      const response = await fetch('/api/npc/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          npc_id: npc.id,
          count: generationCount,
        }),
      })
      
      const result = await response.json()
      console.log('Generation result:', result)
      
      fetchNPCDetails()
    } catch (error) {
      console.error('Error generating posts:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleDeleteQueueItem = async (itemId: string) => {
    try {
      await fetch('/api/npc/queue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [itemId] }),
      })
      setSelectedQueueIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
      fetchNPCDetails()
    } catch (error) {
      console.error('Error deleting queue item:', error)
    }
  }

  const handleDeleteSelectedItems = async () => {
    if (selectedQueueIds.size === 0) return
    
    if (!confirm(`Delete ${selectedQueueIds.size} selected item${selectedQueueIds.size > 1 ? 's' : ''}? This cannot be undone.`)) {
      return
    }
    
    setDeletingSelected(true)
    try {
      await fetch('/api/npc/queue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedQueueIds) }),
      })
      setSelectedQueueIds(new Set())
      fetchNPCDetails()
    } catch (error) {
      console.error('Error deleting selected queue items:', error)
    } finally {
      setDeletingSelected(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedQueueIds.size === queue.length) {
      setSelectedQueueIds(new Set())
    } else {
      setSelectedQueueIds(new Set(queue.map(item => item.id)))
    }
  }

  const handleToggleSelect = (itemId: string) => {
    setSelectedQueueIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleSaveSchedule = async () => {
    if (!npc) return
    
    setSavingSchedule(true)
    try {
      const postingTimes = {
        mode: scheduleMode,
        posts_per_day: postsPerDay,
        posts_per_week: postsPerWeek,
        min_interval_hours: minIntervalHours,
        max_interval_hours: maxIntervalHours,
        active_hours: { start: activeHoursStart, end: activeHoursEnd },
        randomize_minutes: true,
        timezone: npc.posting_times?.timezone || 'America/New_York',
      }
      
      await fetch(`/api/npc/${npc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posting_times: postingTimes }),
      })
      
      fetchNPCDetails()
      onUpdated()
    } catch (error) {
      console.error('Error saving schedule:', error)
    } finally {
      setSavingSchedule(false)
    }
  }

  const handleDeleteNPC = async () => {
    if (!npc || !confirm('Are you sure you want to delete this NPC? This action cannot be undone.')) {
      return
    }
    
    try {
      await fetch(`/api/npc/${npc.id}`, { method: 'DELETE' })
      onUpdated()
      onClose()
    } catch (error) {
      console.error('Error deleting NPC:', error)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const target = new Date(date)
    const diffMs = target.getTime() - now.getTime()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)
    const diffDays = Math.round(diffMs / 86400000)

    if (diffMs < 0) {
      return 'Overdue'
    } else if (diffMins < 60) {
      return `In ${diffMins}m`
    } else if (diffHours < 24) {
      return `In ${diffHours}h`
    } else {
      return `In ${diffDays}d`
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={14} className="text-post-win" />
      case 'published':
        return <CheckCircle size={14} className="text-success" />
      case 'failed':
        return <XCircle size={14} className="text-error" />
      case 'cancelled':
        return <AlertCircle size={14} className="text-text-tertiary" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-post-win/10 text-post-win'
      case 'published':
        return 'bg-success/10 text-success'
      case 'failed':
        return 'bg-error/10 text-error'
      case 'cancelled':
        return 'bg-text-tertiary/10 text-text-tertiary'
      default:
        return 'bg-elevated text-text-secondary'
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-border/50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-4">
              {npc?.profile?.avatar_url ? (
                <img 
                  src={npc.profile.avatar_url} 
                  alt={npc.persona_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white">
                  <Bot size={24} />
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-text flex items-center gap-2">
                  {npc?.persona_name || 'Loading...'}
                  {npc?.ai_model === 'openai' && <Zap size={16} className="text-green-400" />}
                  {npc?.ai_model === 'claude' && <Brain size={16} className="text-orange-400" />}
                  {npc?.ai_model === 'xai' && <Sparkles size={16} className="text-blue-400" />}
                </h2>
                {npc?.profile?.username && (
                  <p className="text-sm text-text-secondary">@{npc.profile.username}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {npc && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  npc.is_active
                    ? 'bg-success/10 text-success'
                    : 'bg-text-tertiary/10 text-text-tertiary'
                }`}>
                  {npc.is_active ? 'Active' : 'Inactive'}
                </span>
              )}
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-elevated transition-colors">
                <X size={20} className="text-text-secondary" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border/50">
            {(['overview', 'queue', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-text-secondary hover:text-text hover:bg-elevated/50'
                }`}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'queue' && `Queue (${queue.filter(q => q.status === 'pending').length})`}
                {tab === 'activity' && 'Activity Log'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw size={24} className="animate-spin text-text-tertiary" />
              </div>
            ) : !npc ? (
              <div className="flex items-center justify-center h-64 text-text-secondary">
                NPC not found
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="p-6 space-y-6">
                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant={npc.is_active ? 'secondary' : 'primary'}
                        onClick={handleToggleActive}
                        disabled={toggling}
                      >
                        {npc.is_active ? <Pause size={16} /> : <Play size={16} />}
                        {npc.is_active ? 'Pause' : 'Activate'}
                      </Button>
                      <Button variant="secondary" onClick={() => setEditModalOpen(true)}>
                        <Settings size={16} />
                        Edit Settings
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={handleGeneratePosts}
                        disabled={generating || !npc.is_active}
                      >
                        <Send size={16} className={generating ? 'animate-pulse' : ''} />
                        {generating ? 'Generating...' : 'Generate Posts'}
                      </Button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-elevated rounded-xl">
                        <div className="flex items-center gap-2 text-text-secondary mb-1">
                          <FileText size={14} />
                          <span className="text-xs">Posts Generated</span>
                        </div>
                        <p className="text-2xl font-bold text-text">{npc.total_posts_generated}</p>
                      </div>
                      <div className="p-4 bg-elevated rounded-xl">
                        <div className="flex items-center gap-2 text-text-secondary mb-1">
                          <Heart size={14} className="text-error" />
                          <span className="text-xs">Likes Given</span>
                        </div>
                        <p className="text-2xl font-bold text-text">{npc.total_likes_given}</p>
                      </div>
                      <div className="p-4 bg-elevated rounded-xl">
                        <div className="flex items-center gap-2 text-text-secondary mb-1">
                          <MessageCircle size={14} className="text-primary" />
                          <span className="text-xs">Comments Given</span>
                        </div>
                        <p className="text-2xl font-bold text-text">{npc.total_comments_given}</p>
                      </div>
                      <div className="p-4 bg-elevated rounded-xl">
                        <div className="flex items-center gap-2 text-text-secondary mb-1">
                          <Clock size={14} />
                          <span className="text-xs">Last Active</span>
                        </div>
                        <p className="text-sm font-medium text-text">{formatDate(npc.last_activity_at)}</p>
                      </div>
                    </div>

                    {/* Configuration Summary */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Persona */}
                      <div className="p-4 bg-elevated rounded-xl">
                        <h4 className="text-sm font-semibold text-text mb-3">Persona</h4>
                        {npc.persona_description && (
                          <p className="text-sm text-text-secondary mb-3">{npc.persona_description}</p>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-text-secondary">Tone:</span>
                            <span className="text-text capitalize">{npc.tone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-text-secondary">AI Model:</span>
                            <span className="text-text flex items-center gap-1">
                              {npc.ai_model === 'openai' && (
                                <>
                                  <Zap size={12} className="text-green-400" />
                                  OpenAI GPT-4o
                                </>
                              )}
                              {npc.ai_model === 'claude' && (
                                <>
                                  <Brain size={12} className="text-orange-400" />
                                  Claude Sonnet
                                </>
                              )}
                              {npc.ai_model === 'xai' && (
                                <>
                                  <Sparkles size={12} className="text-blue-400" />
                                  xAI Grok
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Topics */}
                      <div className="p-4 bg-elevated rounded-xl">
                        <h4 className="text-sm font-semibold text-text mb-3">Topics</h4>
                        <div className="flex flex-wrap gap-2">
                          {npc.topics.map((topic, i) => (
                            <span 
                              key={i}
                              className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg"
                            >
                              {topic}
                            </span>
                          ))}
                          {npc.topics.length === 0 && (
                            <span className="text-sm text-text-tertiary">No topics configured</span>
                          )}
                        </div>
                      </div>

                      {/* Quick Schedule Editor */}
                      <div className="p-4 bg-elevated rounded-xl md:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold text-text">Posting Schedule</h4>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSaveSchedule}
                            disabled={savingSchedule}
                          >
                            {savingSchedule ? 'Saving...' : 'Save Schedule'}
                          </Button>
                        </div>
                        
                        {/* Schedule Mode */}
                        <div className="mb-4">
                          <label className="block text-xs text-text-secondary mb-2">Schedule Mode</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => setScheduleMode('posts_per_day')}
                              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                                scheduleMode === 'posts_per_day'
                                  ? 'bg-primary text-white'
                                  : 'bg-surface text-text-secondary hover:text-text'
                              }`}
                            >
                              Posts/Day
                            </button>
                            <button
                              onClick={() => setScheduleMode('posts_per_week')}
                              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                                scheduleMode === 'posts_per_week'
                                  ? 'bg-primary text-white'
                                  : 'bg-surface text-text-secondary hover:text-text'
                              }`}
                            >
                              Posts/Week
                            </button>
                            <button
                              onClick={() => setScheduleMode('variable_interval')}
                              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                                scheduleMode === 'variable_interval'
                                  ? 'bg-primary text-white'
                                  : 'bg-surface text-text-secondary hover:text-text'
                              }`}
                            >
                              Variable
                            </button>
                          </div>
                        </div>

                        {/* Mode-specific settings */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {scheduleMode === 'posts_per_day' && (
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">Posts per day</label>
                              <input
                                type="number"
                                value={postsPerDay}
                                onChange={(e) => setPostsPerDay(parseInt(e.target.value) || 1)}
                                min={1}
                                max={24}
                                className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text"
                              />
                            </div>
                          )}
                          {scheduleMode === 'posts_per_week' && (
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">Posts per week</label>
                              <input
                                type="number"
                                value={postsPerWeek}
                                onChange={(e) => setPostsPerWeek(parseInt(e.target.value) || 1)}
                                min={1}
                                max={50}
                                className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text"
                              />
                            </div>
                          )}
                          {scheduleMode === 'variable_interval' && (
                            <>
                              <div>
                                <label className="block text-xs text-text-secondary mb-1">Min hours between</label>
                                <input
                                  type="number"
                                  value={minIntervalHours}
                                  onChange={(e) => setMinIntervalHours(parseInt(e.target.value) || 1)}
                                  min={1}
                                  max={24}
                                  className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-text-secondary mb-1">Max hours between</label>
                                <input
                                  type="number"
                                  value={maxIntervalHours}
                                  onChange={(e) => setMaxIntervalHours(parseInt(e.target.value) || 1)}
                                  min={1}
                                  max={48}
                                  className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text"
                                />
                              </div>
                            </>
                          )}
                          <div>
                            <label className="block text-xs text-text-secondary mb-1">Active from</label>
                            <select
                              value={activeHoursStart}
                              onChange={(e) => setActiveHoursStart(parseInt(e.target.value))}
                              className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text"
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-text-secondary mb-1">Active until</label>
                            <select
                              value={activeHoursEnd}
                              onChange={(e) => setActiveHoursEnd(parseInt(e.target.value))}
                              className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text"
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <p className="text-xs text-text-tertiary">
                          Posts will be scheduled at random times within active hours. Changes apply to new posts only.
                        </p>
                      </div>

                      {/* Engagement */}
                      <div className="p-4 bg-elevated rounded-xl">
                        <h4 className="text-sm font-semibold text-text mb-3">Engagement</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-text-secondary">Auto-Like:</span>
                            <span className={npc.engagement_settings?.auto_like ? 'text-success' : 'text-text-tertiary'}>
                              {npc.engagement_settings?.auto_like ? `${npc.engagement_settings.likes_per_day}/day` : 'Off'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-text-secondary">Auto-Comment:</span>
                            <span className={npc.engagement_settings?.auto_comment ? 'text-success' : 'text-text-tertiary'}>
                              {npc.engagement_settings?.auto_comment ? `${npc.engagement_settings.comments_per_day}/day` : 'Off'}
                            </span>
                          </div>
                          {npc.engagement_settings?.auto_comment && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-text-secondary">Style:</span>
                              <span className="text-text capitalize">{npc.engagement_settings.engagement_style}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="p-4 border border-error/30 bg-error/5 rounded-xl">
                      <h4 className="text-sm font-semibold text-error mb-2">Danger Zone</h4>
                      <p className="text-xs text-text-secondary mb-3">
                        Deleting this NPC will remove all configuration but keep the user account.
                      </p>
                      <Button variant="ghost" size="sm" onClick={handleDeleteNPC}>
                        <Trash2 size={14} />
                        Delete NPC
                      </Button>
                    </div>
                  </div>
                )}

                {/* Queue Tab */}
                {activeTab === 'queue' && (
                  <div className="p-6">
                    {/* Generate Controls */}
                    <div className="flex items-center gap-4 mb-6 p-4 bg-elevated rounded-xl">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text mb-1">Generate New Posts</p>
                        <p className="text-xs text-text-secondary">Add posts to the queue</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={generationCount}
                          onChange={(e) => setGenerationCount(parseInt(e.target.value))}
                          className="h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text"
                        >
                          <option value={1}>1 post</option>
                          <option value={3}>3 posts</option>
                          <option value={5}>5 posts</option>
                          <option value={10}>10 posts</option>
                        </select>
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={handleGeneratePosts}
                          disabled={generating || !npc.is_active}
                        >
                          {generating ? 'Generating...' : 'Generate'}
                        </Button>
                      </div>
                    </div>

                    {/* Queue List */}
                    {queue.length === 0 ? (
                      <div className="text-center py-12">
                        <Clock size={32} className="mx-auto text-text-tertiary mb-3" />
                        <p className="text-text-secondary">No posts in queue</p>
                        <p className="text-sm text-text-tertiary">Generate some posts to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Selection Header */}
                        <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border/50">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedQueueIds.size === queue.length && queue.length > 0}
                              onChange={handleSelectAll}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 bg-elevated"
                            />
                            <span className="text-sm text-text-secondary">
                              {selectedQueueIds.size === 0 
                                ? 'Select all' 
                                : `${selectedQueueIds.size} of ${queue.length} selected`}
                            </span>
                          </label>
                          
                          {/* Bulk Actions */}
                          {selectedQueueIds.size > 0 && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleDeleteSelectedItems}
                              disabled={deletingSelected}
                              className="!bg-error/10 !text-error hover:!bg-error/20"
                            >
                              <Trash2 size={14} />
                              {deletingSelected ? 'Deleting...' : `Delete (${selectedQueueIds.size})`}
                            </Button>
                          )}
                        </div>

                        {/* Queue Items */}
                        {queue.map((item) => (
                          <div 
                            key={item.id}
                            className={`p-4 bg-elevated rounded-xl border transition-colors ${
                              selectedQueueIds.has(item.id) 
                                ? 'border-primary/50 bg-primary/5' 
                                : 'border-border/50'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Checkbox */}
                              <div className="pt-0.5">
                                <input
                                  type="checkbox"
                                  checked={selectedQueueIds.has(item.id)}
                                  onChange={() => handleToggleSelect(item.id)}
                                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 bg-surface cursor-pointer"
                                />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                                    {getStatusIcon(item.status)}
                                    <span className="ml-1 capitalize">{item.status}</span>
                                  </span>
                                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded capitalize">
                                    {item.post_type}
                                  </span>
                                </div>
                                <p className="text-sm text-text line-clamp-2">{item.content}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary">
                                  <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {formatDate(item.scheduled_for)}
                                  </span>
                                  {item.status === 'pending' && (
                                    <span className="text-post-win">
                                      {formatRelativeTime(item.scheduled_for)}
                                    </span>
                                  )}
                                </div>
                                {item.error_message && (
                                  <p className="text-xs text-error mt-2">{item.error_message}</p>
                                )}
                              </div>
                              
                              {/* Delete Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteQueueItem(item.id)}
                                className="!text-text-tertiary hover:!text-error"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                  <div className="p-6">
                    {engagementLogs.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle size={32} className="mx-auto text-text-tertiary mb-3" />
                        <p className="text-text-secondary">No activity yet</p>
                        <p className="text-sm text-text-tertiary">Engagement actions will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {engagementLogs.map((log) => (
                          <div 
                            key={log.id}
                            className="flex items-start gap-3 p-3 bg-elevated rounded-xl"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              log.action_type === 'like' ? 'bg-error/10' : 'bg-primary/10'
                            }`}>
                              {log.action_type === 'like' ? (
                                <Heart size={14} className="text-error" />
                              ) : (
                                <MessageCircle size={14} className="text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-text capitalize">
                                  {log.action_type}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                  log.status === 'completed' 
                                    ? 'bg-success/10 text-success' 
                                    : 'bg-error/10 text-error'
                                }`}>
                                  {log.status}
                                </span>
                              </div>
                              {log.comment_content && (
                                <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                                  "{log.comment_content}"
                                </p>
                              )}
                              {log.error_message && (
                                <p className="text-xs text-error mt-1">{log.error_message}</p>
                              )}
                              <p className="text-xs text-text-tertiary mt-1">
                                {formatDate(log.created_at)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-surface/50">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button variant="secondary" onClick={fetchNPCDetails} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {npc && (
        <NPCCreateModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onCreated={() => {
            setEditModalOpen(false)
            fetchNPCDetails()
            onUpdated()
          }}
          editNPC={npc}
        />
      )}
    </>
  )
}

