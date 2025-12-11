'use client'

import { PageHeader, Card, CardHeader, CardTitle, CardContent, StatsCard, Button, DataTable, EmptyState } from '@/components'
import { useState, useEffect, useCallback } from 'react'
import { 
  Heart, UserCheck, UserX, Clock, TrendingUp, Users, 
  Filter, X, ChevronDown, ChevronUp, Percent, User, ArrowRight
} from 'lucide-react'
import {
  type MeetStats,
  type MeetRequestWithUsers,
  type MeetRequestStatus,
  type MeetDateRange,
  type SwipeActivityDay,
} from '@/lib/queries'

// Status configuration
const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning' },
  accepted: { label: 'Accepted', className: 'bg-success/10 text-success' },
  rejected: { label: 'Rejected', className: 'bg-error/10 text-error' },
}

// Swipe action configuration
const swipeActionConfig: Record<string, { label: string; color: string }> = {
  like: { label: 'Like', color: 'bg-success' },
  pass: { label: 'Pass', color: 'bg-text-tertiary' },
  superlike: { label: 'Super Like', color: 'bg-primary' },
}

export default function MeetPage() {
  const [stats, setStats] = useState<MeetStats | null>(null)
  const [requests, setRequests] = useState<MeetRequestWithUsers[]>([])
  const [swipeTrend, setSwipeTrend] = useState<SwipeActivityDay[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(20)

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<MeetRequestStatus | 'all'>('all')
  const [dateRange, setDateRange] = useState<MeetDateRange>('all')

  // Modal
  const [selectedRequest, setSelectedRequest] = useState<MeetRequestWithUsers | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Fetch stats and swipe trend (stats are included in the meet API response)
  // Stats will be set when fetching requests

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('dateRange', dateRange)
      
      const response = await fetch(`/api/admin/meet?${params.toString()}`)
      if (response.ok) {
        const result = await response.json()
        setStats(result.stats)
        setSwipeTrend(result.swipeTrend)
        setRequests(result.requests)
        setTotalPages(result.totalPages)
        setTotal(result.total)
      }
    } catch (error) {
      console.error('Failed to fetch meet data:', error)
    }
    setLoading(false)
  }, [page, limit, statusFilter, dateRange])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [statusFilter, dateRange, limit])

  // Open modal
  const handleViewRequest = async (request: MeetRequestWithUsers) => {
    // Use the request data we already have since full data is included in list
    setSelectedRequest(request)
    setModalOpen(true)
  }

  // Clear filters
  const clearFilters = () => {
    setStatusFilter('all')
    setDateRange('all')
    setPage(1)
  }

  const hasActiveFilters = statusFilter !== 'all' || dateRange !== 'all'

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString()
  }

  // Calculate max swipe count for chart scaling
  const maxSwipes = Math.max(...swipeTrend.map(d => d.count), 1)

  // Table columns
  const columns = [
    {
      key: 'requester',
      header: 'Requester',
      render: (req: MeetRequestWithUsers) => (
        <div className="flex items-center gap-2">
          {req.requester_avatar_url ? (
            <img src={req.requester_avatar_url} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center">
              <User size={14} className="text-text-secondary" />
            </div>
          )}
          <div>
            <p className="font-medium text-text">@{req.requester_username}</p>
            {req.requester_full_name && (
              <p className="text-xs text-text-secondary">{req.requester_full_name}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'arrow',
      header: '',
      render: () => <ArrowRight size={16} className="text-text-tertiary" />,
    },
    {
      key: 'recipient',
      header: 'Recipient',
      render: (req: MeetRequestWithUsers) => (
        <div className="flex items-center gap-2">
          {req.recipient_avatar_url ? (
            <img src={req.recipient_avatar_url} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center">
              <User size={14} className="text-text-secondary" />
            </div>
          )}
          <div>
            <p className="font-medium text-text">@{req.recipient_username}</p>
            {req.recipient_full_name && (
              <p className="text-xs text-text-secondary">{req.recipient_full_name}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (req: MeetRequestWithUsers) => {
        const config = statusConfig[req.status] || { label: req.status, className: 'bg-surface-alt text-text-secondary' }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
          </span>
        )
      },
    },
    {
      key: 'created_at',
      header: 'Sent',
      render: (req: MeetRequestWithUsers) => (
        <span className="text-text-secondary text-sm">{formatRelativeTime(req.created_at)}</span>
      ),
    },
    {
      key: 'responded_at',
      header: 'Responded',
      render: (req: MeetRequestWithUsers) => (
        <span className="text-text-secondary text-sm">
          {req.responded_at ? formatRelativeTime(req.responded_at) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (req: MeetRequestWithUsers) => (
        <Button variant="ghost" size="sm" onClick={() => handleViewRequest(req)}>
          View
        </Button>
      ),
    },
  ]

  return (
    <div className="fade-in">
      <PageHeader
        title="Meet"
        description="User discovery and connection analytics"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatsCard
          title="Total Requests"
          value={stats?.totalRequests || 0}
          icon={Heart}
          iconColor="text-post-hangout"
        />
        <StatsCard
          title="Pending"
          value={stats?.pending || 0}
          icon={Clock}
          iconColor="text-warning"
        />
        <StatsCard
          title="Accepted"
          value={stats?.accepted || 0}
          icon={UserCheck}
          iconColor="text-success"
        />
        <StatsCard
          title="Rejected"
          value={stats?.rejected || 0}
          icon={UserX}
          iconColor="text-error"
        />
        <StatsCard
          title="Swipes (7d)"
          value={stats?.totalSwipes7d || 0}
          icon={TrendingUp}
          iconColor="text-primary"
        />
        <StatsCard
          title="Match Rate"
          value={`${stats?.matchRate || 0}%`}
          icon={Percent}
          iconColor="text-post-win"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Swipe Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Swipe Activity (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {swipeTrend.length > 0 ? (
              <div className="space-y-3">
                {swipeTrend.map((day) => (
                  <div key={day.date}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary">{day.label}</span>
                      <span className="text-xs font-medium text-text">{day.count.toLocaleString()} swipes</span>
                    </div>
                    <div className="h-6 bg-elevated rounded-full overflow-hidden flex">
                      {Object.entries(day.byAction).map(([action, count]) => {
                        const config = swipeActionConfig[action] || { color: 'bg-text-tertiary' }
                        const width = (count / maxSwipes) * 100
                        return (
                          <div
                            key={action}
                            className={`h-full ${config.color} transition-all`}
                            style={{ width: `${width}%` }}
                            title={`${action}: ${count}`}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  {Object.entries(swipeActionConfig).map(([action, config]) => (
                    <div key={action} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded-full ${config.color}`} />
                      <span className="text-xs text-text-secondary capitalize">{config.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-text-tertiary">
                No swipe data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Swipes by Action */}
        <Card>
          <CardHeader>
            <CardTitle>Swipe Breakdown (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && Object.keys(stats.swipesByAction).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(stats.swipesByAction).map(([action, count]) => {
                  const config = swipeActionConfig[action] || { label: action, color: 'bg-text-tertiary' }
                  const percentage = stats.totalSwipes7d > 0 ? Math.round((count / stats.totalSwipes7d) * 100) : 0
                  return (
                    <div key={action}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-text capitalize">{config.label}</span>
                        <span className="text-sm text-text-secondary">
                          {count.toLocaleString()} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-3 bg-elevated rounded-full overflow-hidden">
                        <div
                          className={`h-full ${config.color} rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-text-tertiary">
                No swipe data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-0">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              {/* Status filter */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as MeetRequestStatus | 'all')}
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-text text-sm"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Date range */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as MeetDateRange)}
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-text text-sm"
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
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
          Showing {requests.length} of {total.toLocaleString()} meet requests
        </p>
      </div>

      {/* Meet Requests Table */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading meet requests...</p>
          </CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No meet requests found"
          description={hasActiveFilters ? "Try adjusting your filters" : "Meet requests will appear here"}
        />
      ) : (
        <DataTable
          columns={columns}
          data={requests}
          pagination={{
            page,
            totalPages,
            onPageChange: setPage,
          }}
        />
      )}

      {/* Meet Request Detail Modal */}
      {modalOpen && selectedRequest && (
        <MeetRequestDetailModal
          request={selectedRequest}
          onClose={() => {
            setModalOpen(false)
            setSelectedRequest(null)
          }}
        />
      )}
    </div>
  )
}

// Modal Component
function MeetRequestDetailModal({
  request,
  onClose,
}: {
  request: MeetRequestWithUsers
  onClose: () => void
}) {
  const config = statusConfig[request.status] || { label: request.status, className: 'bg-surface-alt text-text-secondary' }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md h-full bg-surface border-l border-border overflow-y-auto animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-post-hangout" />
            <h2 className="text-lg font-semibold text-text">Meet Request</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-alt rounded-lg transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Status */}
          <div className="flex justify-center">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${config.className}`}>
              {config.label}
            </span>
          </div>

          {/* Requester */}
          <div>
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Requester</h3>
            <div className="flex items-center gap-3 p-4 bg-surface-alt rounded-lg">
              {request.requester_avatar_url ? (
                <img src={request.requester_avatar_url} alt="" className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
                  <User size={24} className="text-text-secondary" />
                </div>
              )}
              <div>
                <p className="font-semibold text-text">@{request.requester_username}</p>
                {request.requester_full_name && (
                  <p className="text-sm text-text-secondary">{request.requester_full_name}</p>
                )}
                <p className="text-xs text-text-tertiary mt-1">ID: {request.requester_id.slice(0, 8)}...</p>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="p-2 bg-surface-alt rounded-full">
              <ArrowRight size={20} className="text-text-secondary" />
            </div>
          </div>

          {/* Recipient */}
          <div>
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Recipient</h3>
            <div className="flex items-center gap-3 p-4 bg-surface-alt rounded-lg">
              {request.recipient_avatar_url ? (
                <img src={request.recipient_avatar_url} alt="" className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
                  <User size={24} className="text-text-secondary" />
                </div>
              )}
              <div>
                <p className="font-semibold text-text">@{request.recipient_username}</p>
                {request.recipient_full_name && (
                  <p className="text-sm text-text-secondary">{request.recipient_full_name}</p>
                )}
                <p className="text-xs text-text-tertiary mt-1">ID: {request.recipient_id.slice(0, 8)}...</p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Timeline</h3>
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-surface-alt rounded-lg">
                <span className="text-text-secondary">Request Sent</span>
                <span className="text-text">{new Date(request.created_at).toLocaleString()}</span>
              </div>
              {request.responded_at && (
                <div className="flex justify-between p-3 bg-surface-alt rounded-lg">
                  <span className="text-text-secondary">Response</span>
                  <span className="text-text">{new Date(request.responded_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Request ID */}
          <div>
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Request ID</h3>
            <p className="text-xs font-mono text-text-secondary bg-surface-alt p-3 rounded-lg break-all">
              {request.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
