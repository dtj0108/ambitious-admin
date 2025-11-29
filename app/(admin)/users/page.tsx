'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, Button, UserDetailModal } from '@/components'
import { 
  UserPlus, 
  Download, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Users,
  TrendingUp,
  Flame,
  Star,
  Bot,
  RefreshCw,
  SortAsc,
  FileText,
  UserCheck,
  Image,
  Tag,
  Phone,
  Bell,
  Calendar,
  X,
} from 'lucide-react'
import { 
  getUsers, 
  getUserStats, 
  type UserProfile, 
  type UserListOptions, 
  type UserStats,
  type PostCountRange,
  type ReferralCountRange,
  type StreakThreshold,
  type JoinDateRange,
} from '@/lib/queries'

type SortOption = 'newest' | 'oldest' | 'most_posts' | 'highest_streak' | 'most_referrals'

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Search & Sort
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showFilters, setShowFilters] = useState(false)
  
  // Original filters
  const [isBot, setIsBot] = useState<boolean | undefined>(undefined)
  const [isFavorite, setIsFavorite] = useState<boolean | undefined>(undefined)
  
  // Engagement filters
  const [postCount, setPostCount] = useState<PostCountRange>('any')
  const [referralCount, setReferralCount] = useState<ReferralCountRange>('any')
  const [streakThreshold, setStreakThreshold] = useState<StreakThreshold>('any')
  
  // Profile completeness
  const [hasBio, setHasBio] = useState<boolean | undefined>(undefined)
  const [hasAvatar, setHasAvatar] = useState<boolean | undefined>(undefined)
  const [hasTags, setHasTags] = useState<boolean | undefined>(undefined)
  const [phoneVerified, setPhoneVerified] = useState<boolean | undefined>(undefined)
  
  // Account flags
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | undefined>(undefined)
  const [joinDateRange, setJoinDateRange] = useState<JoinDateRange>('all')
  
  // Filter section toggles
  const [showEngagement, setShowEngagement] = useState(true)
  const [showProfile, setShowProfile] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  
  // Modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    const options: UserListOptions = {
      page,
      limit: pageSize,
      search,
      sortBy,
      isBot,
      isFavorite,
      postCount,
      referralCount,
      streakThreshold,
      hasBio,
      hasAvatar,
      hasTags,
      phoneVerified,
      notificationsEnabled,
      joinDateRange,
    }
    
    const result = await getUsers(options)
    setUsers(result.users)
    setTotalPages(result.totalPages)
    setTotal(result.total)
    setLoading(false)
  }

  const fetchStats = async () => {
    const statsData = await getUserStats()
    setStats(statsData)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [page, pageSize, search, sortBy, isBot, isFavorite, postCount, referralCount, streakThreshold, hasBio, hasAvatar, hasTags, phoneVerified, notificationsEnabled, joinDateRange])

  // Debounce search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedUserId(null)
  }

  const handleUserUpdated = () => {
    fetchUsers()
    fetchStats()
  }

  const clearFilters = () => {
    setIsBot(undefined)
    setIsFavorite(undefined)
    setPostCount('any')
    setReferralCount('any')
    setStreakThreshold('any')
    setHasBio(undefined)
    setHasAvatar(undefined)
    setHasTags(undefined)
    setPhoneVerified(undefined)
    setNotificationsEnabled(undefined)
    setJoinDateRange('all')
    setSortBy('newest')
    setPage(1)
  }

  const activeFiltersCount = [
    isBot !== undefined,
    isFavorite !== undefined,
    postCount !== 'any',
    referralCount !== 'any',
    streakThreshold !== 'any',
    hasBio !== undefined,
    hasAvatar !== undefined,
    hasTags !== undefined,
    phoneVerified !== undefined,
    notificationsEnabled !== undefined,
    joinDateRange !== 'all',
  ].filter(Boolean).length

  const isActive = (lastPostDate: string | null) => {
    if (!lastPostDate) return false
    const daysSincePost = Math.floor(
      (Date.now() - new Date(lastPostDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSincePost <= 7
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
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

  // Section header component
  const FilterSection = ({ 
    title, 
    icon: Icon, 
    expanded, 
    onToggle, 
    children 
  }: { 
    title: string
    icon: React.ElementType
    expanded: boolean
    onToggle: () => void
    children: React.ReactNode 
  }) => (
    <div className="border-b border-border/30 last:border-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-elevated/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-text-tertiary" />
          <span className="text-sm font-medium text-text">{title}</span>
        </div>
        <ChevronDown 
          size={14} 
          className={`text-text-tertiary transition-transform ${expanded ? 'rotate-180' : ''}`} 
        />
      </button>
      {expanded && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {children}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Users</h1>
          <p className="text-text-secondary mt-1">
            Manage user accounts and view activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => { fetchUsers(); fetchStats(); }}>
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
              <Users size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{stats?.total.toLocaleString() || '—'}</p>
              <p className="text-sm text-text-secondary">Total Users</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp size={24} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{stats?.activeUsers7d.toLocaleString() || '—'}</p>
              <p className="text-sm text-text-secondary">Active (7d)</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-post-win/10 flex items-center justify-center">
              <UserPlus size={24} className="text-post-win" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{stats?.newUsers7d.toLocaleString() || '—'}</p>
              <p className="text-sm text-text-secondary">New (7d)</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-post-hangout/10 flex items-center justify-center">
              <Flame size={24} className="text-post-hangout" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{stats?.usersWithStreak.toLocaleString() || '—'}</p>
              <p className="text-sm text-text-secondary">With Streak</p>
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
                placeholder="Search by username or name..."
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
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_posts">Most Posts</option>
                <option value="highest_streak">Highest Streak</option>
                <option value="most_referrals">Most Referrals</option>
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
              {isFavorite !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-post-win/10 text-post-win text-xs rounded-md">
                  <Star size={10} /> Favorites
                  <button onClick={() => setIsFavorite(undefined)} className="ml-1 hover:text-post-win/70"><X size={10} /></button>
                </span>
              )}
              {isBot !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  <Bot size={10} /> {isBot ? 'Bots' : 'Humans'}
                  <button onClick={() => setIsBot(undefined)} className="ml-1 hover:text-primary/70"><X size={10} /></button>
                </span>
              )}
              {postCount !== 'any' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  <FileText size={10} /> Posts: {postCount}
                  <button onClick={() => setPostCount('any')} className="ml-1 hover:text-primary/70"><X size={10} /></button>
                </span>
              )}
              {referralCount !== 'any' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  <UserPlus size={10} /> Referrals: {referralCount}
                  <button onClick={() => setReferralCount('any')} className="ml-1 hover:text-primary/70"><X size={10} /></button>
                </span>
              )}
              {streakThreshold !== 'any' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-post-win/10 text-post-win text-xs rounded-md">
                  <Flame size={10} /> Streak: {streakThreshold}
                  <button onClick={() => setStreakThreshold('any')} className="ml-1 hover:text-post-win/70"><X size={10} /></button>
                </span>
              )}
              {hasBio !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  Bio: {hasBio ? 'Yes' : 'No'}
                  <button onClick={() => setHasBio(undefined)} className="ml-1 hover:text-primary/70"><X size={10} /></button>
                </span>
              )}
              {hasAvatar !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  <Image size={10} /> Avatar: {hasAvatar ? 'Yes' : 'No'}
                  <button onClick={() => setHasAvatar(undefined)} className="ml-1 hover:text-primary/70"><X size={10} /></button>
                </span>
              )}
              {hasTags !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  <Tag size={10} /> Tags: {hasTags ? 'Yes' : 'No'}
                  <button onClick={() => setHasTags(undefined)} className="ml-1 hover:text-primary/70"><X size={10} /></button>
                </span>
              )}
              {phoneVerified !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success text-xs rounded-md">
                  <Phone size={10} /> Phone: {phoneVerified ? 'Verified' : 'Unverified'}
                  <button onClick={() => setPhoneVerified(undefined)} className="ml-1 hover:text-success/70"><X size={10} /></button>
                </span>
              )}
              {notificationsEnabled !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  <Bell size={10} /> Notifications: {notificationsEnabled ? 'On' : 'Off'}
                  <button onClick={() => setNotificationsEnabled(undefined)} className="ml-1 hover:text-primary/70"><X size={10} /></button>
                </span>
              )}
              {joinDateRange !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  <Calendar size={10} /> Joined: {joinDateRange}
                  <button onClick={() => setJoinDateRange('all')} className="ml-1 hover:text-primary/70"><X size={10} /></button>
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
          <div className="border-b border-border/50 bg-elevated/20">
            {/* Quick Filters Row */}
            <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-border/30">
              <FilterChip 
                active={isFavorite === true} 
                onClick={() => setIsFavorite(isFavorite === true ? undefined : true)}
              >
                <Star size={12} /> Favorites
              </FilterChip>
              <FilterChip 
                active={isBot === true} 
                onClick={() => setIsBot(isBot === true ? undefined : true)}
              >
                <Bot size={12} /> Bots
              </FilterChip>
              <FilterChip 
                active={isBot === false} 
                onClick={() => setIsBot(isBot === false ? undefined : false)}
              >
                <Users size={12} /> Humans Only
              </FilterChip>
            </div>

            {/* Engagement Section */}
            <FilterSection 
              title="Engagement" 
              icon={TrendingUp} 
              expanded={showEngagement}
              onToggle={() => setShowEngagement(!showEngagement)}
            >
              <div className="w-full space-y-3">
                {/* Post Count */}
                <div>
                  <label className="text-xs text-text-tertiary mb-1.5 block">Post Count</label>
                  <div className="flex flex-wrap gap-2">
                    {(['any', '0', '1-10', '10-50', '50+'] as PostCountRange[]).map(opt => (
                      <FilterChip 
                        key={opt} 
                        active={postCount === opt}
                        onClick={() => { setPostCount(opt); setPage(1); }}
                      >
                        {opt === 'any' ? 'Any' : opt === '0' ? 'None' : opt}
                      </FilterChip>
                    ))}
                  </div>
                </div>
                
                {/* Referral Count */}
                <div>
                  <label className="text-xs text-text-tertiary mb-1.5 block">Referral Count</label>
                  <div className="flex flex-wrap gap-2">
                    {(['any', 'has', '5+', '10+'] as ReferralCountRange[]).map(opt => (
                      <FilterChip 
                        key={opt} 
                        active={referralCount === opt}
                        onClick={() => { setReferralCount(opt); setPage(1); }}
                      >
                        {opt === 'any' ? 'Any' : opt === 'has' ? 'Has Referrals' : opt}
                      </FilterChip>
                    ))}
                  </div>
                </div>

                {/* Streak Threshold */}
                <div>
                  <label className="text-xs text-text-tertiary mb-1.5 block">Streak</label>
                  <div className="flex flex-wrap gap-2">
                    {(['any', '3+', '7+', '14+', '30+'] as StreakThreshold[]).map(opt => (
                      <FilterChip 
                        key={opt} 
                        active={streakThreshold === opt}
                        onClick={() => { setStreakThreshold(opt); setPage(1); }}
                      >
                        <Flame size={10} /> {opt === 'any' ? 'Any' : opt}
                      </FilterChip>
                    ))}
                  </div>
                </div>
              </div>
            </FilterSection>

            {/* Profile Section */}
            <FilterSection 
              title="Profile Completeness" 
              icon={UserCheck} 
              expanded={showProfile}
              onToggle={() => setShowProfile(!showProfile)}
            >
              <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-text-tertiary mb-1.5 block">Has Bio</label>
                  <div className="flex gap-2">
                    <FilterChip active={hasBio === true} onClick={() => { setHasBio(hasBio === true ? undefined : true); setPage(1); }}>Yes</FilterChip>
                    <FilterChip active={hasBio === false} onClick={() => { setHasBio(hasBio === false ? undefined : false); setPage(1); }}>No</FilterChip>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1.5 block">Has Avatar</label>
                  <div className="flex gap-2">
                    <FilterChip active={hasAvatar === true} onClick={() => { setHasAvatar(hasAvatar === true ? undefined : true); setPage(1); }}>Yes</FilterChip>
                    <FilterChip active={hasAvatar === false} onClick={() => { setHasAvatar(hasAvatar === false ? undefined : false); setPage(1); }}>No</FilterChip>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1.5 block">Has Tags</label>
                  <div className="flex gap-2">
                    <FilterChip active={hasTags === true} onClick={() => { setHasTags(hasTags === true ? undefined : true); setPage(1); }}>Yes</FilterChip>
                    <FilterChip active={hasTags === false} onClick={() => { setHasTags(hasTags === false ? undefined : false); setPage(1); }}>No</FilterChip>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1.5 block">Phone Verified</label>
                  <div className="flex gap-2">
                    <FilterChip active={phoneVerified === true} onClick={() => { setPhoneVerified(phoneVerified === true ? undefined : true); setPage(1); }}>Yes</FilterChip>
                    <FilterChip active={phoneVerified === false} onClick={() => { setPhoneVerified(phoneVerified === false ? undefined : false); setPage(1); }}>No</FilterChip>
                  </div>
                </div>
              </div>
            </FilterSection>

            {/* Account Section */}
            <FilterSection 
              title="Account Settings" 
              icon={Bell} 
              expanded={showAccount}
              onToggle={() => setShowAccount(!showAccount)}
            >
              <div className="w-full grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-tertiary mb-1.5 block">Notifications</label>
                  <div className="flex gap-2">
                    <FilterChip active={notificationsEnabled === true} onClick={() => { setNotificationsEnabled(notificationsEnabled === true ? undefined : true); setPage(1); }}>Enabled</FilterChip>
                    <FilterChip active={notificationsEnabled === false} onClick={() => { setNotificationsEnabled(notificationsEnabled === false ? undefined : false); setPage(1); }}>Disabled</FilterChip>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1.5 block">Joined</label>
                  <div className="flex flex-wrap gap-2">
                    {(['all', '7d', '30d', '90d'] as JoinDateRange[]).map(opt => (
                      <FilterChip 
                        key={opt} 
                        active={joinDateRange === opt}
                        onClick={() => { setJoinDateRange(opt); setPage(1); }}
                      >
                        {opt === 'all' ? 'All Time' : `Last ${opt}`}
                      </FilterChip>
                    ))}
                  </div>
                </div>
              </div>
            </FilterSection>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-surface/50">
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">User</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Posts</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Streak</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-4" colSpan={7}>
                      <div className="h-10 bg-elevated/50 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={32} className="text-text-tertiary" />
                      <p className="text-text-secondary font-medium">No users found</p>
                      <p className="text-sm text-text-tertiary">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-elevated/30 transition-colors cursor-pointer"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm font-semibold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {user.is_favorite && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-post-win rounded-full flex items-center justify-center">
                              <Star size={10} className="text-black" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-text">@{user.username}</p>
                            {user.is_bot && (
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded">BOT</span>
                            )}
                          </div>
                          {user.full_name && (
                            <p className="text-xs text-text-secondary">{user.full_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-secondary">
                      {user.email || '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-text-secondary">
                      {user.phone || '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-text-secondary">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-text">{user.posts_count || 0}</span>
                    </td>
                    <td className="px-4 py-4">
                      {user.current_streak && user.current_streak > 0 ? (
                        <div className="flex items-center gap-1">
                          <Flame size={14} className="text-post-win" />
                          <span className="text-sm font-medium text-post-win">{user.current_streak}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        isActive(user.last_post_date)
                          ? 'bg-success/10 text-success'
                          : 'bg-text-tertiary/10 text-text-tertiary'
                      }`}>
                        {isActive(user.last_post_date) ? 'Active' : 'Inactive'}
                      </span>
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
              <span className="font-medium text-text">{total}</span> users
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

      {/* User Detail Modal */}
      <UserDetailModal
        userId={selectedUserId}
        isOpen={modalOpen}
        onClose={handleModalClose}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  )
}
