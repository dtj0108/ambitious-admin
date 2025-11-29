'use client'

import { useState, useEffect } from 'react'
import { Card, Button, CommentDetailModal } from '@/components'
import { 
  MessageSquare, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Heart,
  Calendar,
  Users,
  CornerDownRight,
  RefreshCw,
  SortAsc,
  FileText,
  X,
  Reply,
} from 'lucide-react'
import { 
  getComments, 
  getCommentStats, 
  type CommentWithContext, 
  type CommentListOptions, 
  type CommentStats,
  type CommentDateRange,
} from '@/lib/queries'

type SortOption = 'newest' | 'oldest' | 'most_liked'

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentWithContext[]>([])
  const [stats, setStats] = useState<CommentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Search & Sort
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showFilters, setShowFilters] = useState(false)
  
  // Filters
  const [dateRange, setDateRange] = useState<CommentDateRange>('all')
  const [hasReplies, setHasReplies] = useState<boolean | undefined>(undefined)
  const [isReply, setIsReply] = useState<boolean | undefined>(undefined)
  
  // Modal
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchComments = async () => {
    setLoading(true)
    const options: CommentListOptions = {
      page,
      limit: pageSize,
      search,
      sortBy,
      dateRange,
      hasReplies,
      isReply,
    }
    
    const result = await getComments(options)
    setComments(result.comments)
    setTotalPages(result.totalPages)
    setTotal(result.total)
    setLoading(false)
  }

  const fetchStats = async () => {
    const statsData = await getCommentStats()
    setStats(statsData)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchComments()
  }, [page, pageSize, search, sortBy, dateRange, hasReplies, isReply])

  // Debounce search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleCommentClick = (commentId: string) => {
    setSelectedCommentId(commentId)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedCommentId(null)
  }

  const handleCommentDeleted = () => {
    fetchComments()
    fetchStats()
  }

  const clearFilters = () => {
    setDateRange('all')
    setHasReplies(undefined)
    setIsReply(undefined)
    setSortBy('newest')
    setPage(1)
  }

  const activeFiltersCount = [
    dateRange !== 'all',
    hasReplies !== undefined,
    isReply !== undefined,
  ].filter(Boolean).length

  const formatDate = (date: string) => {
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

  // Filter chip component
  const FilterChip = ({ 
    active, 
    onClick, 
    children 
  }: { 
    active: boolean
    onClick: () => void
    children: React.ReactNode 
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active
          ? 'bg-primary/20 text-primary border border-primary/30'
          : 'bg-elevated/50 text-text-secondary border border-border/50 hover:bg-elevated hover:text-text'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Comments</h1>
          <p className="text-text-secondary mt-1">
            View and manage user comments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => { fetchComments(); fetchStats(); }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{stats?.total.toLocaleString() || '—'}</p>
              <p className="text-sm text-text-secondary">Total Comments</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Calendar size={24} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{stats?.commentsToday.toLocaleString() || '—'}</p>
              <p className="text-sm text-text-secondary">Today</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-post-win/10 flex items-center justify-center">
              <Users size={24} className="text-post-win" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{stats?.uniqueCommenters7d.toLocaleString() || '—'}</p>
              <p className="text-sm text-text-secondary">Commenters (7d)</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-post-hangout/10 flex items-center justify-center">
              <CornerDownRight size={24} className="text-post-hangout" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{stats?.replyCount.toLocaleString() || '—'}</p>
              <p className="text-sm text-text-secondary">Replies</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card padding="none">
        <div className="p-4 border-b border-border/50 bg-surface/30">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search by content or author..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-elevated/50 border border-border/50 rounded-xl text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:bg-surface transition-all"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <SortAsc size={16} className="text-text-tertiary" />
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as SortOption); setPage(1); }}
                className="h-11 px-4 bg-elevated/50 border border-border/50 rounded-xl text-sm text-text focus:outline-none focus:border-primary transition-all"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="most_liked">Most Liked</option>
              </select>
            </div>

            {/* Filter Toggle */}
            <Button 
              variant={showFilters ? 'primary' : 'secondary'} 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/30">
              <span className="text-xs text-text-tertiary">Active:</span>
              {dateRange !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  <Calendar size={10} /> {dateRange}
                  <button onClick={() => setDateRange('all')} className="ml-1 hover:text-primary/70"><X size={10} /></button>
                </span>
              )}
              {hasReplies !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  <CornerDownRight size={10} /> {hasReplies ? 'Has Replies' : 'No Replies'}
                  <button onClick={() => setHasReplies(undefined)} className="ml-1 hover:text-primary/70"><X size={10} /></button>
                </span>
              )}
              {isReply !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  <Reply size={10} /> {isReply ? 'Replies Only' : 'Top-level Only'}
                  <button onClick={() => setIsReply(undefined)} className="ml-1 hover:text-primary/70"><X size={10} /></button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-error hover:text-error/70 transition-colors ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Expanded Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-border/50 bg-elevated/20 space-y-4">
            {/* Date Range */}
            <div>
              <label className="text-xs text-text-tertiary mb-2 block">Date Range</label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'today', '7d', '30d'] as CommentDateRange[]).map(opt => (
                  <FilterChip 
                    key={opt} 
                    active={dateRange === opt}
                    onClick={() => { setDateRange(opt); setPage(1); }}
                  >
                    {opt === 'all' ? 'All Time' : opt === 'today' ? 'Today' : `Last ${opt}`}
                  </FilterChip>
                ))}
              </div>
            </div>

            {/* Reply Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-tertiary mb-2 block">Has Replies</label>
                <div className="flex gap-2">
                  <FilterChip active={hasReplies === true} onClick={() => { setHasReplies(hasReplies === true ? undefined : true); setPage(1); }}>
                    <CornerDownRight size={10} /> With Replies
                  </FilterChip>
                  <FilterChip active={hasReplies === false} onClick={() => { setHasReplies(hasReplies === false ? undefined : false); setPage(1); }}>
                    No Replies
                  </FilterChip>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-tertiary mb-2 block">Comment Type</label>
                <div className="flex gap-2">
                  <FilterChip active={isReply === false} onClick={() => { setIsReply(isReply === false ? undefined : false); setPage(1); }}>
                    <MessageSquare size={10} /> Top-level
                  </FilterChip>
                  <FilterChip active={isReply === true} onClick={() => { setIsReply(isReply === true ? undefined : true); setPage(1); }}>
                    <Reply size={10} /> Replies
                  </FilterChip>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-surface/50">
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Author</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Comment</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">On Post</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Engagement</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-4" colSpan={5}>
                      <div className="h-12 bg-elevated/50 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : comments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquare size={32} className="text-text-tertiary" />
                      <p className="text-text-secondary font-medium">No comments found</p>
                      <p className="text-sm text-text-tertiary">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                comments.map((comment) => (
                  <tr 
                    key={comment.id} 
                    className="hover:bg-elevated/30 transition-colors cursor-pointer"
                    onClick={() => handleCommentClick(comment.id)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {comment.author_avatar_url ? (
                          <img 
                            src={comment.author_avatar_url} 
                            alt={comment.author_username}
                            className="w-9 h-9 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm font-semibold">
                            {comment.author_username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-text text-sm">@{comment.author_username}</p>
                          {comment.author_full_name && (
                            <p className="text-xs text-text-tertiary">{comment.author_full_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      <div className="flex items-start gap-2">
                        {comment.parent_id && (
                          <span className="p-1 bg-primary/10 rounded flex-shrink-0" title="Reply">
                            <Reply size={10} className="text-primary" />
                          </span>
                        )}
                        <p className="text-sm text-text line-clamp-2">{truncateContent(comment.content)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-[200px]">
                      <div className="flex items-start gap-2">
                        <FileText size={12} className="text-text-tertiary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-text-tertiary">@{comment.post_author_username}</p>
                          <p className="text-xs text-text-secondary line-clamp-1">{truncateContent(comment.post_content, 40)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-text-secondary" title="Likes">
                          <Heart size={12} className="text-error" />
                          {comment.like_count}
                        </span>
                        {comment.reply_count > 0 && (
                          <span className="flex items-center gap-1 text-text-secondary" title="Replies">
                            <CornerDownRight size={12} className="text-primary" />
                            {comment.reply_count}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-secondary whitespace-nowrap">
                      {formatDate(comment.created_at)}
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
              <span className="font-medium text-text">{total}</span> comments
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
      </Card>

      {/* Comment Detail Modal */}
      <CommentDetailModal
        commentId={selectedCommentId}
        isOpen={modalOpen}
        onClose={handleModalClose}
        onCommentDeleted={handleCommentDeleted}
      />
    </div>
  )
}
