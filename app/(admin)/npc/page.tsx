'use client'

import { useState, useEffect } from 'react'
import { Card, Button } from '@/components'
import { 
  Bot, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Play,
  Settings,
  Sparkles,
  MessageCircle,
  Heart,
  Clock,
  ChevronLeft,
  ChevronRight,
  Brain,
  Zap,
  FileText,
} from 'lucide-react'
import { 
  type NPCProfile, 
  type NPCStats,
  type NPCListOptions,
} from '@/lib/queries-npc'
import { NPCCreateModal } from '@/components/NPCCreateModal'
import { NPCDetailModal } from '@/components/NPCDetailModal'

type SortOption = 'newest' | 'oldest' | 'most_posts' | 'most_active' | 'name'

export default function NPCPage() {
  const [npcs, setNPCs] = useState<NPCProfile[]>([])
  const [stats, setStats] = useState<NPCStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Search & Filters
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined)
  const [aiModelFilter, setAIModelFilter] = useState<'openai' | 'claude' | 'xai' | undefined>(undefined)
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedNPCId, setSelectedNPCId] = useState<string | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  
  // Processing
  const [processing, setProcessing] = useState(false)

  const fetchNPCs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sortBy,
      })
      
      if (search) params.set('search', search)
      if (isActiveFilter !== undefined) params.set('isActive', isActiveFilter.toString())
      if (aiModelFilter) params.set('aiModel', aiModelFilter)

      const response = await fetch(`/api/npc?${params}`)
      const data = await response.json()
      
      setNPCs(data.npcs || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching NPCs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/npc?stats=true')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching NPC stats:', error)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchNPCs()
  }, [page, pageSize, search, sortBy, isActiveFilter, aiModelFilter])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleToggleActive = async (npcId: string, currentActive: boolean) => {
    try {
      await fetch(`/api/npc/${npcId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggle_active: !currentActive }),
      })
      fetchNPCs()
      fetchStats()
    } catch (error) {
      console.error('Error toggling NPC:', error)
    }
  }

  const handleProcessQueue = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/npc/process', { method: 'POST' })
      const result = await response.json()
      console.log('Process result:', result)
      fetchNPCs()
      fetchStats()
    } catch (error) {
      console.error('Error processing queue:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleNPCClick = (npcId: string) => {
    setSelectedNPCId(npcId)
    setDetailModalOpen(true)
  }

  const handleNPCCreated = () => {
    fetchNPCs()
    fetchStats()
    setCreateModalOpen(false)
  }

  const handleNPCUpdated = () => {
    fetchNPCs()
    fetchStats()
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

  const getModelIcon = (model: string) => {
    switch (model) {
      case 'openai':
        return <Zap size={14} className="text-green-400" />
      case 'claude':
        return <Brain size={14} className="text-orange-400" />
      case 'xai':
        return <Sparkles size={14} className="text-blue-400" />
      default:
        return <Bot size={14} className="text-text-secondary" />
    }
  }

  const getModelLabel = (model: string) => {
    switch (model) {
      case 'openai':
        return 'GPT-4o'
      case 'claude':
        return 'Claude'
      case 'xai':
        return 'Grok'
      default:
        return model
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">NPC Management</h1>
          <p className="text-text-secondary mt-1">
            Manage AI-powered accounts and automated posting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={handleProcessQueue}
            disabled={processing}
          >
            <Play size={16} className={processing ? 'animate-pulse' : ''} />
            Process Queue
          </Button>
          <Button variant="secondary" onClick={() => { fetchNPCs(); fetchStats(); }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} />
            Create NPC
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{stats?.total || 0}</p>
              <p className="text-sm text-text-secondary">Total NPCs</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Sparkles size={24} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{stats?.active || 0}</p>
              <p className="text-sm text-text-secondary">Active</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-post-win/10 flex items-center justify-center">
              <FileText size={24} className="text-post-win" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{stats?.totalPostsGenerated || 0}</p>
              <p className="text-sm text-text-secondary">Posts Generated</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
              <Clock size={24} className="text-error" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{stats?.pendingQueueItems || 0}</p>
              <p className="text-sm text-text-secondary">Pending Posts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Model Breakdown */}
      {stats && (stats.byModel.openai > 0 || stats.byModel.claude > 0 || stats.byModel.xai > 0) && (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-text mb-3">NPCs by AI Model</h3>
          <div className="flex flex-wrap gap-4">
            {stats.byModel.openai > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg border border-border/50">
                <Zap size={16} className="text-green-400" />
                <span className="text-sm text-text">OpenAI</span>
                <span className="text-sm font-semibold text-text">{stats.byModel.openai}</span>
              </div>
            )}
            {stats.byModel.claude > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg border border-border/50">
                <Brain size={16} className="text-orange-400" />
                <span className="text-sm text-text">Claude</span>
                <span className="text-sm font-semibold text-text">{stats.byModel.claude}</span>
              </div>
            )}
            {stats.byModel.xai > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg border border-border/50">
                <Sparkles size={16} className="text-blue-400" />
                <span className="text-sm text-text">xAI Grok</span>
                <span className="text-sm font-semibold text-text">{stats.byModel.xai}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Search and Filters */}
      <Card padding="none">
        <div className="p-4 border-b border-border/50 bg-surface/30">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search by persona name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-elevated/50 border border-border/50 rounded-xl text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:bg-surface transition-all"
              />
            </div>

            {/* Filters */}
            <select
              value={isActiveFilter === undefined ? 'all' : isActiveFilter.toString()}
              onChange={(e) => {
                const val = e.target.value
                setIsActiveFilter(val === 'all' ? undefined : val === 'true')
                setPage(1)
              }}
              className="h-11 px-4 bg-elevated/50 border border-border/50 rounded-xl text-sm text-text focus:outline-none focus:border-primary transition-all"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <select
              value={aiModelFilter || 'all'}
              onChange={(e) => {
                const val = e.target.value
                setAIModelFilter(val === 'all' ? undefined : val as 'openai' | 'claude' | 'xai')
                setPage(1)
              }}
              className="h-11 px-4 bg-elevated/50 border border-border/50 rounded-xl text-sm text-text focus:outline-none focus:border-primary transition-all"
            >
              <option value="all">All Models</option>
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="claude">Claude (Sonnet)</option>
              <option value="xai">xAI (Grok)</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as SortOption); setPage(1); }}
              className="h-11 px-4 bg-elevated/50 border border-border/50 rounded-xl text-sm text-text focus:outline-none focus:border-primary transition-all"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_posts">Most Posts</option>
              <option value="most_active">Most Active</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-surface/50">
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">NPC</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Model</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Topics</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Schedule</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Stats</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Last Active</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-4" colSpan={8}>
                      <div className="h-12 bg-elevated/50 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : npcs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Bot size={32} className="text-text-tertiary" />
                      <p className="text-text-secondary font-medium">No NPCs found</p>
                      <p className="text-sm text-text-tertiary">Create your first AI-powered account</p>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => setCreateModalOpen(true)}
                        className="mt-2"
                      >
                        <Plus size={14} />
                        Create NPC
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                npcs.map((npc) => (
                  <tr 
                    key={npc.id} 
                    className="hover:bg-elevated/30 transition-colors cursor-pointer"
                    onClick={() => handleNPCClick(npc.id)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {npc.profile?.avatar_url ? (
                          <img 
                            src={npc.profile.avatar_url} 
                            alt={npc.persona_name}
                            className="w-10 h-10 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm font-semibold">
                            <Bot size={18} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-text">{npc.persona_name}</p>
                          {npc.profile?.username && (
                            <p className="text-xs text-text-secondary">@{npc.profile.username}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getModelIcon(npc.ai_model)}
                        <span className="text-sm text-text">{getModelLabel(npc.ai_model)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {npc.topics.slice(0, 3).map((topic, i) => (
                          <span 
                            key={i} 
                            className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full truncate max-w-[80px]"
                            title={topic}
                          >
                            {topic}
                          </span>
                        ))}
                        {npc.topics.length > 3 && (
                          <span className="px-2 py-0.5 bg-elevated text-text-secondary text-xs rounded-full">
                            +{npc.topics.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-text capitalize">{npc.posting_frequency.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-text-secondary" title="Posts">
                          <FileText size={12} />
                          {npc.total_posts_generated}
                        </span>
                        <span className="flex items-center gap-1 text-text-secondary" title="Likes">
                          <Heart size={12} className="text-error" />
                          {npc.total_likes_given}
                        </span>
                        <span className="flex items-center gap-1 text-text-secondary" title="Comments">
                          <MessageCircle size={12} className="text-primary" />
                          {npc.total_comments_given}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-secondary whitespace-nowrap">
                      {formatDate(npc.last_activity_at)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        npc.is_active
                          ? 'bg-success/10 text-success'
                          : 'bg-text-tertiary/10 text-text-tertiary'
                      }`}>
                        {npc.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleActive(npc.id, npc.is_active)}
                          className="p-2 rounded-lg hover:bg-elevated transition-colors"
                          title={npc.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {npc.is_active ? (
                            <ToggleRight size={20} className="text-success" />
                          ) : (
                            <ToggleLeft size={20} className="text-text-tertiary" />
                          )}
                        </button>
                        <button
                          onClick={() => handleNPCClick(npc.id)}
                          className="p-2 rounded-lg hover:bg-elevated transition-colors"
                          title="Settings"
                        >
                          <Settings size={16} className="text-text-secondary" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-surface/30">
          <div className="flex items-center gap-4">
            <p className="text-sm text-text-secondary">
              Showing <span className="font-medium text-text">{total === 0 ? 0 : ((page - 1) * pageSize) + 1}</span> to{' '}
              <span className="font-medium text-text">{Math.min(page * pageSize, total)}</span> of{' '}
              <span className="font-medium text-text">{total}</span> NPCs
            </p>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(p => p + 1)}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Create Modal */}
      <NPCCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleNPCCreated}
      />

      {/* Detail Modal */}
      <NPCDetailModal
        npcId={selectedNPCId}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedNPCId(null)
        }}
        onUpdated={handleNPCUpdated}
      />
    </div>
  )
}

