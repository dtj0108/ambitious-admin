'use client'

import { PageHeader, DataTable, Button, Card, CardContent, StatsCard, EmptyState } from '@/components'
import { useState, useEffect, useCallback } from 'react'
import { 
  Plus, Eye, Star, FileText, Clock, Calendar, Archive,
  Filter, X, ChevronDown, ChevronUp, Search, ExternalLink, Tag, Image,
  Trash2, Send, FileX, AlertTriangle
} from 'lucide-react'
import {
  getArticleStats,
  getArticles,
  getArticleById,
  getArticleCategories,
  toggleArticleFeatured,
  deleteArticle,
  updateArticleStatus,
  type ArticleStats,
  type Article,
  type ArticleStatus,
  type ArticleDateRange,
  type ArticleFeaturedFilter,
} from '@/lib/queries'

// Status configuration
const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-text-tertiary/10 text-text-tertiary' },
  published: { label: 'Published', className: 'bg-success/10 text-success' },
  archived: { label: 'Archived', className: 'bg-warning/10 text-warning' },
}

export default function ArticlesPage() {
  const [stats, setStats] = useState<ArticleStats | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(20)

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [featuredFilter, setFeaturedFilter] = useState<ArticleFeaturedFilter>('all')
  const [dateRange, setDateRange] = useState<ArticleDateRange>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Modal
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    articleTitle: string
    variant: 'danger' | 'warning' | 'info'
    onConfirm: () => void
  } | null>(null)

  // Fetch stats and categories
  const refreshStats = async () => {
    const [statsData, categoriesData] = await Promise.all([
      getArticleStats(),
      getArticleCategories(),
    ])
    setStats(statsData)
    setCategories(categoriesData)
  }

  useEffect(() => {
    refreshStats()
  }, [])

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    setLoading(true)
    const result = await getArticles({
      page,
      limit,
      status: statusFilter,
      category: categoryFilter,
      featured: featuredFilter,
      dateRange,
      search: searchQuery,
    })
    setArticles(result.articles)
    setTotalPages(result.totalPages)
    setTotal(result.total)
    setLoading(false)
  }, [page, limit, statusFilter, categoryFilter, featuredFilter, dateRange, searchQuery])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [statusFilter, categoryFilter, featuredFilter, dateRange, searchQuery, limit])

  // Handle search
  const handleSearch = () => {
    setSearchQuery(searchInput)
  }

  // Handle view article
  const handleViewArticle = async (article: Article) => {
    const fullArticle = await getArticleById(article.id)
    if (fullArticle) {
      setSelectedArticle(fullArticle)
      setModalOpen(true)
    }
  }

  // Handle toggle featured
  const handleToggleFeatured = async (article: Article) => {
    const success = await toggleArticleFeatured(article.id)
    if (success) {
      fetchArticles()
      refreshStats()
    }
  }

  // Handle delete article
  const handleDeleteArticle = (article: Article) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Article',
      message: 'Are you sure you want to permanently delete this article? This action cannot be undone.',
      articleTitle: article.title,
      variant: 'danger',
      onConfirm: async () => {
        const success = await deleteArticle(article.id)
        if (success) {
          setConfirmDialog(null)
          setModalOpen(false)
          setSelectedArticle(null)
          fetchArticles()
          refreshStats()
        }
      },
    })
  }

  // Handle status change
  const handleStatusChange = (article: Article, newStatus: ArticleStatus) => {
    const statusLabels: Record<ArticleStatus, string> = {
      draft: 'Unpublish (move to drafts)',
      published: 'Publish',
      archived: 'Archive',
    }

    setConfirmDialog({
      open: true,
      title: `${statusLabels[newStatus]}`,
      message: newStatus === 'published' 
        ? 'This will make the article visible to all users.'
        : newStatus === 'archived'
        ? 'This will remove the article from public view but keep it in the system.'
        : 'This will move the article back to drafts and remove it from public view.',
      articleTitle: article.title,
      variant: newStatus === 'archived' ? 'warning' : 'info',
      onConfirm: async () => {
        const success = await updateArticleStatus(article.id, newStatus)
        if (success) {
          setConfirmDialog(null)
          // Refresh the selected article if modal is open
          if (selectedArticle && selectedArticle.id === article.id) {
            const updated = await getArticleById(article.id)
            if (updated) setSelectedArticle(updated)
          }
          fetchArticles()
          refreshStats()
        }
      },
    })
  }

  // Clear filters
  const clearFilters = () => {
    setStatusFilter('all')
    setCategoryFilter('all')
    setFeaturedFilter('all')
    setDateRange('all')
    setSearchQuery('')
    setSearchInput('')
    setPage(1)
  }

  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'all' || featuredFilter !== 'all' || dateRange !== 'all' || searchQuery !== ''

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Table columns
  const columns = [
    {
      key: 'cover',
      header: '',
      render: (article: Article) => (
        <div className="w-16 h-10 rounded-md overflow-hidden bg-surface-alt flex items-center justify-center">
          {article.cover_image_path ? (
            <img 
              src={article.cover_image_path} 
              alt="" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <Image size={16} className="text-text-tertiary" />
          )}
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Article',
      render: (article: Article) => (
        <div className="max-w-[300px]">
          <div className="flex items-center gap-2">
            {article.is_featured && (
              <Star size={14} className="text-post-win fill-post-win shrink-0" />
            )}
            <span className="text-text font-medium truncate">{article.title}</span>
          </div>
          {article.subtitle && (
            <p className="text-xs text-text-secondary truncate mt-0.5">{article.subtitle}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (article: Article) => (
        <span className="px-2 py-1 bg-elevated text-text-secondary text-xs rounded-full">
          {article.category}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (article: Article) => {
        const config = statusConfig[article.status] || { label: article.status, className: 'bg-surface-alt text-text-secondary' }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${config.className}`}>
            {config.label}
          </span>
        )
      },
    },
    {
      key: 'read_time',
      header: 'Read Time',
      render: (article: Article) => (
        <span className="text-text-secondary text-sm">{article.read_time_label || '—'}</span>
      ),
    },
    {
      key: 'published_at',
      header: 'Published',
      render: (article: Article) => (
        <span className="text-text-secondary text-sm">{formatDate(article.published_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (article: Article) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggleFeatured(article)
            }}
            className={`p-1.5 rounded-md transition-colors ${
              article.is_featured 
                ? 'text-post-win hover:bg-post-win/10' 
                : 'text-text-tertiary hover:bg-elevated hover:text-post-win'
            }`}
            title={article.is_featured ? 'Remove from featured' : 'Add to featured'}
          >
            <Star size={16} className={article.is_featured ? 'fill-current' : ''} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteArticle(article)
            }}
            className="p-1.5 rounded-md text-text-tertiary hover:bg-error/10 hover:text-error transition-colors"
            title="Delete article"
          >
            <Trash2 size={16} />
          </button>
          <Button variant="ghost" size="sm" onClick={() => handleViewArticle(article)}>
            View
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="fade-in">
      <PageHeader
        title="Ambitious Daily"
        description="Manage articles and content"
        actions={
          <Button variant="primary">
            <Plus size={16} />
            New Article
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatsCard
          title="Total Articles"
          value={stats?.total || 0}
          icon={FileText}
        />
        <StatsCard
          title="Published"
          value={stats?.published || 0}
          icon={Eye}
          iconColor="text-success"
        />
        <StatsCard
          title="Drafts"
          value={stats?.draft || 0}
          icon={Clock}
          iconColor="text-text-tertiary"
        />
        <StatsCard
          title="Archived"
          value={stats?.archived || 0}
          icon={Archive}
          iconColor="text-warning"
        />
        <StatsCard
          title="Featured"
          value={stats?.featured || 0}
          icon={Star}
          iconColor="text-post-win"
        />
        <StatsCard
          title="This Month"
          value={stats?.thisMonth || 0}
          icon={Calendar}
          iconColor="text-primary"
        />
      </div>

      {/* Category Pills */}
      {Object.keys(stats?.categories || {}).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              categoryFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-elevated text-text-secondary hover:text-text'
            }`}
          >
            All ({stats?.total || 0})
          </button>
          {Object.entries(stats?.categories || {}).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-primary text-white'
                  : 'bg-elevated text-text-secondary hover:text-text'
              }`}
            >
              {cat} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-0">
          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search articles by title..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 bg-surface-alt border border-border rounded-lg text-text placeholder:text-text-tertiary"
              />
            </div>
            <Button variant="secondary" onClick={handleSearch}>
              Search
            </Button>
          </div>

          {/* Filter Toggle */}
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
              {/* Status filter */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ArticleStatus | 'all')}
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-text text-sm"
                >
                  <option value="all">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Featured filter */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Featured</label>
                <select
                  value={featuredFilter}
                  onChange={(e) => setFeaturedFilter(e.target.value as ArticleFeaturedFilter)}
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-text text-sm"
                >
                  <option value="all">All</option>
                  <option value="featured">Featured only</option>
                  <option value="not_featured">Not featured</option>
                </select>
              </div>

              {/* Date range */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as ArticleDateRange)}
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-text text-sm"
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="thisMonth">This month</option>
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
          Showing {articles.length} of {total.toLocaleString()} articles
        </p>
      </div>

      {/* Articles Table */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading articles...</p>
          </CardContent>
        </Card>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No articles found"
          description={hasActiveFilters ? "Try adjusting your filters" : "Articles will appear here"}
        />
      ) : (
        <DataTable
          columns={columns}
          data={articles}
          pagination={{
            page,
            totalPages,
            onPageChange: setPage,
          }}
        />
      )}

      {/* Article Detail Modal */}
      {modalOpen && selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          onClose={() => {
            setModalOpen(false)
            setSelectedArticle(null)
          }}
          onToggleFeatured={() => handleToggleFeatured(selectedArticle)}
          onDelete={() => handleDeleteArticle(selectedArticle)}
          onStatusChange={(status) => handleStatusChange(selectedArticle, status)}
        />
      )}

      {/* Confirmation Dialog */}
      {confirmDialog?.open && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          articleTitle={confirmDialog.articleTitle}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}

// Confirmation Dialog Component
function ConfirmDialog({
  title,
  message,
  articleTitle,
  variant,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  articleTitle: string
  variant: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}) {
  const variantConfig = {
    danger: { icon: Trash2, color: 'text-error', bg: 'bg-error/10', button: 'bg-error hover:bg-error/90' },
    warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', button: 'bg-warning hover:bg-warning/90' },
    info: { icon: Send, color: 'text-primary', bg: 'bg-primary/10', button: 'bg-primary hover:bg-primary/90' },
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-surface rounded-xl border border-border shadow-2xl animate-in zoom-in-95">
        <div className="p-6">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-full ${config.bg} flex items-center justify-center mx-auto mb-4`}>
            <Icon size={24} className={config.color} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-text text-center mb-2">{title}</h3>

          {/* Article Title */}
          <p className="text-center text-text-secondary mb-2">
            <span className="font-medium text-text">&ldquo;{articleTitle}&rdquo;</span>
          </p>

          {/* Message */}
          <p className="text-sm text-text-secondary text-center mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${config.button}`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal Component
function ArticleDetailModal({
  article,
  onClose,
  onToggleFeatured,
  onDelete,
  onStatusChange,
}: {
  article: Article
  onClose: () => void
  onToggleFeatured: () => void
  onDelete: () => void
  onStatusChange: (status: ArticleStatus) => void
}) {
  const config = statusConfig[article.status] || { label: article.status, className: 'bg-surface-alt text-text-secondary' }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg h-full bg-surface border-l border-border overflow-y-auto animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-text">Article Details</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-alt rounded-lg transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Cover Image */}
          {article.cover_image_path && (
            <div className="aspect-video rounded-lg overflow-hidden bg-surface-alt">
              <img 
                src={article.cover_image_path} 
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Status and Featured */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
              {config.label}
            </span>
            {article.is_featured && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-post-win/10 text-post-win flex items-center gap-1">
                <Star size={14} className="fill-current" />
                Featured
              </span>
            )}
          </div>

          {/* Title and Subtitle */}
          <div>
            <h3 className="text-xl font-bold text-text">{article.title}</h3>
            {article.subtitle && (
              <p className="text-text-secondary mt-1">{article.subtitle}</p>
            )}
          </div>

          {/* Category and Read Time */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-text-tertiary" />
              <span className="text-sm text-text">{article.category}</span>
            </div>
            {article.read_time_label && (
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-text-tertiary" />
                <span className="text-sm text-text">{article.read_time_label}</span>
              </div>
            )}
          </div>

          {/* Excerpt */}
          {article.excerpt && (
            <div>
              <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Excerpt</h4>
              <p className="text-text bg-surface-alt p-3 rounded-lg">{article.excerpt}</p>
            </div>
          )}

          {/* Body Preview */}
          <div>
            <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Body Preview</h4>
            <div className="text-text bg-surface-alt p-3 rounded-lg max-h-48 overflow-y-auto">
              <p className="whitespace-pre-wrap text-sm">
                {article.body.length > 500 ? article.body.slice(0, 500) + '...' : article.body}
              </p>
            </div>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-surface-alt text-text-secondary text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SEO Fields */}
          {(article.seo_title || article.seo_description) && (
            <div>
              <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">SEO</h4>
              <div className="space-y-2 text-sm">
                {article.seo_title && (
                  <div className="p-2 bg-surface-alt rounded">
                    <span className="text-text-tertiary">Title: </span>
                    <span className="text-text">{article.seo_title}</span>
                  </div>
                )}
                {article.seo_description && (
                  <div className="p-2 bg-surface-alt rounded">
                    <span className="text-text-tertiary">Description: </span>
                    <span className="text-text">{article.seo_description}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* External URL */}
          {article.external_url && (
            <div>
              <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">External URL</h4>
              <a 
                href={article.external_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline text-sm"
              >
                <ExternalLink size={14} />
                {article.external_url}
              </a>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Timestamps</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-surface-alt rounded">
                <span className="text-text-secondary">Created</span>
                <span className="text-text">{new Date(article.created_at).toLocaleString()}</span>
              </div>
              {article.published_at && (
                <div className="flex justify-between p-2 bg-surface-alt rounded">
                  <span className="text-text-secondary">Published</span>
                  <span className="text-text">{new Date(article.published_at).toLocaleString()}</span>
                </div>
              )}
              {article.updated_at && (
                <div className="flex justify-between p-2 bg-surface-alt rounded">
                  <span className="text-text-secondary">Updated</span>
                  <span className="text-text">{new Date(article.updated_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Slug */}
          <div>
            <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Slug</h4>
            <p className="text-xs font-mono text-text-secondary bg-surface-alt p-2 rounded break-all">
              {article.slug}
            </p>
          </div>

          {/* Admin Actions */}
          <div className="pt-4 border-t border-border space-y-3">
            <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">Admin Actions</h4>
            
            {/* Status Change Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {article.status !== 'draft' && (
                <button
                  onClick={() => onStatusChange('draft')}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-surface-alt hover:bg-elevated rounded-lg text-text-secondary hover:text-text transition-colors text-sm"
                >
                  <FileX size={16} />
                  Unpublish
                </button>
              )}
              {article.status !== 'published' && (
                <button
                  onClick={() => onStatusChange('published')}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-success/10 hover:bg-success/20 rounded-lg text-success transition-colors text-sm"
                >
                  <Send size={16} />
                  Publish
                </button>
              )}
              {article.status !== 'archived' && (
                <button
                  onClick={() => onStatusChange('archived')}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-warning/10 hover:bg-warning/20 rounded-lg text-warning transition-colors text-sm"
                >
                  <Archive size={16} />
                  Archive
                </button>
              )}
            </div>

            {/* Featured Toggle */}
            <Button 
              variant={article.is_featured ? 'secondary' : 'primary'}
              onClick={onToggleFeatured}
              className="w-full"
            >
              <Star size={16} className={article.is_featured ? '' : 'fill-current'} />
              {article.is_featured ? 'Remove from Featured' : 'Add to Featured'}
            </Button>

            {/* Delete Button */}
            <button
              onClick={onDelete}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-error/10 hover:bg-error/20 rounded-lg text-error transition-colors"
            >
              <Trash2 size={16} />
              Delete Article
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
