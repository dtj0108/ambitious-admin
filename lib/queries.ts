import { supabase, isSupabaseConfigured } from './supabase'

// Time period options
export type TimePeriod = 'today' | '7d' | '30d' | '90d' | 'all'

export const timePeriodLabels: Record<TimePeriod, string> = {
  today: 'Today',
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
  all: 'All Time',
}

// Helper to get start of today in ISO format
function getStartOfToday(): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString()
}

// Helper to get date N days ago
function getDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

// Get start date for a time period
function getStartDateForPeriod(period: TimePeriod): string | null {
  switch (period) {
    case 'today':
      return getStartOfToday()
    case '7d':
      return getDaysAgo(7)
    case '30d':
      return getDaysAgo(30)
    case '90d':
      return getDaysAgo(90)
    case 'all':
      return null
  }
}

// ===== DASHBOARD STATS =====

export async function getTotalUsers(): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0
  
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching total users:', error)
    return 0
  }
  return count || 0
}

export async function getPostsToday(): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0
  
  const startOfToday = getStartOfToday()
  
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfToday)

  if (error) {
    console.error('Error fetching posts today:', error)
    return 0
  }
  return count || 0
}

export async function getPostsForPeriod(period: TimePeriod): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0
  
  const startDate = getStartDateForPeriod(period)
  
  let query = supabase.from('posts').select('*', { count: 'exact', head: true })
  
  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error fetching posts for period:', error)
    return 0
  }
  return count || 0
}

export async function getCommentsToday(): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0
  
  const startOfToday = getStartOfToday()
  
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfToday)

  if (error) {
    console.error('Error fetching comments today:', error)
    return 0
  }
  return count || 0
}

export async function getCommentsForPeriod(period: TimePeriod): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0
  
  const startDate = getStartDateForPeriod(period)
  
  let query = supabase.from('comments').select('*', { count: 'exact', head: true })
  
  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error fetching comments for period:', error)
    return 0
  }
  return count || 0
}

export async function getTotalLikes(): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0
  
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching total likes:', error)
    return 0
  }
  return count || 0
}

export async function getLikesForPeriod(period: TimePeriod): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0
  
  const startDate = getStartDateForPeriod(period)
  
  let query = supabase.from('likes').select('*', { count: 'exact', head: true })
  
  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error fetching likes for period:', error)
    return 0
  }
  return count || 0
}

export async function getSignupsForPeriod(period: TimePeriod): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0
  
  const startDate = getStartDateForPeriod(period)
  
  let query = supabase.from('profiles').select('*', { count: 'exact', head: true })
  
  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error fetching signups for period:', error)
    return 0
  }
  return count || 0
}

// ===== SECONDARY STATS =====

export async function getNewSignups7d(): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0
  
  const sevenDaysAgo = getDaysAgo(7)
  
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo)

  if (error) {
    console.error('Error fetching new signups:', error)
    return 0
  }
  return count || 0
}

export async function getActiveUsers7d(): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0
  
  const sevenDaysAgo = getDaysAgo(7)
  
  // Get distinct user_ids who posted in last 7 days
  const { data, error } = await supabase
    .from('posts')
    .select('user_id')
    .gte('created_at', sevenDaysAgo)

  if (error) {
    console.error('Error fetching active users:', error)
    return 0
  }

  // Count unique user IDs
  const uniqueUsers = new Set(data?.map(p => p.user_id))
  return uniqueUsers.size
}

export async function getAverageStreak(): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0
  
  const { data, error } = await supabase
    .from('profiles')
    .select('current_streak')
    .not('current_streak', 'is', null)

  if (error) {
    console.error('Error fetching average streak:', error)
    return 0
  }

  if (!data || data.length === 0) return 0
  
  const total = data.reduce((sum, p) => sum + (p.current_streak || 0), 0)
  return Math.round((total / data.length) * 10) / 10
}

export async function getHiddenPostsCount(): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0
  
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('is_visible', false)

  if (error) {
    console.error('Error fetching hidden posts:', error)
    return 0
  }
  return count || 0
}

// ===== POSTS BY TYPE =====

export interface PostTypeCount {
  type: string
  count: number
}

export async function getPostsByType(): Promise<PostTypeCount[]> {
  if (!isSupabaseConfigured || !supabase) return []
  
  const { data, error } = await supabase
    .from('posts')
    .select('post_type')

  if (error) {
    console.error('Error fetching posts by type:', error)
    return []
  }

  // Count by type
  const counts: Record<string, number> = {
    win: 0,
    dream: 0,
    ask: 0,
    hangout: 0,
    intro: 0,
    general: 0,
  }

  data?.forEach(post => {
    const type = post.post_type || 'general'
    if (type in counts) {
      counts[type]++
    } else {
      counts.general++
    }
  })

  return Object.entries(counts).map(([type, count]) => ({ type, count }))
}

// ===== RECENT ACTIVITY =====

export interface RecentActivity {
  type: 'post' | 'comment' | 'user'
  message: string
  time: string
  created_at: string
}

export async function getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
  if (!isSupabaseConfigured || !supabase) return []
  
  const activities: RecentActivity[] = []

  // Get recent posts
  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, created_at, post_type, user_id')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get usernames for posts
  if (posts && posts.length > 0) {
    const userIds = [...new Set(posts.map(p => p.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds)

    const usernameMap = new Map(profiles?.map(p => [p.id, p.username]) || [])

    posts.forEach(post => {
      const username = usernameMap.get(post.user_id) || 'Unknown'
      const typeLabel = post.post_type || 'post'
      activities.push({
        type: 'post',
        message: `@${username} shared a ${typeLabel}`,
        time: formatRelativeTime(post.created_at),
        created_at: post.created_at,
      })
    })
  }

  // Get recent comments
  const { data: comments } = await supabase
    .from('comments')
    .select('id, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get usernames for comments
  if (comments && comments.length > 0) {
    const userIds = [...new Set(comments.map(c => c.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds)

    const usernameMap = new Map(profiles?.map(p => [p.id, p.username]) || [])

    comments.forEach(comment => {
      const username = usernameMap.get(comment.user_id) || 'Unknown'
      activities.push({
        type: 'comment',
        message: `@${username} left a comment`,
        time: formatRelativeTime(comment.created_at),
        created_at: comment.created_at,
      })
    })
  }

  // Get recent signups
  const { data: users } = await supabase
    .from('profiles')
    .select('id, username, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  users?.forEach(user => {
    activities.push({
      type: 'user',
      message: `@${user.username} joined Ambitious`,
      time: formatRelativeTime(user.created_at),
      created_at: user.created_at,
    })
  })

  // Sort by created_at and take top N
  return activities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
}

// ===== AGGREGATE FETCH =====

export interface DashboardData {
  totalUsers: number
  postsCount: number
  commentsCount: number
  likesCount: number
  newSignups: number
  activeUsers7d: number
  avgStreak: number
  hiddenPosts: number
  postsByType: PostTypeCount[]
  recentActivity: RecentActivity[]
  period: TimePeriod
}

export async function getDashboardData(period: TimePeriod = '7d'): Promise<DashboardData> {
  // Fetch all data in parallel for better performance
  const [
    totalUsers,
    postsCount,
    commentsCount,
    likesCount,
    newSignups,
    activeUsers7d,
    avgStreak,
    hiddenPosts,
    postsByType,
    recentActivity,
  ] = await Promise.all([
    getTotalUsers(),
    getPostsForPeriod(period),
    getCommentsForPeriod(period),
    getLikesForPeriod(period),
    getSignupsForPeriod(period),
    getActiveUsers7d(),
    getAverageStreak(),
    getHiddenPostsCount(),
    getPostsByType(),
    getRecentActivity(),
  ])

  return {
    totalUsers,
    postsCount,
    commentsCount,
    likesCount,
    newSignups,
    activeUsers7d,
    avgStreak,
    hiddenPosts,
    postsByType,
    recentActivity,
    period,
  }
}

// ===== ACTIVITY METRICS =====

// Get unique active users for a time period (posted, commented, or liked)
async function getActiveUsersForPeriod(startDate: string): Promise<Set<string>> {
  if (!isSupabaseConfigured || !supabase) return new Set()

  const activeUsers = new Set<string>()

  // Get users who posted
  const { data: postUsers } = await supabase
    .from('posts')
    .select('user_id')
    .gte('created_at', startDate)

  postUsers?.forEach(p => activeUsers.add(p.user_id))

  // Get users who commented
  const { data: commentUsers } = await supabase
    .from('comments')
    .select('user_id')
    .gte('created_at', startDate)

  commentUsers?.forEach(c => activeUsers.add(c.user_id))

  // Get users who liked
  const { data: likeUsers } = await supabase
    .from('likes')
    .select('user_id')
    .gte('created_at', startDate)

  likeUsers?.forEach(l => activeUsers.add(l.user_id))

  return activeUsers
}

export async function getDAU(): Promise<number> {
  const startOfToday = getStartOfToday()
  const activeUsers = await getActiveUsersForPeriod(startOfToday)
  return activeUsers.size
}

export async function getWAU(): Promise<number> {
  const sevenDaysAgo = getDaysAgo(7)
  const activeUsers = await getActiveUsersForPeriod(sevenDaysAgo)
  return activeUsers.size
}

export async function getMAU(): Promise<number> {
  const thirtyDaysAgo = getDaysAgo(30)
  const activeUsers = await getActiveUsersForPeriod(thirtyDaysAgo)
  return activeUsers.size
}

// Activity trend data for charts
export interface ActivityTrendPoint {
  date: string
  label: string
  posts: number
  comments: number
  likes: number
  total: number
}

export async function getActivityTrend(days: number = 7): Promise<ActivityTrendPoint[]> {
  if (!isSupabaseConfigured || !supabase) return []

  const trend: ActivityTrendPoint[] = []
  const now = new Date()

  // Fetch all data for the period
  const startDate = getDaysAgo(days)

  const [postsData, commentsData, likesData] = await Promise.all([
    supabase.from('posts').select('created_at').gte('created_at', startDate),
    supabase.from('comments').select('created_at').gte('created_at', startDate),
    supabase.from('likes').select('created_at').gte('created_at', startDate),
  ])

  // Group by day
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    const dateStr = date.toISOString().split('T')[0]
    const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

    const posts = postsData.data?.filter(p => {
      const d = new Date(p.created_at)
      return d >= date && d < nextDay
    }).length || 0

    const comments = commentsData.data?.filter(c => {
      const d = new Date(c.created_at)
      return d >= date && d < nextDay
    }).length || 0

    const likes = likesData.data?.filter(l => {
      const d = new Date(l.created_at)
      return d >= date && d < nextDay
    }).length || 0

    trend.push({
      date: dateStr,
      label,
      posts,
      comments,
      likes,
      total: posts + comments + likes,
    })
  }

  return trend
}

// Top active users
export interface TopActiveUser {
  id: string
  username: string
  avatar_url: string | null
  posts: number
  comments: number
  likes: number
  score: number
}

export async function getTopActiveUsers(limit: number = 5, days: number = 7): Promise<TopActiveUser[]> {
  if (!isSupabaseConfigured || !supabase) return []

  const startDate = getDaysAgo(days)

  // Get activity counts
  const [postsData, commentsData, likesData] = await Promise.all([
    supabase.from('posts').select('user_id').gte('created_at', startDate),
    supabase.from('comments').select('user_id').gte('created_at', startDate),
    supabase.from('likes').select('user_id').gte('created_at', startDate),
  ])

  // Count by user
  const userScores = new Map<string, { posts: number; comments: number; likes: number }>()

  postsData.data?.forEach(p => {
    const current = userScores.get(p.user_id) || { posts: 0, comments: 0, likes: 0 }
    current.posts++
    userScores.set(p.user_id, current)
  })

  commentsData.data?.forEach(c => {
    const current = userScores.get(c.user_id) || { posts: 0, comments: 0, likes: 0 }
    current.comments++
    userScores.set(c.user_id, current)
  })

  likesData.data?.forEach(l => {
    const current = userScores.get(l.user_id) || { posts: 0, comments: 0, likes: 0 }
    current.likes++
    userScores.set(l.user_id, current)
  })

  // Sort by total activity and get top N
  const topUserIds = [...userScores.entries()]
    .map(([id, counts]) => ({
      id,
      ...counts,
      score: counts.posts * 3 + counts.comments * 2 + counts.likes, // Weighted score
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  if (topUserIds.length === 0) return []

  // Get user profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', topUserIds.map(u => u.id))

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

  return topUserIds.map(user => ({
    id: user.id,
    username: profileMap.get(user.id)?.username || 'Unknown',
    avatar_url: profileMap.get(user.id)?.avatar_url || null,
    posts: user.posts,
    comments: user.comments,
    likes: user.likes,
    score: user.score,
  }))
}

// Activity metrics aggregate
export interface ActivityMetrics {
  dau: number
  wau: number
  mau: number
  trend: ActivityTrendPoint[]
  topUsers: TopActiveUser[]
}

export async function getActivityMetrics(): Promise<ActivityMetrics> {
  const [dau, wau, mau, trend, topUsers] = await Promise.all([
    getDAU(),
    getWAU(),
    getMAU(),
    getActivityTrend(7),
    getTopActiveUsers(5, 7),
  ])

  return { dau, wau, mau, trend, topUsers }
}

// ===== USER MANAGEMENT =====

export interface UserProfile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  email: string | null
  phone: string | null
  created_at: string
  current_streak: number | null
  longest_streak: number | null
  last_post_date: string | null
  referral_count: number | null
  tags: string[] | null
  is_favorite: boolean | null
  is_bot: boolean | null
  my_skills: string | null
  my_ambition: string | null
  help_with: string | null
  posts_count?: number
}

export type PostCountRange = 'any' | '0' | '1-10' | '10-50' | '50+'
export type ReferralCountRange = 'any' | 'has' | '5+' | '10+'
export type StreakThreshold = 'any' | '3+' | '7+' | '14+' | '30+'
export type JoinDateRange = 'all' | '7d' | '30d' | '90d'

export interface UserListOptions {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'newest' | 'oldest' | 'most_posts' | 'highest_streak' | 'most_referrals'
  // Original filters
  hasStreak?: boolean
  isBot?: boolean
  isFavorite?: boolean
  // Engagement filters
  postCount?: PostCountRange
  referralCount?: ReferralCountRange
  streakThreshold?: StreakThreshold
  // Profile completeness
  hasBio?: boolean
  hasAvatar?: boolean
  hasTags?: boolean
  phoneVerified?: boolean
  // Account flags
  notificationsEnabled?: boolean
  joinDateRange?: JoinDateRange
}

export interface UserListResult {
  users: UserProfile[]
  total: number
  page: number
  totalPages: number
}

export async function getUsers(options: UserListOptions = {}): Promise<UserListResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { users: [], total: 0, page: 1, totalPages: 0 }
  }

  const {
    page = 1,
    limit = 20,
    search = '',
    sortBy = 'newest',
    hasStreak,
    isBot,
    isFavorite,
    // New filters
    postCount,
    referralCount,
    streakThreshold,
    hasBio,
    hasAvatar,
    hasTags,
    phoneVerified,
    notificationsEnabled,
    joinDateRange,
  } = options

  const offset = (page - 1) * limit

  // Build query
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })

  // Apply search filter
  if (search) {
    query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`)
  }

  // Original filters
  if (hasStreak === true) {
    query = query.gt('current_streak', 0)
  }
  if (isBot !== undefined) {
    query = query.eq('is_bot', isBot)
  }
  if (isFavorite !== undefined) {
    query = query.eq('is_favorite', isFavorite)
  }

  // Referral count filter
  if (referralCount && referralCount !== 'any') {
    switch (referralCount) {
      case 'has':
        query = query.gt('referral_count', 0)
        break
      case '5+':
        query = query.gte('referral_count', 5)
        break
      case '10+':
        query = query.gte('referral_count', 10)
        break
    }
  }

  // Streak threshold filter
  if (streakThreshold && streakThreshold !== 'any') {
    switch (streakThreshold) {
      case '3+':
        query = query.gte('current_streak', 3)
        break
      case '7+':
        query = query.gte('current_streak', 7)
        break
      case '14+':
        query = query.gte('current_streak', 14)
        break
      case '30+':
        query = query.gte('current_streak', 30)
        break
    }
  }

  // Profile completeness filters
  if (hasBio === true) {
    query = query.not('bio', 'is', null).neq('bio', '')
  } else if (hasBio === false) {
    query = query.or('bio.is.null,bio.eq.')
  }

  if (hasAvatar === true) {
    query = query.not('avatar_url', 'is', null).neq('avatar_url', '')
  } else if (hasAvatar === false) {
    query = query.or('avatar_url.is.null,avatar_url.eq.')
  }

  if (hasTags === true) {
    query = query.not('tags', 'is', null)
  } else if (hasTags === false) {
    query = query.is('tags', null)
  }

  if (phoneVerified !== undefined) {
    query = query.eq('phone_verified', phoneVerified)
  }

  // Account flags
  if (notificationsEnabled !== undefined) {
    query = query.eq('push_notifications_enabled', notificationsEnabled)
  }

  // Join date range filter
  if (joinDateRange && joinDateRange !== 'all') {
    let daysAgo: number
    switch (joinDateRange) {
      case '7d':
        daysAgo = 7
        break
      case '30d':
        daysAgo = 30
        break
      case '90d':
        daysAgo = 90
        break
      default:
        daysAgo = 0
    }
    if (daysAgo > 0) {
      const startDate = getDaysAgo(daysAgo)
      query = query.gte('created_at', startDate)
    }
  }

  // Apply sorting
  switch (sortBy) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'highest_streak':
      query = query.order('current_streak', { ascending: false, nullsFirst: false })
      break
    case 'most_referrals':
      query = query.order('referral_count', { ascending: false, nullsFirst: false })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching users:', error)
    return { users: [], total: 0, page: 1, totalPages: 0 }
  }

  // Get post counts for each user
  const userIds = data?.map(u => u.id) || []
  let postsCountMap = new Map<string, number>()
  
  if (userIds.length > 0) {
    const { data: postCounts } = await supabase
      .from('posts')
      .select('user_id')
      .in('user_id', userIds)

    postCounts?.forEach(p => {
      postsCountMap.set(p.user_id, (postsCountMap.get(p.user_id) || 0) + 1)
    })
  }

  let users: UserProfile[] = (data || []).map(u => ({
    ...u,
    posts_count: postsCountMap.get(u.id) || 0,
  }))

  // Post count filter (applied after fetching since posts_count is computed)
  if (postCount && postCount !== 'any') {
    users = users.filter(u => {
      const count = u.posts_count || 0
      switch (postCount) {
        case '0':
          return count === 0
        case '1-10':
          return count >= 1 && count <= 10
        case '10-50':
          return count > 10 && count <= 50
        case '50+':
          return count > 50
        default:
          return true
      }
    })
  }

  // Sort by posts or referrals if needed (post-fetch since we don't have a posts_count column)
  if (sortBy === 'most_posts') {
    users.sort((a, b) => (b.posts_count || 0) - (a.posts_count || 0))
  }

  const total = postCount && postCount !== 'any' ? users.length : (count || 0)
  const totalPages = Math.ceil(total / limit)

  return { users, total, page, totalPages }
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  // Get post count
  const { count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return {
    ...data,
    posts_count: postsCount || 0,
  }
}

export interface UserStats {
  total: number
  newUsers7d: number
  activeUsers7d: number
  usersWithStreak: number
}

export async function getUserStats(): Promise<UserStats> {
  if (!isSupabaseConfigured || !supabase) {
    return { total: 0, newUsers7d: 0, activeUsers7d: 0, usersWithStreak: 0 }
  }

  const sevenDaysAgo = getDaysAgo(7)

  const [totalResult, newUsersResult, streakUsersResult] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('current_streak', 0),
  ])

  // Get active users (who posted in last 7 days)
  const activeUsers = await getActiveUsersForPeriod(sevenDaysAgo)

  return {
    total: totalResult.count || 0,
    newUsers7d: newUsersResult.count || 0,
    activeUsers7d: activeUsers.size,
    usersWithStreak: streakUsersResult.count || 0,
  }
}

export async function searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
  if (!isSupabaseConfigured || !supabase || !query) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(limit)

  if (error) {
    console.error('Error searching users:', error)
    return []
  }

  return data || []
}

export async function toggleUserFavorite(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  // Get current state
  const { data: user } = await supabase
    .from('profiles')
    .select('is_favorite')
    .eq('id', userId)
    .single()

  if (!user) return false

  const newState = !user.is_favorite

  const { error } = await supabase
    .from('profiles')
    .update({ is_favorite: newState })
    .eq('id', userId)

  if (error) {
    console.error('Error toggling favorite:', error)
    return false
  }

  return newState
}

// ===== POST MANAGEMENT =====

export type PostType = 'win' | 'dream' | 'ask' | 'hangout' | 'intro' | 'general'
export type PostDateRange = 'all' | 'today' | '7d' | '30d' | '90d'
export type EngagementLevel = 'any' | 'low' | 'medium' | 'high' | 'viral'

export interface PostWithAuthor {
  id: string
  user_id: string
  content: string
  image_url: string | null
  video_url: string | null
  post_type: PostType | null
  created_at: string
  updated_at: string | null
  location_name: string | null
  views_count: number | null
  like_count: number | null
  comment_count: number | null
  is_visible: boolean | null
  is_viral: boolean | null
  quoted_post_id: string | null
  // Author info
  author_username: string
  author_avatar_url: string | null
  author_full_name: string | null
}

export interface PostListOptions {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'newest' | 'oldest' | 'most_liked' | 'most_commented' | 'most_viewed'
  postType?: PostType | 'all'
  dateRange?: PostDateRange
  hasMedia?: boolean
  isVisible?: boolean
  isViral?: boolean
  engagementLevel?: EngagementLevel
}

export interface PostListResult {
  posts: PostWithAuthor[]
  total: number
  page: number
  totalPages: number
}

export async function getPosts(options: PostListOptions = {}): Promise<PostListResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { posts: [], total: 0, page: 1, totalPages: 0 }
  }

  const {
    page = 1,
    limit = 20,
    search = '',
    sortBy = 'newest',
    postType = 'all',
    dateRange = 'all',
    hasMedia,
    isVisible,
    isViral,
    engagementLevel = 'any',
  } = options

  const offset = (page - 1) * limit

  // Build query
  let query = supabase
    .from('posts')
    .select('*', { count: 'exact' })

  // Apply post type filter
  if (postType && postType !== 'all') {
    query = query.eq('post_type', postType)
  }

  // Apply date range filter
  if (dateRange && dateRange !== 'all') {
    let daysAgo: number
    switch (dateRange) {
      case 'today':
        daysAgo = 0
        query = query.gte('created_at', getStartOfToday())
        break
      case '7d':
        query = query.gte('created_at', getDaysAgo(7))
        break
      case '30d':
        query = query.gte('created_at', getDaysAgo(30))
        break
      case '90d':
        query = query.gte('created_at', getDaysAgo(90))
        break
    }
  }

  // Apply media filter
  if (hasMedia === true) {
    query = query.or('image_url.neq.,video_url.neq.')
  } else if (hasMedia === false) {
    query = query.is('image_url', null).is('video_url', null)
  }

  // Apply visibility filter
  if (isVisible !== undefined) {
    query = query.eq('is_visible', isVisible)
  }

  // Apply viral filter
  if (isViral === true) {
    query = query.eq('is_viral', true)
  }

  // Apply engagement level filter
  if (engagementLevel && engagementLevel !== 'any') {
    switch (engagementLevel) {
      case 'low':
        query = query.lt('like_count', 5)
        break
      case 'medium':
        query = query.gte('like_count', 5).lt('like_count', 20)
        break
      case 'high':
        query = query.gte('like_count', 20).lt('like_count', 50)
        break
      case 'viral':
        query = query.gte('like_count', 50)
        break
    }
  }

  // Apply sorting
  switch (sortBy) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'most_liked':
      query = query.order('like_count', { ascending: false, nullsFirst: false })
      break
    case 'most_commented':
      query = query.order('comment_count', { ascending: false, nullsFirst: false })
      break
    case 'most_viewed':
      query = query.order('views_count', { ascending: false, nullsFirst: false })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching posts:', error)
    return { posts: [], total: 0, page: 1, totalPages: 0 }
  }

  // Get author info for all posts
  const userIds = [...new Set(data?.map(p => p.user_id) || [])]
  let authorMap = new Map<string, { username: string; avatar_url: string | null; full_name: string | null }>()

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, full_name')
      .in('id', userIds)

    profiles?.forEach(p => {
      authorMap.set(p.id, { username: p.username, avatar_url: p.avatar_url, full_name: p.full_name })
    })
  }

  let posts: PostWithAuthor[] = (data || []).map(p => ({
    ...p,
    author_username: authorMap.get(p.user_id)?.username || 'Unknown',
    author_avatar_url: authorMap.get(p.user_id)?.avatar_url || null,
    author_full_name: authorMap.get(p.user_id)?.full_name || null,
  }))

  // Apply search filter (post-fetch for content search)
  if (search) {
    const searchLower = search.toLowerCase()
    posts = posts.filter(p => 
      p.content.toLowerCase().includes(searchLower) ||
      p.author_username.toLowerCase().includes(searchLower)
    )
  }

  const total = search ? posts.length : (count || 0)
  const totalPages = Math.ceil(total / limit)

  return { posts, total, page, totalPages }
}

export async function getPostById(postId: string): Promise<PostWithAuthor | null> {
  if (!isSupabaseConfigured || !supabase) return null

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (error) {
    console.error('Error fetching post:', error)
    return null
  }

  // Get author info
  const { data: author } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, full_name')
    .eq('id', data.user_id)
    .single()

  return {
    ...data,
    author_username: author?.username || 'Unknown',
    author_avatar_url: author?.avatar_url || null,
    author_full_name: author?.full_name || null,
  }
}

export interface PostStats {
  total: number
  postsToday: number
  postsThisWeek: number
  totalEngagement: number
  byType: Record<string, number>
}

export async function getPostStats(): Promise<PostStats> {
  if (!isSupabaseConfigured || !supabase) {
    return { total: 0, postsToday: 0, postsThisWeek: 0, totalEngagement: 0, byType: {} }
  }

  const startOfToday = getStartOfToday()
  const sevenDaysAgo = getDaysAgo(7)

  const [totalResult, todayResult, weekResult, allPostsResult] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday),
    supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('posts').select('post_type, like_count, comment_count'),
  ])

  // Calculate engagement and type breakdown
  let totalEngagement = 0
  const byType: Record<string, number> = {}

  allPostsResult.data?.forEach(post => {
    totalEngagement += (post.like_count || 0) + (post.comment_count || 0)
    const type = post.post_type || 'general'
    byType[type] = (byType[type] || 0) + 1
  })

  return {
    total: totalResult.count || 0,
    postsToday: todayResult.count || 0,
    postsThisWeek: weekResult.count || 0,
    totalEngagement,
    byType,
  }
}

export async function togglePostVisibility(postId: string): Promise<boolean | null> {
  if (!isSupabaseConfigured || !supabase) return null

  // Get current state
  const { data: post } = await supabase
    .from('posts')
    .select('is_visible')
    .eq('id', postId)
    .single()

  if (!post) return null

  const newState = !post.is_visible

  const { error } = await supabase
    .from('posts')
    .update({ is_visible: newState })
    .eq('id', postId)

  if (error) {
    console.error('Error toggling post visibility:', error)
    return null
  }

  return newState
}

// ===== MODERATION =====

export interface Report {
  id: string
  post_id: string
  reporter_id: string
  reason: string | null
  created_at: string
  // Joined data
  reporter_username: string
  reporter_avatar_url: string | null
  reporter_is_favorite: boolean
}

export interface FlaggedPost {
  id: string
  user_id: string
  content: string
  image_url: string | null
  video_url: string | null
  post_type: string | null
  created_at: string
  is_visible: boolean
  like_count: number | null
  comment_count: number | null
  // Author info
  author_username: string
  author_avatar_url: string | null
  author_full_name: string | null
  author_is_favorite: boolean
  // Report info
  report_count: number
  reports: Report[]
  latest_report_reason: string | null
  latest_report_date: string | null
}

export interface ModerationStats {
  totalReports: number
  reportsToday: number
  hiddenPosts: number
  pendingReview: number
}

export async function getModerationStats(): Promise<ModerationStats> {
  if (!isSupabaseConfigured || !supabase) {
    return { totalReports: 0, reportsToday: 0, hiddenPosts: 0, pendingReview: 0 }
  }

  const startOfToday = getStartOfToday()

  const [totalReportsResult, todayReportsResult, hiddenPostsResult] = await Promise.all([
    supabase.from('reports').select('*', { count: 'exact', head: true }),
    supabase.from('reports').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('is_visible', false),
  ])

  // Get posts that are hidden AND have reports (pending review)
  const { data: hiddenWithReports } = await supabase
    .from('posts')
    .select('id')
    .eq('is_visible', false)

  let pendingReview = 0
  if (hiddenWithReports && hiddenWithReports.length > 0) {
    const { count } = await supabase
      .from('reports')
      .select('post_id', { count: 'exact', head: true })
      .in('post_id', hiddenWithReports.map(p => p.id))
    pendingReview = count || 0
  }

  return {
    totalReports: totalReportsResult.count || 0,
    reportsToday: todayReportsResult.count || 0,
    hiddenPosts: hiddenPostsResult.count || 0,
    pendingReview: hiddenWithReports?.length || 0,
  }
}

export interface ReportListOptions {
  page?: number
  limit?: number
  postVisibility?: 'all' | 'visible' | 'hidden'
}

export async function getReportsGroupedByPost(options: ReportListOptions = {}): Promise<{
  posts: FlaggedPost[]
  total: number
  page: number
  totalPages: number
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { posts: [], total: 0, page: 1, totalPages: 0 }
  }

  const { page = 1, limit = 20, postVisibility = 'all' } = options
  const offset = (page - 1) * limit

  // Get all reports with post and reporter info
  let reportsQuery = supabase
    .from('reports')
    .select('id, post_id, reporter_id, reason, created_at')
    .order('created_at', { ascending: false })

  const { data: reports, error: reportsError } = await reportsQuery

  if (reportsError || !reports) {
    console.error('Error fetching reports:', reportsError)
    return { posts: [], total: 0, page: 1, totalPages: 0 }
  }

  // Get unique post IDs
  const postIds = [...new Set(reports.map(r => r.post_id))]
  
  if (postIds.length === 0) {
    return { posts: [], total: 0, page: 1, totalPages: 0 }
  }

  // Get post details
  let postsQuery = supabase
    .from('posts')
    .select('*')
    .in('id', postIds)

  if (postVisibility === 'visible') {
    postsQuery = postsQuery.eq('is_visible', true)
  } else if (postVisibility === 'hidden') {
    postsQuery = postsQuery.eq('is_visible', false)
  }

  const { data: posts, error: postsError } = await postsQuery

  if (postsError || !posts) {
    console.error('Error fetching posts:', postsError)
    return { posts: [], total: 0, page: 1, totalPages: 0 }
  }

  // Get author info
  const authorIds = [...new Set(posts.map(p => p.user_id))]
  const { data: authors } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, full_name, is_favorite')
    .in('id', authorIds)

  const authorMap = new Map(authors?.map(a => [a.id, a]) || [])

  // Get reporter info
  const reporterIds = [...new Set(reports.map(r => r.reporter_id))]
  const { data: reporters } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, is_favorite')
    .in('id', reporterIds)

  const reporterMap = new Map(reporters?.map(r => [r.id, r]) || [])

  // Group reports by post
  const reportsByPost = new Map<string, Report[]>()
  reports.forEach(r => {
    const reporter = reporterMap.get(r.reporter_id)
    const report: Report = {
      ...r,
      reporter_username: reporter?.username || 'Unknown',
      reporter_avatar_url: reporter?.avatar_url || null,
      reporter_is_favorite: reporter?.is_favorite || false,
    }
    
    if (!reportsByPost.has(r.post_id)) {
      reportsByPost.set(r.post_id, [])
    }
    reportsByPost.get(r.post_id)!.push(report)
  })

  // Build flagged posts array
  const flaggedPosts: FlaggedPost[] = posts
    .filter(p => reportsByPost.has(p.id))
    .map(p => {
      const postReports = reportsByPost.get(p.id) || []
      const author = authorMap.get(p.user_id)
      const latestReport = postReports[0]

      return {
        id: p.id,
        user_id: p.user_id,
        content: p.content,
        image_url: p.image_url,
        video_url: p.video_url,
        post_type: p.post_type,
        created_at: p.created_at,
        is_visible: p.is_visible ?? true,
        like_count: p.like_count,
        comment_count: p.comment_count,
        author_username: author?.username || 'Unknown',
        author_avatar_url: author?.avatar_url || null,
        author_full_name: author?.full_name || null,
        author_is_favorite: author?.is_favorite || false,
        report_count: postReports.length,
        reports: postReports,
        latest_report_reason: latestReport?.reason || null,
        latest_report_date: latestReport?.created_at || null,
      }
    })
    .sort((a, b) => {
      // Sort by most reports first, then by latest report date
      if (b.report_count !== a.report_count) {
        return b.report_count - a.report_count
      }
      return new Date(b.latest_report_date || 0).getTime() - new Date(a.latest_report_date || 0).getTime()
    })

  // Apply pagination
  const total = flaggedPosts.length
  const paginatedPosts = flaggedPosts.slice(offset, offset + limit)
  const totalPages = Math.ceil(total / limit)

  return { posts: paginatedPosts, total, page, totalPages }
}

export async function getHiddenPosts(options: { page?: number; limit?: number } = {}): Promise<{
  posts: FlaggedPost[]
  total: number
  page: number
  totalPages: number
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { posts: [], total: 0, page: 1, totalPages: 0 }
  }

  const { page = 1, limit = 20 } = options
  const offset = (page - 1) * limit

  // Get hidden posts
  const { data: posts, count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('is_visible', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error || !posts) {
    console.error('Error fetching hidden posts:', error)
    return { posts: [], total: 0, page: 1, totalPages: 0 }
  }

  // Get author info
  const authorIds = [...new Set(posts.map(p => p.user_id))]
  const { data: authors } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, full_name, is_favorite')
    .in('id', authorIds)

  const authorMap = new Map(authors?.map(a => [a.id, a]) || [])

  // Get reports for these posts
  const postIds = posts.map(p => p.id)
  const { data: reports } = await supabase
    .from('reports')
    .select('id, post_id, reporter_id, reason, created_at')
    .in('post_id', postIds)
    .order('created_at', { ascending: false })

  // Get reporter info
  const reporterIds = [...new Set(reports?.map(r => r.reporter_id) || [])]
  const { data: reporters } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, is_favorite')
    .in('id', reporterIds.length > 0 ? reporterIds : ['none'])

  const reporterMap = new Map(reporters?.map(r => [r.id, r]) || [])

  // Group reports by post
  const reportsByPost = new Map<string, Report[]>()
  reports?.forEach(r => {
    const reporter = reporterMap.get(r.reporter_id)
    const report: Report = {
      ...r,
      reporter_username: reporter?.username || 'Unknown',
      reporter_avatar_url: reporter?.avatar_url || null,
      reporter_is_favorite: reporter?.is_favorite || false,
    }
    
    if (!reportsByPost.has(r.post_id)) {
      reportsByPost.set(r.post_id, [])
    }
    reportsByPost.get(r.post_id)!.push(report)
  })

  // Build flagged posts array
  const flaggedPosts: FlaggedPost[] = posts.map(p => {
    const postReports = reportsByPost.get(p.id) || []
    const author = authorMap.get(p.user_id)
    const latestReport = postReports[0]

    return {
      id: p.id,
      user_id: p.user_id,
      content: p.content,
      image_url: p.image_url,
      video_url: p.video_url,
      post_type: p.post_type,
      created_at: p.created_at,
      is_visible: p.is_visible ?? true,
      like_count: p.like_count,
      comment_count: p.comment_count,
      author_username: author?.username || 'Unknown',
      author_avatar_url: author?.avatar_url || null,
      author_full_name: author?.full_name || null,
      author_is_favorite: author?.is_favorite || false,
      report_count: postReports.length,
      reports: postReports,
      latest_report_reason: latestReport?.reason || null,
      latest_report_date: latestReport?.created_at || null,
    }
  })

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return { posts: flaggedPosts, total, page, totalPages }
}

export async function restorePost(postId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  const { error } = await supabase
    .from('posts')
    .update({ is_visible: true })
    .eq('id', postId)

  if (error) {
    console.error('Error restoring post:', error)
    return false
  }

  return true
}

export async function hidePost(postId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  const { error } = await supabase
    .from('posts')
    .update({ is_visible: false })
    .eq('id', postId)

  if (error) {
    console.error('Error hiding post:', error)
    return false
  }

  return true
}

// ===== COMMENTS =====

export interface CommentWithContext {
  id: string
  user_id: string
  post_id: string
  content: string
  created_at: string
  parent_id: string | null
  like_count: number | null
  // Author info
  author_username: string
  author_avatar_url: string | null
  author_full_name: string | null
  // Post info
  post_content: string
  post_author_username: string
  // Parent comment info (if reply)
  parent_content: string | null
  parent_author_username: string | null
  // Reply count
  reply_count: number
}

export type CommentDateRange = 'all' | 'today' | '7d' | '30d'

export interface CommentListOptions {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'newest' | 'oldest' | 'most_liked'
  dateRange?: CommentDateRange
  hasReplies?: boolean
  isReply?: boolean
}

export interface CommentListResult {
  comments: CommentWithContext[]
  total: number
  page: number
  totalPages: number
}

export async function getComments(options: CommentListOptions = {}): Promise<CommentListResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { comments: [], total: 0, page: 1, totalPages: 0 }
  }

  const {
    page = 1,
    limit = 20,
    search = '',
    sortBy = 'newest',
    dateRange = 'all',
    hasReplies,
    isReply,
  } = options

  const offset = (page - 1) * limit

  // Build query
  let query = supabase
    .from('comments')
    .select('*', { count: 'exact' })

  // Apply date range filter
  if (dateRange && dateRange !== 'all') {
    switch (dateRange) {
      case 'today':
        query = query.gte('created_at', getStartOfToday())
        break
      case '7d':
        query = query.gte('created_at', getDaysAgo(7))
        break
      case '30d':
        query = query.gte('created_at', getDaysAgo(30))
        break
    }
  }

  // Filter by reply status
  if (isReply === true) {
    query = query.not('parent_id', 'is', null)
  } else if (isReply === false) {
    query = query.is('parent_id', null)
  }

  // Apply sorting
  switch (sortBy) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'most_liked':
      query = query.order('like_count', { ascending: false, nullsFirst: false })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data: comments, count, error } = await query

  if (error || !comments) {
    console.error('Error fetching comments:', error)
    return { comments: [], total: 0, page: 1, totalPages: 0 }
  }

  // Get author info
  const authorIds = [...new Set(comments.map(c => c.user_id))]
  const { data: authors } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, full_name')
    .in('id', authorIds)

  const authorMap = new Map(authors?.map(a => [a.id, a]) || [])

  // Get post info
  const postIds = [...new Set(comments.map(c => c.post_id))]
  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, user_id')
    .in('id', postIds)

  // Get post authors
  const postAuthorIds = [...new Set(posts?.map(p => p.user_id) || [])]
  const { data: postAuthors } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', postAuthorIds.length > 0 ? postAuthorIds : ['none'])

  const postAuthorMap = new Map(postAuthors?.map(a => [a.id, a]) || [])
  const postMap = new Map(posts?.map(p => [p.id, { ...p, author_username: postAuthorMap.get(p.user_id)?.username || 'Unknown' }]) || [])

  // Get parent comments (for replies)
  const parentIds = comments.filter(c => c.parent_id).map(c => c.parent_id)
  let parentMap = new Map<string, { content: string; author_username: string }>()
  
  if (parentIds.length > 0) {
    const { data: parentComments } = await supabase
      .from('comments')
      .select('id, content, user_id')
      .in('id', parentIds)

    const parentAuthorIds = [...new Set(parentComments?.map(c => c.user_id) || [])]
    const { data: parentAuthors } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', parentAuthorIds.length > 0 ? parentAuthorIds : ['none'])

    const parentAuthorMap = new Map(parentAuthors?.map(a => [a.id, a]) || [])
    
    parentComments?.forEach(c => {
      parentMap.set(c.id, {
        content: c.content,
        author_username: parentAuthorMap.get(c.user_id)?.username || 'Unknown',
      })
    })
  }

  // Get reply counts for each comment
  const commentIds = comments.map(c => c.id)
  const { data: replyCounts } = await supabase
    .from('comments')
    .select('parent_id')
    .in('parent_id', commentIds)

  const replyCountMap = new Map<string, number>()
  replyCounts?.forEach(r => {
    replyCountMap.set(r.parent_id, (replyCountMap.get(r.parent_id) || 0) + 1)
  })

  // Build comments with context
  let commentsWithContext: CommentWithContext[] = comments.map(c => {
    const author = authorMap.get(c.user_id)
    const post = postMap.get(c.post_id)
    const parent = c.parent_id ? parentMap.get(c.parent_id) : null

    return {
      id: c.id,
      user_id: c.user_id,
      post_id: c.post_id,
      content: c.content,
      created_at: c.created_at,
      parent_id: c.parent_id,
      like_count: c.like_count || 0,
      author_username: author?.username || 'Unknown',
      author_avatar_url: author?.avatar_url || null,
      author_full_name: author?.full_name || null,
      post_content: post?.content || 'Post not found',
      post_author_username: post?.author_username || 'Unknown',
      parent_content: parent?.content || null,
      parent_author_username: parent?.author_username || null,
      reply_count: replyCountMap.get(c.id) || 0,
    }
  })

  // Apply search filter (post-fetch)
  if (search) {
    const searchLower = search.toLowerCase()
    commentsWithContext = commentsWithContext.filter(c =>
      c.content.toLowerCase().includes(searchLower) ||
      c.author_username.toLowerCase().includes(searchLower)
    )
  }

  // Filter by has replies (post-fetch since we computed reply counts)
  if (hasReplies === true) {
    commentsWithContext = commentsWithContext.filter(c => c.reply_count > 0)
  } else if (hasReplies === false) {
    commentsWithContext = commentsWithContext.filter(c => c.reply_count === 0)
  }

  const total = search || hasReplies !== undefined ? commentsWithContext.length : (count || 0)
  const totalPages = Math.ceil(total / limit)

  return { comments: commentsWithContext, total, page, totalPages }
}

export async function getCommentById(commentId: string): Promise<CommentWithContext | null> {
  if (!isSupabaseConfigured || !supabase) return null

  const { data: comment, error } = await supabase
    .from('comments')
    .select('*')
    .eq('id', commentId)
    .single()

  if (error || !comment) {
    console.error('Error fetching comment:', error)
    return null
  }

  // Get author
  const { data: author } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, full_name')
    .eq('id', comment.user_id)
    .single()

  // Get post
  const { data: post } = await supabase
    .from('posts')
    .select('id, content, user_id')
    .eq('id', comment.post_id)
    .single()

  let postAuthorUsername = 'Unknown'
  if (post) {
    const { data: postAuthor } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', post.user_id)
      .single()
    postAuthorUsername = postAuthor?.username || 'Unknown'
  }

  // Get parent if reply
  let parent = null
  if (comment.parent_id) {
    const { data: parentComment } = await supabase
      .from('comments')
      .select('id, content, user_id')
      .eq('id', comment.parent_id)
      .single()

    if (parentComment) {
      const { data: parentAuthor } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', parentComment.user_id)
        .single()

      parent = {
        content: parentComment.content,
        author_username: parentAuthor?.username || 'Unknown',
      }
    }
  }

  // Get reply count
  const { count: replyCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', commentId)

  return {
    id: comment.id,
    user_id: comment.user_id,
    post_id: comment.post_id,
    content: comment.content,
    created_at: comment.created_at,
    parent_id: comment.parent_id,
    like_count: comment.like_count || 0,
    author_username: author?.username || 'Unknown',
    author_avatar_url: author?.avatar_url || null,
    author_full_name: author?.full_name || null,
    post_content: post?.content || 'Post not found',
    post_author_username: postAuthorUsername,
    parent_content: parent?.content || null,
    parent_author_username: parent?.author_username || null,
    reply_count: replyCount || 0,
  }
}

export interface CommentStats {
  total: number
  commentsToday: number
  commentsThisWeek: number
  uniqueCommenters7d: number
  replyCount: number
}

export async function getCommentStats(): Promise<CommentStats> {
  if (!isSupabaseConfigured || !supabase) {
    return { total: 0, commentsToday: 0, commentsThisWeek: 0, uniqueCommenters7d: 0, replyCount: 0 }
  }

  const startOfToday = getStartOfToday()
  const sevenDaysAgo = getDaysAgo(7)

  const [totalResult, todayResult, weekResult, repliesResult, commentersResult] = await Promise.all([
    supabase.from('comments').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday),
    supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('comments').select('*', { count: 'exact', head: true }).not('parent_id', 'is', null),
    supabase.from('comments').select('user_id').gte('created_at', sevenDaysAgo),
  ])

  const uniqueCommenters = new Set(commentersResult.data?.map(c => c.user_id) || [])

  return {
    total: totalResult.count || 0,
    commentsToday: todayResult.count || 0,
    commentsThisWeek: weekResult.count || 0,
    uniqueCommenters7d: uniqueCommenters.size,
    replyCount: repliesResult.count || 0,
  }
}

export async function getCommentReplies(commentId: string): Promise<CommentWithContext[]> {
  if (!isSupabaseConfigured || !supabase) return []

  const { data: replies, error } = await supabase
    .from('comments')
    .select('*')
    .eq('parent_id', commentId)
    .order('created_at', { ascending: true })

  if (error || !replies) {
    console.error('Error fetching replies:', error)
    return []
  }

  // Get authors
  const authorIds = [...new Set(replies.map(r => r.user_id))]
  const { data: authors } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, full_name')
    .in('id', authorIds)

  const authorMap = new Map(authors?.map(a => [a.id, a]) || [])

  // Get the parent comment for context
  const { data: parentComment } = await supabase
    .from('comments')
    .select('post_id')
    .eq('id', commentId)
    .single()

  return replies.map(r => ({
    id: r.id,
    user_id: r.user_id,
    post_id: parentComment?.post_id || r.post_id,
    content: r.content,
    created_at: r.created_at,
    parent_id: r.parent_id,
    like_count: r.like_count || 0,
    author_username: authorMap.get(r.user_id)?.username || 'Unknown',
    author_avatar_url: authorMap.get(r.user_id)?.avatar_url || null,
    author_full_name: authorMap.get(r.user_id)?.full_name || null,
    post_content: '',
    post_author_username: '',
    parent_content: null,
    parent_author_username: null,
    reply_count: 0,
  }))
}

export async function deleteComment(commentId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting comment:', error)
    return false
  }

  return true
}

// ===== MESSAGES (Stats Only - Privacy) =====

export interface MessageStats {
  total: number
  messagesToday: number
  messagesThisWeek: number
  activeConversations7d: number
  uniqueSenders7d: number
  byType: {
    text: number
    system: number
    image: number
    video: number
  }
}

export async function getMessageStats(): Promise<MessageStats> {
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase not configured for messages')
    return {
      total: 0,
      messagesToday: 0,
      messagesThisWeek: 0,
      activeConversations7d: 0,
      uniqueSenders7d: 0,
      byType: { text: 0, system: 0, image: 0, video: 0 },
    }
  }

  const startOfToday = getStartOfToday()
  const sevenDaysAgo = getDaysAgo(7)

  try {
    const [totalResult, todayResult, weekResult, allMessagesResult] = await Promise.all([
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday),
      supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('messages').select('sender_id, conversation_id, message_type').gte('created_at', sevenDaysAgo),
    ])

    // Log any errors
    if (totalResult.error) console.error('Messages total error:', totalResult.error)
    if (todayResult.error) console.error('Messages today error:', todayResult.error)
    if (weekResult.error) console.error('Messages week error:', weekResult.error)
    if (allMessagesResult.error) console.error('Messages all error:', allMessagesResult.error)

    // Calculate unique conversations and senders
    const uniqueConversations = new Set(allMessagesResult.data?.map(m => m.conversation_id).filter(Boolean) || [])
    const uniqueSenders = new Set(allMessagesResult.data?.map(m => m.sender_id).filter(Boolean) || [])

    // Calculate by type
    const byType = { text: 0, system: 0, image: 0, video: 0 }
    
    // Get all messages for type breakdown
    const { data: allMessages, error: typeError } = await supabase
      .from('messages')
      .select('message_type')

    if (typeError) console.error('Messages type error:', typeError)

    allMessages?.forEach(m => {
      const type = m.message_type || 'text'
      if (type in byType) {
        byType[type as keyof typeof byType]++
      } else {
        byType.text++ // Default to text
      }
    })

    return {
      total: totalResult.count || 0,
      messagesToday: todayResult.count || 0,
      messagesThisWeek: weekResult.count || 0,
      activeConversations7d: uniqueConversations.size,
      uniqueSenders7d: uniqueSenders.size,
      byType,
    }
  } catch (error) {
    console.error('Error fetching message stats:', error)
    return {
      total: 0,
      messagesToday: 0,
      messagesThisWeek: 0,
      activeConversations7d: 0,
      uniqueSenders7d: 0,
      byType: { text: 0, system: 0, image: 0, video: 0 },
    }
  }
}

export interface MessageActivityPoint {
  date: string
  label: string
  count: number
}

export async function getMessageActivityTrend(days: number = 7): Promise<MessageActivityPoint[]> {
  if (!isSupabaseConfigured || !supabase) return []

  const startDate = getDaysAgo(days)
  const now = new Date()

  const { data: messages, error } = await supabase
    .from('messages')
    .select('created_at')
    .gte('created_at', startDate)

  if (error) {
    console.error('Error fetching message activity:', error)
    return []
  }

  // Build activity by day
  const activityMap = new Map<string, number>()

  // Initialize all days with 0
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const dateStr = date.toISOString().split('T')[0]
    activityMap.set(dateStr, 0)
  }

  // Count messages per day
  messages?.forEach(m => {
    const dateStr = new Date(m.created_at).toISOString().split('T')[0]
    if (activityMap.has(dateStr)) {
      activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1)
    }
  })

  // Convert to array
  return Array.from(activityMap.entries()).map(([date, count]) => {
    const d = new Date(date)
    return {
      date,
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      count,
    }
  })
}

// ===== NOTIFICATIONS =====

export type NotificationType = 'like' | 'comment' | 'follow' | 'message' | 'mention' | 'post_hidden'

export interface NotificationWithContext {
  id: string
  user_id: string
  type: NotificationType
  actor_id: string | null
  post_id: string | null
  comment_id: string | null
  conversation_id: string | null
  content: string | null
  read_at: string | null
  dismissed_at: string | null
  created_at: string
  // Joined data
  recipient_username: string
  recipient_avatar_url: string | null
  actor_username: string | null
  actor_avatar_url: string | null
}

export interface NotificationStats {
  total: number
  unread: number
  notificationsToday: number
  dismissed: number
  byType: Record<string, number>
}

export async function getNotificationStats(): Promise<NotificationStats> {
  if (!isSupabaseConfigured || !supabase) {
    return { total: 0, unread: 0, notificationsToday: 0, dismissed: 0, byType: {} }
  }

  const startOfToday = getStartOfToday()

  try {
    const [totalResult, unreadResult, todayResult, dismissedResult, allResult] = await Promise.all([
      supabase.from('notifications').select('*', { count: 'exact', head: true }),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).is('read_at', null),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).not('dismissed_at', 'is', null),
      supabase.from('notifications').select('type'),
    ])

    // Calculate by type
    const byType: Record<string, number> = {}
    allResult.data?.forEach(n => {
      const type = n.type || 'other'
      byType[type] = (byType[type] || 0) + 1
    })

    return {
      total: totalResult.count || 0,
      unread: unreadResult.count || 0,
      notificationsToday: todayResult.count || 0,
      dismissed: dismissedResult.count || 0,
      byType,
    }
  } catch (error) {
    console.error('Error fetching notification stats:', error)
    return { total: 0, unread: 0, notificationsToday: 0, dismissed: 0, byType: {} }
  }
}

export type NotificationDateRange = 'all' | 'today' | '7d' | '30d'
export type NotificationReadStatus = 'all' | 'read' | 'unread'

export interface NotificationListOptions {
  page?: number
  limit?: number
  type?: NotificationType | 'all'
  readStatus?: NotificationReadStatus
  dateRange?: NotificationDateRange
}

export interface NotificationListResult {
  notifications: NotificationWithContext[]
  total: number
  page: number
  totalPages: number
}

export async function getNotifications(options: NotificationListOptions = {}): Promise<NotificationListResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { notifications: [], total: 0, page: 1, totalPages: 0 }
  }

  const {
    page = 1,
    limit = 20,
    type = 'all',
    readStatus = 'all',
    dateRange = 'all',
  } = options

  const offset = (page - 1) * limit

  try {
    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })

    // Filter by type
    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    // Filter by read status
    if (readStatus === 'read') {
      query = query.not('read_at', 'is', null)
    } else if (readStatus === 'unread') {
      query = query.is('read_at', null)
    }

    // Filter by date range
    if (dateRange && dateRange !== 'all') {
      switch (dateRange) {
        case 'today':
          query = query.gte('created_at', getStartOfToday())
          break
        case '7d':
          query = query.gte('created_at', getDaysAgo(7))
          break
        case '30d':
          query = query.gte('created_at', getDaysAgo(30))
          break
      }
    }

    // Order and paginate
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: notifications, count, error } = await query

    if (error || !notifications) {
      console.error('Error fetching notifications:', error)
      return { notifications: [], total: 0, page: 1, totalPages: 0 }
    }

    // Get recipient profiles
    const recipientIds = [...new Set(notifications.map(n => n.user_id))]
    const { data: recipients } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', recipientIds)

    const recipientMap = new Map(recipients?.map(r => [r.id, r]) || [])

    // Get actor profiles
    const actorIds = [...new Set(notifications.map(n => n.actor_id).filter(Boolean))]
    let actorMap = new Map<string, { username: string; avatar_url: string | null }>()
    
    if (actorIds.length > 0) {
      const { data: actors } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', actorIds as string[])

      actorMap = new Map(actors?.map(a => [a.id, a]) || [])
    }

    // Build notifications with context
    const notificationsWithContext: NotificationWithContext[] = notifications.map(n => {
      const recipient = recipientMap.get(n.user_id)
      const actor = n.actor_id ? actorMap.get(n.actor_id) : null

      return {
        id: n.id,
        user_id: n.user_id,
        type: n.type,
        actor_id: n.actor_id,
        post_id: n.post_id,
        comment_id: n.comment_id,
        conversation_id: n.conversation_id,
        content: n.content,
        read_at: n.read_at,
        dismissed_at: n.dismissed_at,
        created_at: n.created_at,
        recipient_username: recipient?.username || 'Unknown',
        recipient_avatar_url: recipient?.avatar_url || null,
        actor_username: actor?.username || null,
        actor_avatar_url: actor?.avatar_url || null,
      }
    })

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return { notifications: notificationsWithContext, total, page, totalPages }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return { notifications: [], total: 0, page: 1, totalPages: 0 }
  }
}

export async function getNotificationById(notificationId: string): Promise<NotificationWithContext | null> {
  if (!isSupabaseConfigured || !supabase) return null

  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single()

    if (error || !notification) {
      console.error('Error fetching notification:', error)
      return null
    }

    // Get recipient
    const { data: recipient } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('id', notification.user_id)
      .single()

    // Get actor if exists
    let actor = null
    if (notification.actor_id) {
      const { data: actorData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', notification.actor_id)
        .single()
      actor = actorData
    }

    return {
      id: notification.id,
      user_id: notification.user_id,
      type: notification.type,
      actor_id: notification.actor_id,
      post_id: notification.post_id,
      comment_id: notification.comment_id,
      conversation_id: notification.conversation_id,
      content: notification.content,
      read_at: notification.read_at,
      dismissed_at: notification.dismissed_at,
      created_at: notification.created_at,
      recipient_username: recipient?.username || 'Unknown',
      recipient_avatar_url: recipient?.avatar_url || null,
      actor_username: actor?.username || null,
      actor_avatar_url: actor?.avatar_url || null,
    }
  } catch (error) {
    console.error('Error fetching notification:', error)
    return null
  }
}

// ===== MEET REQUESTS =====

export type MeetRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface MeetRequestWithUsers {
  id: string
  requester_id: string
  recipient_id: string
  status: MeetRequestStatus
  created_at: string
  responded_at: string | null
  // Joined data
  requester_username: string
  requester_avatar_url: string | null
  requester_full_name: string | null
  recipient_username: string
  recipient_avatar_url: string | null
  recipient_full_name: string | null
}

export interface MeetStats {
  totalRequests: number
  pending: number
  accepted: number
  rejected: number
  totalSwipes7d: number
  matchRate: number
  swipesByAction: Record<string, number>
}

export async function getMeetStats(): Promise<MeetStats> {
  if (!isSupabaseConfigured || !supabase) {
    return { totalRequests: 0, pending: 0, accepted: 0, rejected: 0, totalSwipes7d: 0, matchRate: 0, swipesByAction: {} }
  }

  const sevenDaysAgo = getDaysAgo(7)

  try {
    const [totalResult, pendingResult, acceptedResult, rejectedResult, swipesResult] = await Promise.all([
      supabase.from('meet_requests').select('*', { count: 'exact', head: true }),
      supabase.from('meet_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('meet_requests').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
      supabase.from('meet_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('meet_swipe_history').select('action').gte('created_at', sevenDaysAgo),
    ])

    // Calculate swipes by action
    const swipesByAction: Record<string, number> = {}
    swipesResult.data?.forEach(s => {
      const action = s.action || 'unknown'
      swipesByAction[action] = (swipesByAction[action] || 0) + 1
    })

    const totalSwipes7d = swipesResult.data?.length || 0
    const accepted = acceptedResult.count || 0
    const totalRequests = totalResult.count || 0
    const matchRate = totalRequests > 0 ? Math.round((accepted / totalRequests) * 100) : 0

    return {
      totalRequests,
      pending: pendingResult.count || 0,
      accepted,
      rejected: rejectedResult.count || 0,
      totalSwipes7d,
      matchRate,
      swipesByAction,
    }
  } catch (error) {
    console.error('Error fetching meet stats:', error)
    return { totalRequests: 0, pending: 0, accepted: 0, rejected: 0, totalSwipes7d: 0, matchRate: 0, swipesByAction: {} }
  }
}

export type MeetDateRange = 'all' | 'today' | '7d' | '30d'

export interface MeetRequestListOptions {
  page?: number
  limit?: number
  status?: MeetRequestStatus | 'all'
  dateRange?: MeetDateRange
}

export interface MeetRequestListResult {
  requests: MeetRequestWithUsers[]
  total: number
  page: number
  totalPages: number
}

export async function getMeetRequests(options: MeetRequestListOptions = {}): Promise<MeetRequestListResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { requests: [], total: 0, page: 1, totalPages: 0 }
  }

  const {
    page = 1,
    limit = 20,
    status = 'all',
    dateRange = 'all',
  } = options

  const offset = (page - 1) * limit

  try {
    // Build query
    let query = supabase
      .from('meet_requests')
      .select('*', { count: 'exact' })

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Filter by date range
    if (dateRange && dateRange !== 'all') {
      switch (dateRange) {
        case 'today':
          query = query.gte('created_at', getStartOfToday())
          break
        case '7d':
          query = query.gte('created_at', getDaysAgo(7))
          break
        case '30d':
          query = query.gte('created_at', getDaysAgo(30))
          break
      }
    }

    // Order and paginate
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: requests, count, error } = await query

    if (error || !requests) {
      console.error('Error fetching meet requests:', error)
      return { requests: [], total: 0, page: 1, totalPages: 0 }
    }

    // Get all unique user IDs
    const userIds = new Set<string>()
    requests.forEach(r => {
      userIds.add(r.requester_id)
      userIds.add(r.recipient_id)
    })

    // Fetch user profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, full_name')
      .in('id', Array.from(userIds))

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Build requests with user data
    const requestsWithUsers: MeetRequestWithUsers[] = requests.map(r => {
      const requester = profileMap.get(r.requester_id)
      const recipient = profileMap.get(r.recipient_id)

      return {
        id: r.id,
        requester_id: r.requester_id,
        recipient_id: r.recipient_id,
        status: r.status,
        created_at: r.created_at,
        responded_at: r.responded_at,
        requester_username: requester?.username || 'Unknown',
        requester_avatar_url: requester?.avatar_url || null,
        requester_full_name: requester?.full_name || null,
        recipient_username: recipient?.username || 'Unknown',
        recipient_avatar_url: recipient?.avatar_url || null,
        recipient_full_name: recipient?.full_name || null,
      }
    })

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return { requests: requestsWithUsers, total, page, totalPages }
  } catch (error) {
    console.error('Error fetching meet requests:', error)
    return { requests: [], total: 0, page: 1, totalPages: 0 }
  }
}

export async function getMeetRequestById(requestId: string): Promise<MeetRequestWithUsers | null> {
  if (!isSupabaseConfigured || !supabase) return null

  try {
    const { data: request, error } = await supabase
      .from('meet_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (error || !request) {
      console.error('Error fetching meet request:', error)
      return null
    }

    // Get both user profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, full_name')
      .in('id', [request.requester_id, request.recipient_id])

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
    const requester = profileMap.get(request.requester_id)
    const recipient = profileMap.get(request.recipient_id)

    return {
      id: request.id,
      requester_id: request.requester_id,
      recipient_id: request.recipient_id,
      status: request.status,
      created_at: request.created_at,
      responded_at: request.responded_at,
      requester_username: requester?.username || 'Unknown',
      requester_avatar_url: requester?.avatar_url || null,
      requester_full_name: requester?.full_name || null,
      recipient_username: recipient?.username || 'Unknown',
      recipient_avatar_url: recipient?.avatar_url || null,
      recipient_full_name: recipient?.full_name || null,
    }
  } catch (error) {
    console.error('Error fetching meet request:', error)
    return null
  }
}

export interface SwipeActivityDay {
  date: string
  label: string
  count: number
  byAction: Record<string, number>
}

export async function getSwipeActivityTrend(days: number = 7): Promise<SwipeActivityDay[]> {
  if (!isSupabaseConfigured || !supabase) return []

  const now = new Date()
  const startDate = getDaysAgo(days)

  const { data: swipes, error } = await supabase
    .from('meet_swipe_history')
    .select('action, created_at')
    .gte('created_at', startDate)

  if (error) {
    console.error('Error fetching swipe activity:', error)
    return []
  }

  // Build activity by day
  const activityMap = new Map<string, { count: number; byAction: Record<string, number> }>()

  // Initialize all days with 0
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const dateStr = date.toISOString().split('T')[0]
    activityMap.set(dateStr, { count: 0, byAction: {} })
  }

  // Count swipes per day
  swipes?.forEach(s => {
    const dateStr = new Date(s.created_at).toISOString().split('T')[0]
    if (activityMap.has(dateStr)) {
      const dayData = activityMap.get(dateStr)!
      dayData.count++
      const action = s.action || 'unknown'
      dayData.byAction[action] = (dayData.byAction[action] || 0) + 1
    }
  })

  // Convert to array
  return Array.from(activityMap.entries()).map(([date, data]) => {
    const d = new Date(date)
    return {
      date,
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      count: data.count,
      byAction: data.byAction,
    }
  })
}

// ===== ARTICLES =====

export type ArticleStatus = 'draft' | 'published' | 'archived'

export interface Article {
  id: string
  slug: string
  title: string
  subtitle: string | null
  excerpt: string | null
  body: string
  category: string
  cover_image_path: string
  read_time_label: string | null
  published_at: string | null
  status: ArticleStatus
  is_featured: boolean
  tags: string[] | null
  seo_title: string | null
  seo_description: string | null
  external_url: string | null
  created_at: string
  updated_at: string | null
}

export interface ArticleStats {
  total: number
  published: number
  draft: number
  archived: number
  featured: number
  thisMonth: number
  categories: Record<string, number>
}

export async function getArticleStats(): Promise<ArticleStats> {
  if (!isSupabaseConfigured || !supabase) {
    return { total: 0, published: 0, draft: 0, archived: 0, featured: 0, thisMonth: 0, categories: {} }
  }

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  try {
    const [totalResult, publishedResult, draftResult, archivedResult, featuredResult, thisMonthResult, allResult] = await Promise.all([
      supabase.from('ambitious_daily_articles').select('*', { count: 'exact', head: true }),
      supabase.from('ambitious_daily_articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('ambitious_daily_articles').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('ambitious_daily_articles').select('*', { count: 'exact', head: true }).eq('status', 'archived'),
      supabase.from('ambitious_daily_articles').select('*', { count: 'exact', head: true }).eq('is_featured', true),
      supabase.from('ambitious_daily_articles').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
      supabase.from('ambitious_daily_articles').select('category'),
    ])

    // Calculate categories
    const categories: Record<string, number> = {}
    allResult.data?.forEach(a => {
      const cat = a.category || 'Uncategorized'
      categories[cat] = (categories[cat] || 0) + 1
    })

    return {
      total: totalResult.count || 0,
      published: publishedResult.count || 0,
      draft: draftResult.count || 0,
      archived: archivedResult.count || 0,
      featured: featuredResult.count || 0,
      thisMonth: thisMonthResult.count || 0,
      categories,
    }
  } catch (error) {
    console.error('Error fetching article stats:', error)
    return { total: 0, published: 0, draft: 0, archived: 0, featured: 0, thisMonth: 0, categories: {} }
  }
}

export type ArticleDateRange = 'all' | 'today' | '7d' | '30d' | 'thisMonth'
export type ArticleFeaturedFilter = 'all' | 'featured' | 'not_featured'

export interface ArticleListOptions {
  page?: number
  limit?: number
  status?: ArticleStatus | 'all'
  category?: string | 'all'
  featured?: ArticleFeaturedFilter
  dateRange?: ArticleDateRange
  search?: string
}

export interface ArticleListResult {
  articles: Article[]
  total: number
  page: number
  totalPages: number
}

export async function getArticles(options: ArticleListOptions = {}): Promise<ArticleListResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { articles: [], total: 0, page: 1, totalPages: 0 }
  }

  const {
    page = 1,
    limit = 20,
    status = 'all',
    category = 'all',
    featured = 'all',
    dateRange = 'all',
    search = '',
  } = options

  const offset = (page - 1) * limit

  try {
    // Build query
    let query = supabase
      .from('ambitious_daily_articles')
      .select('*', { count: 'exact' })

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Filter by category
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // Filter by featured
    if (featured === 'featured') {
      query = query.eq('is_featured', true)
    } else if (featured === 'not_featured') {
      query = query.eq('is_featured', false)
    }

    // Filter by date range
    if (dateRange && dateRange !== 'all') {
      switch (dateRange) {
        case 'today':
          query = query.gte('created_at', getStartOfToday())
          break
        case '7d':
          query = query.gte('created_at', getDaysAgo(7))
          break
        case '30d':
          query = query.gte('created_at', getDaysAgo(30))
          break
        case 'thisMonth':
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)
          query = query.gte('created_at', startOfMonth.toISOString())
          break
      }
    }

    // Search by title
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    // Order and paginate
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: articles, count, error } = await query

    if (error || !articles) {
      console.error('Error fetching articles:', error)
      return { articles: [], total: 0, page: 1, totalPages: 0 }
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return { articles: articles as Article[], total, page, totalPages }
  } catch (error) {
    console.error('Error fetching articles:', error)
    return { articles: [], total: 0, page: 1, totalPages: 0 }
  }
}

export async function getArticleById(articleId: string): Promise<Article | null> {
  if (!isSupabaseConfigured || !supabase) return null

  try {
    const { data: article, error } = await supabase
      .from('ambitious_daily_articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (error || !article) {
      console.error('Error fetching article:', error)
      return null
    }

    return article as Article
  } catch (error) {
    console.error('Error fetching article:', error)
    return null
  }
}

export async function toggleArticleFeatured(articleId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    // First get current state
    const { data: article, error: fetchError } = await supabase
      .from('ambitious_daily_articles')
      .select('is_featured')
      .eq('id', articleId)
      .single()

    if (fetchError || !article) {
      console.error('Error fetching article for toggle:', fetchError)
      return false
    }

    // Toggle the value
    const { error: updateError } = await supabase
      .from('ambitious_daily_articles')
      .update({ is_featured: !article.is_featured })
      .eq('id', articleId)

    if (updateError) {
      console.error('Error toggling article featured:', updateError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error toggling article featured:', error)
    return false
  }
}

export async function getArticleCategories(): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) return []

  try {
    const { data, error } = await supabase
      .from('ambitious_daily_articles')
      .select('category')

    if (error || !data) {
      console.error('Error fetching article categories:', error)
      return []
    }

    const categories = [...new Set(data.map(a => a.category).filter(Boolean))]
    return categories.sort()
  } catch (error) {
    console.error('Error fetching article categories:', error)
    return []
  }
}

export async function deleteArticle(articleId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    const { error } = await supabase
      .from('ambitious_daily_articles')
      .delete()
      .eq('id', articleId)

    if (error) {
      console.error('Error deleting article:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting article:', error)
    return false
  }
}

export async function updateArticleStatus(articleId: string, status: ArticleStatus): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    const updateData: { status: ArticleStatus; published_at?: string | null } = { status }

    // Set published_at when publishing
    if (status === 'published') {
      updateData.published_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('ambitious_daily_articles')
      .update(updateData)
      .eq('id', articleId)

    if (error) {
      console.error('Error updating article status:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating article status:', error)
    return false
  }
}

// ===== PREMIUM SPOTLIGHT =====

export interface Spotlight {
  id: string
  name: string
  logo_url: string
  tagline: string
  link: string
  display_order: number
  is_active: boolean
  cta_text: string
  created_at: string
  updated_at: string | null
}

export interface SpotlightStats {
  total: number
  active: number
  inactive: number
}

export interface SpotlightFormData {
  name: string
  logo_url: string
  tagline: string
  link: string
  cta_text: string
  display_order: number
  is_active: boolean
}

export async function getSpotlightStats(): Promise<SpotlightStats> {
  if (!isSupabaseConfigured || !supabase) {
    return { total: 0, active: 0, inactive: 0 }
  }

  try {
    const [totalResult, activeResult, inactiveResult] = await Promise.all([
      supabase.from('premium_spotlight').select('*', { count: 'exact', head: true }),
      supabase.from('premium_spotlight').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('premium_spotlight').select('*', { count: 'exact', head: true }).eq('is_active', false),
    ])

    return {
      total: totalResult.count || 0,
      active: activeResult.count || 0,
      inactive: inactiveResult.count || 0,
    }
  } catch (error) {
    console.error('Error fetching spotlight stats:', error)
    return { total: 0, active: 0, inactive: 0 }
  }
}

export async function getSpotlights(): Promise<Spotlight[]> {
  if (!isSupabaseConfigured || !supabase) return []

  try {
    const { data, error } = await supabase
      .from('premium_spotlight')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching spotlights:', error)
      return []
    }

    return data as Spotlight[]
  } catch (error) {
    console.error('Error fetching spotlights:', error)
    return []
  }
}

export async function getSpotlightById(spotlightId: string): Promise<Spotlight | null> {
  if (!isSupabaseConfigured || !supabase) return null

  try {
    const { data, error } = await supabase
      .from('premium_spotlight')
      .select('*')
      .eq('id', spotlightId)
      .single()

    if (error) {
      console.error('Error fetching spotlight:', error)
      return null
    }

    return data as Spotlight
  } catch (error) {
    console.error('Error fetching spotlight:', error)
    return null
  }
}

export async function createSpotlight(formData: SpotlightFormData): Promise<Spotlight | null> {
  if (!isSupabaseConfigured || !supabase) return null

  try {
    const { data, error } = await supabase
      .from('premium_spotlight')
      .insert([formData])
      .select()
      .single()

    if (error) {
      console.error('Error creating spotlight:', error)
      return null
    }

    return data as Spotlight
  } catch (error) {
    console.error('Error creating spotlight:', error)
    return null
  }
}

export async function updateSpotlight(spotlightId: string, formData: Partial<SpotlightFormData>): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    const { error } = await supabase
      .from('premium_spotlight')
      .update(formData)
      .eq('id', spotlightId)

    if (error) {
      console.error('Error updating spotlight:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating spotlight:', error)
    return false
  }
}

export async function deleteSpotlight(spotlightId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    const { error } = await supabase
      .from('premium_spotlight')
      .delete()
      .eq('id', spotlightId)

    if (error) {
      console.error('Error deleting spotlight:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting spotlight:', error)
    return false
  }
}

export async function toggleSpotlightActive(spotlightId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    // First get current state
    const { data: spotlight, error: fetchError } = await supabase
      .from('premium_spotlight')
      .select('is_active')
      .eq('id', spotlightId)
      .single()

    if (fetchError || !spotlight) {
      console.error('Error fetching spotlight for toggle:', fetchError)
      return false
    }

    // Toggle the value
    const { error: updateError } = await supabase
      .from('premium_spotlight')
      .update({ is_active: !spotlight.is_active })
      .eq('id', spotlightId)

    if (updateError) {
      console.error('Error toggling spotlight active:', updateError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error toggling spotlight active:', error)
    return false
  }
}

export async function updateSpotlightOrder(spotlightId: string, newOrder: number): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    const { error } = await supabase
      .from('premium_spotlight')
      .update({ display_order: newOrder })
      .eq('id', spotlightId)

    if (error) {
      console.error('Error updating spotlight order:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating spotlight order:', error)
    return false
  }
}

// ===== HELPERS =====

function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return date.toLocaleDateString()
}

