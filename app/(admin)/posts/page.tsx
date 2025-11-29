'use client'

import { useState, useEffect } from 'react'
import { Card, Button, PostTypeBadge, PostDetailModal } from '@/components'
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Heart,
  MessageCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Video,
  RefreshCw,
  SortAsc,
  TrendingUp,
  Calendar,
  Sparkles,
  X,
  MapPin,
} from 'lucide-react'
import { 
  getPosts, 
  getPostStats, 
  type PostWithAuthor, 
  type PostListOptions, 
  type PostStats,
  type PostType,
  type PostDateRange,
  type EngagementLevel,
} from '@/lib/queries'

type SortOption = 'newest' | 'oldest' | 'most_liked' | 'most_commented' | 'most_viewed'

const POST_TYPES: { value: PostType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'win', label: 'Win' },
  { value: 'dream', label: 'Dream' },
  { value: 'ask', label: 'Ask' },
  { value: 'hangout', label: 'Hangout' },
  { value: 'intro', label: 'Intro' },
  { value: 'general', label: 'General' },
]

export default function PostsPage() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [stats, setStats] = useState<PostStats | null>(null)
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
  const [postType, setPostType] = useState<PostType | 'all'>('all')
  const [dateRange, setDateRange] = useState<PostDateRange>('all')
  const [hasMedia, setHasMedia] = useState<boolean | undefined>(undefined)
  const [isVisible, setIsVisible] = useState<boolean | undefined>(undefined)
  const [isViral, setIsViral] = useState<boolean | undefined>(undefined)
  const [engagementLevel, setEngagementLevel] = useState<EngagementLevel>('any')
  
  // Modal
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchPosts = async () => {
    setLoading(true)
    const options: PostListOptions = {
      page,
      limit: pageSize,
      search,
      sortBy,
      postType,
      dateRange,
      hasMedia,
      isVisible,
      isViral,
      engagementLevel,
    }
    
    const result = await getPosts(options)
    setPosts(result.posts)
    setTotalPages(result.totalPages)
    setTotal(result.total)
    setLoading(false)
  }

  const fetchStats = async () => {
    const statsData = await getPostStats()
    setStats(statsData)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [page, pageSize, search, sortBy, postType, dateRange, hasMedia, isVisible, isViral, engagementLevel])

  // Debounce search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handlePostClick = (postId: string) => {
    setSelectedPostId(postId)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedPostId(null)
  }

  const handlePostUpdated = () => {
    fetchPosts()
    fetchStats()
  }

  const clearFilters = () => {
    setPostType('all')
    setDateRange('all')
    setHasMedia(undefined)
    setIsVisible(undefined)
    setIsViral(undefined)
    setEngagementLevel('any')
    setSortBy('newest')
    setPage(1)
  }

  const activeFiltersCount = [
    postType !== 'all',
    dateRange !== 'all',
    hasMedia !== undefined,
    isVisible !== undefined,
    isViral !== undefined,
    engagementLevel !== 'any',
  ].filter(Boolean).length

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const truncateContent = (content: string, maxLength: number = 80) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength).trim() + '...'
  }

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
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
          <h1 className="text-2xl font-bold text-text">Posts</h1>
          <p className="text-text-secondary mt-1">
            Manage and moderate user posts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => { fetchPosts(); fetchStats(); }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button variant="secondary">
            <Download size={16} />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{stats?.total.toLocaleString() || '—'}</p>
              <p className="text-sm text-text-secondary">Total Posts</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Calendar size={24} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{stats?.postsToday.toLocaleString() || '—'}</p>
              <p className="text-sm text-text-secondary">Today</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-post-win/10 flex items-center justify-center">
              <TrendingUp size={24} className="text-post-win" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{stats?.postsThisWeek.toLocaleString() || '—'}</p>
              <p className="text-sm text-text-secondary">This Week</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
              <Heart size={24} className="text-error" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{formatNumber(stats?.totalEngagement || 0)}</p>
              <p className="text-sm text-text-secondary">Engagement</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Post Type Breakdown */}
      {stats?.byType && Object.keys(stats.byType).length > 0 && (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-text mb-3">Posts by Type</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.byType).map(([type, count]) => (
              <button
                key={type}
                onClick={() => { setPostType(type as PostType); setPage(1); setShowFilters(true); }}
                className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg border border-border/50 hover:border-primary/50 transition-all"
              >
                <PostTypeBadge type={type as PostType} size="sm" />
                <span className="text-sm font-medium text-text">{count}</span>
              </button>
            ))}
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
                placeholder="Search by content or author..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-elevated/50 border border-border/50 rounded-xl text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:bg-surface transition-all"
              />
            </div>

            {/* Post Type */}
            <select
              value={postType}
              onChange={(e) => { setPostType(e.target.value as PostType | 'all'); setPage(1); }}
              className="h-11 px-4 bg-elevated/50 border border-border/50 rounded-xl text-sm text-text focus:outline-none focus:border-primary transition-all"
            >
              {POST_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

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
                <option value="most_commented">Most Comments</option>
                <option value="most_viewed">Most Viewed</option>
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
              {postType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  Type: {postType}
                  <button onClick={() => setPostType('all')} className="ml-1 hover:text-primary/70"><X size={10} /></button>
                </span>
              )}
              {dateRange !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  <Calendar size={10} /> {dateRange}
                  <button onClick={() => setDateRange('all')} className="ml-1 hover:text-primary/70"><X size={10} /></button>
                </span>
              )}
              {hasMedia !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  <ImageIcon size={10} /> {hasMedia ? 'Has Media' : 'No Media'}
                  <button onClick={() => setHasMedia(undefined)} className="ml-1 hover:text-primary/70"><X size={10} /></button>
                </span>
              )}
              {isVisible !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  {isVisible ? <Eye size={10} /> : <EyeOff size={10} />} {isVisible ? 'Visible' : 'Hidden'}
                  <button onClick={() => setIsVisible(undefined)} className="ml-1 hover:text-primary/70"><X size={10} /></button>
                </span>
              )}
              {isViral !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-post-win/10 text-post-win text-xs rounded-md">
                  <Sparkles size={10} /> Viral
                  <button onClick={() => setIsViral(undefined)} className="ml-1 hover:text-post-win/70"><X size={10} /></button>
                </span>
              )}
              {engagementLevel !== 'any' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  <Heart size={10} /> Engagement: {engagementLevel}
                  <button onClick={() => setEngagementLevel('any')} className="ml-1 hover:text-primary/70"><X size={10} /></button>
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
                {(['all', 'today', '7d', '30d', '90d'] as PostDateRange[]).map(opt => (
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

            {/* Media & Visibility */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-text-tertiary mb-2 block">Media</label>
                <div className="flex gap-2">
                  <FilterChip active={hasMedia === true} onClick={() => { setHasMedia(hasMedia === true ? undefined : true); setPage(1); }}>
                    <ImageIcon size={10} /> Has
                  </FilterChip>
                  <FilterChip active={hasMedia === false} onClick={() => { setHasMedia(hasMedia === false ? undefined : false); setPage(1); }}>
                    None
                  </FilterChip>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-tertiary mb-2 block">Visibility</label>
                <div className="flex gap-2">
                  <FilterChip active={isVisible === true} onClick={() => { setIsVisible(isVisible === true ? undefined : true); setPage(1); }}>
                    <Eye size={10} /> Visible
                  </FilterChip>
                  <FilterChip active={isVisible === false} onClick={() => { setIsVisible(isVisible === false ? undefined : false); setPage(1); }}>
                    <EyeOff size={10} /> Hidden
                  </FilterChip>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-tertiary mb-2 block">Viral Status</label>
                <div className="flex gap-2">
                  <FilterChip active={isViral === true} onClick={() => { setIsViral(isViral === true ? undefined : true); setPage(1); }}>
                    <Sparkles size={10} /> Viral
                  </FilterChip>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-tertiary mb-2 block">Engagement</label>
                <div className="flex flex-wrap gap-2">
                  {(['any', 'low', 'medium', 'high', 'viral'] as EngagementLevel[]).map(opt => (
                    <FilterChip 
                      key={opt} 
                      active={engagementLevel === opt}
                      onClick={() => { setEngagementLevel(opt); setPage(1); }}
                    >
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </FilterChip>
                  ))}
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
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Content</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Engagement</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
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
                      <FileText size={32} className="text-text-tertiary" />
                      <p className="text-text-secondary font-medium">No posts found</p>
                      <p className="text-sm text-text-tertiary">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr 
                    key={post.id} 
                    className="hover:bg-elevated/30 transition-colors cursor-pointer"
                    onClick={() => handlePostClick(post.id)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
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
                        <div>
                          <p className="font-medium text-text text-sm">@{post.author_username}</p>
                          {post.author_full_name && (
                            <p className="text-xs text-text-tertiary">{post.author_full_name}</p>
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
                          {post.location_name && (
                            <span className="p-1 bg-surface rounded" title={post.location_name}>
                              <MapPin size={12} className="text-text-tertiary" />
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <PostTypeBadge type={post.post_type || 'general'} size="sm" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-text-secondary" title="Likes">
                          <Heart size={12} className="text-error" />
                          {formatNumber(post.like_count)}
                        </span>
                        <span className="flex items-center gap-1 text-text-secondary" title="Comments">
                          <MessageCircle size={12} className="text-primary" />
                          {formatNumber(post.comment_count)}
                        </span>
                        <span className="flex items-center gap-1 text-text-secondary" title="Views">
                          <Eye size={12} />
                          {formatNumber(post.views_count)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-secondary whitespace-nowrap">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          post.is_visible !== false
                            ? 'bg-success/10 text-success'
                            : 'bg-error/10 text-error'
                        }`}>
                          {post.is_visible !== false ? 'Visible' : 'Hidden'}
                        </span>
                        {post.is_viral && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-post-win/10 text-post-win flex items-center gap-1">
                            <Sparkles size={10} /> Viral
                          </span>
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-surface/30">
          <div className="flex items-center gap-4">
            <p className="text-sm text-text-secondary">
              Showing <span className="font-medium text-text">{total === 0 ? 0 : ((page - 1) * pageSize) + 1}</span> to{' '}
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
      </Card>

      {/* Post Detail Modal */}
      <PostDetailModal
        postId={selectedPostId}
        isOpen={modalOpen}
        onClose={handleModalClose}
        onPostUpdated={handlePostUpdated}
      />
    </div>
  )
}
