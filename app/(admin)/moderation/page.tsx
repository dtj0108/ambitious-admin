'use client'

import { useState, useEffect } from 'react'
import { Card, Button, PostTypeBadge, ModerationModal } from '@/components'
import { 
  Shield, 
  Flag, 
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Star,
  Image as ImageIcon,
  Video,
} from 'lucide-react'
import { 
  getModerationStats, 
  getReportsGroupedByPost,
  getHiddenPosts,
  restorePost,
  hidePost,
  type ModerationStats,
  type FlaggedPost,
} from '@/lib/queries'

type TabType = 'reports' | 'hidden'

export default function ModerationPage() {
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('reports')
  const [posts, setPosts] = useState<FlaggedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Modal
  const [selectedPost, setSelectedPost] = useState<FlaggedPost | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  
  // Quick action loading states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchStats = async () => {
    const statsData = await getModerationStats()
    setStats(statsData)
  }

  const fetchPosts = async () => {
    setLoading(true)
    
    if (activeTab === 'reports') {
      const result = await getReportsGroupedByPost({ page, limit: pageSize })
      setPosts(result.posts)
      setTotalPages(result.totalPages)
      setTotal(result.total)
    } else {
      const result = await getHiddenPosts({ page, limit: pageSize })
      setPosts(result.posts)
      setTotalPages(result.totalPages)
      setTotal(result.total)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [activeTab])

  useEffect(() => {
    fetchPosts()
  }, [activeTab, page, pageSize])

  const handlePostClick = (post: FlaggedPost) => {
    setSelectedPost(post)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedPost(null)
  }

  const handlePostUpdated = () => {
    fetchPosts()
    fetchStats()
  }

  const handleQuickRestore = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation()
    setActionLoadingId(postId)
    const success = await restorePost(postId)
    if (success) {
      fetchPosts()
      fetchStats()
    }
    setActionLoadingId(null)
  }

  const handleQuickHide = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation()
    setActionLoadingId(postId)
    const success = await hidePost(postId)
    if (success) {
      fetchPosts()
      fetchStats()
    }
    setActionLoadingId(null)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const truncateContent = (content: string, maxLength: number = 60) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength).trim() + '...'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Moderation</h1>
          <p className="text-text-secondary mt-1">
            Review flagged content and manage post visibility
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => { fetchPosts(); fetchStats(); }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
              <Flag size={24} className="text-error" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{stats?.totalReports.toLocaleString() || '—'}</p>
              <p className="text-sm text-text-secondary">Total Reports</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-post-win/10 flex items-center justify-center">
              <Calendar size={24} className="text-post-win" />
            </div>
            <div>
              <p className="text-2xl font-bold text-post-win">{stats?.reportsToday.toLocaleString() || '—'}</p>
              <p className="text-sm text-text-secondary">Today</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-text-tertiary/10 flex items-center justify-center">
              <EyeOff size={24} className="text-text-tertiary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{stats?.hiddenPosts.toLocaleString() || '—'}</p>
              <p className="text-sm text-text-secondary">Hidden Posts</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <AlertTriangle size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{stats?.pendingReview.toLocaleString() || '—'}</p>
              <p className="text-sm text-text-secondary">Pending Review</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs and Content */}
      <Card padding="none">
        {/* Tabs */}
        <div className="flex border-b border-border/50">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${
              activeTab === 'reports'
                ? 'text-primary'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Flag size={16} />
              Reports Queue
              {stats && stats.totalReports > 0 && (
                <span className="px-2 py-0.5 bg-error/10 text-error text-xs font-medium rounded-full">
                  {stats.totalReports}
                </span>
              )}
            </div>
            {activeTab === 'reports' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('hidden')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${
              activeTab === 'hidden'
                ? 'text-primary'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <EyeOff size={16} />
              Hidden Posts
              {stats && stats.hiddenPosts > 0 && (
                <span className="px-2 py-0.5 bg-text-tertiary/10 text-text-tertiary text-xs font-medium rounded-full">
                  {stats.hiddenPosts}
                </span>
              )}
            </div>
            {activeTab === 'hidden' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-surface/50">
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Author</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Content</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Reports</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  {activeTab === 'reports' ? 'Latest Report' : 'Post Date'}
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-4" colSpan={6}>
                      <div className="h-12 bg-elevated/50 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {activeTab === 'reports' ? (
                        <>
                          <CheckCircle size={32} className="text-success" />
                          <p className="text-text-secondary font-medium">No flagged posts</p>
                          <p className="text-sm text-text-tertiary">All clear! No posts have been reported.</p>
                        </>
                      ) : (
                        <>
                          <Eye size={32} className="text-text-tertiary" />
                          <p className="text-text-secondary font-medium">No hidden posts</p>
                          <p className="text-sm text-text-tertiary">All posts are currently visible.</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr 
                    key={post.id} 
                    className="hover:bg-elevated/30 transition-colors cursor-pointer"
                    onClick={() => handlePostClick(post)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {post.author_avatar_url ? (
                            <img 
                              src={post.author_avatar_url} 
                              alt={post.author_username}
                              className="w-9 h-9 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm font-semibold">
                              {post.author_username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {post.author_is_favorite && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-post-win rounded-full flex items-center justify-center">
                              <Star size={10} className="text-black" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-text text-sm">@{post.author_username}</p>
                            {post.author_is_favorite && (
                              <span className="text-[10px] text-post-win">Trusted</span>
                            )}
                          </div>
                          {post.post_type && (
                            <PostTypeBadge type={post.post_type as 'win' | 'dream' | 'ask' | 'hangout' | 'intro' | 'general'} size="sm" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      <div className="flex items-start gap-2">
                        <p className="text-sm text-text line-clamp-2">{truncateContent(post.content)}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {post.image_url && (
                            <span className="p-1 bg-surface rounded" title="Has image">
                              <ImageIcon size={12} className="text-text-tertiary" />
                            </span>
                          )}
                          {post.video_url && (
                            <span className="p-1 bg-surface rounded" title="Has video">
                              <Video size={12} className="text-text-tertiary" />
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          post.report_count >= 3
                            ? 'bg-error/10 text-error'
                            : post.report_count >= 1
                            ? 'bg-post-win/10 text-post-win'
                            : 'bg-text-tertiary/10 text-text-tertiary'
                        }`}>
                          <Flag size={10} />
                          {post.report_count}
                        </span>
                        {post.reports.some(r => r.reporter_is_favorite) && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-post-win/10 text-post-win flex items-center gap-1">
                            <Star size={10} /> Trusted flag
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-secondary whitespace-nowrap">
                      {activeTab === 'reports' 
                        ? formatDate(post.latest_report_date)
                        : formatDate(post.created_at)
                      }
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        post.is_visible
                          ? 'bg-success/10 text-success'
                          : 'bg-error/10 text-error'
                      }`}>
                        {post.is_visible ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {post.is_visible ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleQuickHide(e, post.id)}
                            disabled={actionLoadingId === post.id}
                            className="!text-error hover:!bg-error/10"
                          >
                            <EyeOff size={14} />
                            Hide
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleQuickRestore(e, post.id)}
                            disabled={actionLoadingId === post.id}
                            className="!text-success hover:!bg-success/10"
                          >
                            <Eye size={14} />
                            Restore
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-surface/30">
            <div className="flex items-center gap-4">
              <p className="text-sm text-text-secondary">
                Showing <span className="font-medium text-text">{((page - 1) * pageSize) + 1}</span> to{' '}
                <span className="font-medium text-text">{Math.min(page * pageSize, total)}</span> of{' '}
                <span className="font-medium text-text">{total}</span> posts
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-tertiary">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="h-8 px-2 bg-elevated/50 border border-border/50 rounded-lg text-sm text-text focus:outline-none focus:border-primary transition-all"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
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
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        disabled={loading}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                          page === pageNum
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:bg-elevated'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
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
        )}
      </Card>

      {/* Moderation Modal */}
      <ModerationModal
        post={selectedPost}
        isOpen={modalOpen}
        onClose={handleModalClose}
        onPostUpdated={handlePostUpdated}
      />
    </div>
  )
}

