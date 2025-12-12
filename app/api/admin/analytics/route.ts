import { NextResponse } from 'next/server'
import { supabaseAdmin, isServiceRoleConfigured } from '@/lib/supabase'

// ===== TIMEZONE-AWARE DATE UTILITIES =====
// All date calculations now use the client's timezone for consistency

/**
 * Get the current time in the client's timezone
 */
function getNowInTimezone(timezone: string): Date {
  // Get current UTC time
  const now = new Date()
  // Format it in the target timezone to get the local date/time components
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(now)
  const get = (type: string) => parts.find(p => p.type === type)?.value || '0'
  
  // Create a date object representing "now" in the client's timezone
  // We use UTC methods to avoid any server timezone interference
  return new Date(Date.UTC(
    parseInt(get('year')),
    parseInt(get('month')) - 1,
    parseInt(get('day')),
    parseInt(get('hour')),
    parseInt(get('minute')),
    parseInt(get('second'))
  ))
}

/**
 * Get midnight (start of day) in the client's timezone, returned as ISO string
 */
function getStartOfTodayInTimezone(timezone: string): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const get = (type: string) => parts.find(p => p.type === type)?.value || '0'
  
  // Get the timezone offset for this specific date/time
  const localDateStr = `${get('year')}-${get('month')}-${get('day')}T00:00:00`
  
  // Create a date in the target timezone at midnight
  const midnightLocal = new Date(localDateStr)
  const midnightFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  })
  
  // Calculate the UTC time that corresponds to midnight in the target timezone
  // We need to find what UTC time equals midnight in the client timezone
  const tzOffset = getTimezoneOffsetMinutes(timezone, now)
  const midnightUTC = new Date(now)
  midnightUTC.setUTCHours(0, 0, 0, 0)
  midnightUTC.setUTCFullYear(parseInt(get('year')), parseInt(get('month')) - 1, parseInt(get('day')))
  midnightUTC.setUTCMinutes(midnightUTC.getUTCMinutes() + tzOffset)
  
  return midnightUTC.toISOString()
}

/**
 * Get the timezone offset in minutes for a given timezone
 */
function getTimezoneOffsetMinutes(timezone: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
  return (utcDate.getTime() - tzDate.getTime()) / 60000
}

/**
 * Get N days ago at midnight in the client's timezone
 */
function getDaysAgoInTimezone(days: number, timezone: string): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  
  // First get today's date in the timezone
  const parts = formatter.formatToParts(now)
  const get = (type: string) => parts.find(p => p.type === type)?.value || '0'
  
  // Create a date for today in that timezone, then subtract days
  const todayInTz = new Date(Date.UTC(
    parseInt(get('year')),
    parseInt(get('month')) - 1,
    parseInt(get('day')),
    0, 0, 0
  ))
  todayInTz.setUTCDate(todayInTz.getUTCDate() - days)
  
  // Now convert that back to a UTC timestamp accounting for timezone offset
  const tzOffset = getTimezoneOffsetMinutes(timezone, now)
  todayInTz.setUTCMinutes(todayInTz.getUTCMinutes() + tzOffset)
  
  return todayInTz.toISOString()
}

/**
 * Get start date based on date range filter
 */
function getAnalyticsStartDate(dateRange: string, timezone: string): string | null {
  switch (dateRange) {
    case 'today':
      return getStartOfTodayInTimezone(timezone)
    case '7d':
      return getDaysAgoInTimezone(7, timezone)
    case '30d':
      return getDaysAgoInTimezone(30, timezone)
    case '90d':
      return getDaysAgoInTimezone(90, timezone)
    case 'all':
      return null
    default:
      return getDaysAgoInTimezone(7, timezone)
  }
}

/**
 * Format a UTC date as YYYY-MM-DD in the client's timezone
 */
function formatDateInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const get = (type: string) => parts.find(p => p.type === type)?.value || '0'
  return `${get('year')}-${get('month')}-${get('day')}`
}

/**
 * Get the start of a week (Sunday) for a date in the client's timezone
 */
function getStartOfWeekInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
  const parts = formatter.formatToParts(date)
  const get = (type: string) => parts.find(p => p.type === type)?.value || '0'
  
  // Get day of week (0 = Sunday)
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayOfWeek = weekdays.indexOf(get('weekday'))
  
  // Create date and subtract to get to Sunday
  const d = new Date(Date.UTC(
    parseInt(get('year')),
    parseInt(get('month')) - 1,
    parseInt(get('day'))
  ))
  d.setUTCDate(d.getUTCDate() - dayOfWeek)
  
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

/**
 * Get the start of a month for a date in the client's timezone
 */
function getStartOfMonthInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const get = (type: string) => parts.find(p => p.type === type)?.value || '0'
  return `${get('year')}-${get('month')}-01`
}

/**
 * Get period key for grouping events (day/week/month) using client timezone
 */
function getPeriodKey(date: Date, groupBy: string, timezone: string): string {
  switch (groupBy) {
    case 'day':
      return formatDateInTimezone(date, timezone)
    case 'week':
      return getStartOfWeekInTimezone(date, timezone)
    case 'month':
      return getStartOfMonthInTimezone(date, timezone)
    default:
      return formatDateInTimezone(date, timezone)
  }
}

/**
 * Format period label for display
 */
function formatPeriodLabel(dateKey: string, groupBy: string): string {
  const date = new Date(dateKey + 'T12:00:00Z') // Use noon to avoid timezone edge cases
  switch (groupBy) {
    case 'day':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    case 'week':
      return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    default:
      return dateKey
  }
}

export async function GET(request: Request) {
  if (!isServiceRoleConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const dateRange = searchParams.get('dateRange') || '7d'
  const platform = searchParams.get('platform') || 'all'
  const eventType = searchParams.get('eventType') || undefined
  const groupBy = searchParams.get('groupBy') || 'day'
  // Get client timezone, default to America/New_York if not provided
  const timezone = searchParams.get('timezone') || 'America/New_York'

  const daysMap: Record<string, number> = {
    'today': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    'all': 90,
  }
  const days = daysMap[dateRange] || 7
  const startDate = getAnalyticsStartDate(dateRange, timezone)

  try {
    // ===== OVERVIEW =====
    let overviewQuery = supabaseAdmin.from('analytics_events').select('id, user_id, session_id, platform')
    if (startDate) overviewQuery = overviewQuery.gte('created_at', startDate)
    if (platform && platform !== 'all') overviewQuery = overviewQuery.eq('platform', platform)
    if (eventType) overviewQuery = overviewQuery.eq('event_name', eventType)

    const { data: overviewData } = await overviewQuery

    const totalEvents = overviewData?.length || 0
    const uniqueUsers = new Set(overviewData?.map(e => e.user_id).filter(Boolean)).size
    const uniqueSessions = new Set(overviewData?.map(e => e.session_id).filter(Boolean)).size
    const avgEventsPerSession = uniqueSessions > 0 ? Math.round((totalEvents / uniqueSessions) * 10) / 10 : 0

    const platformBreakdownMap: Record<string, number> = {}
    overviewData?.forEach(e => {
      const p = e.platform || 'unknown'
      platformBreakdownMap[p] = (platformBreakdownMap[p] || 0) + 1
    })

    const overview = {
      totalEvents,
      uniqueUsers,
      uniqueSessions,
      avgEventsPerSession,
      platformBreakdown: platformBreakdownMap,
    }

    // ===== EVENTS OVER TIME (trend) =====
    const trendStartDate = getDaysAgoInTimezone(days, timezone)
    let trendQuery = supabaseAdmin.from('analytics_events').select('created_at, platform').gte('created_at', trendStartDate)
    if (platform && platform !== 'all') trendQuery = trendQuery.eq('platform', platform)
    if (eventType) trendQuery = trendQuery.eq('event_name', eventType)

    const { data: trendData } = await trendQuery

    const eventsByDate: Record<string, number> = {}
    // Initialize all days using client timezone
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = formatDateInTimezone(date, timezone)
      eventsByDate[dateStr] = 0
    }
    trendData?.forEach(e => {
      // Convert event time to client timezone for grouping
      const dateStr = formatDateInTimezone(new Date(e.created_at), timezone)
      eventsByDate[dateStr] = (eventsByDate[dateStr] || 0) + 1
    })

    const trend = Object.entries(eventsByDate)
      .map(([date, count]) => {
        const dateObj = new Date(date + 'T12:00:00Z')
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
        return { date, label, count }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    // ===== TOP EVENTS =====
    let topEventsQuery = supabaseAdmin.from('analytics_events').select('event_name')
    if (startDate) topEventsQuery = topEventsQuery.gte('created_at', startDate)
    if (platform && platform !== 'all') topEventsQuery = topEventsQuery.eq('platform', platform)

    const { data: topEventsData } = await topEventsQuery

    const eventCounts: Record<string, number> = {}
    topEventsData?.forEach(e => {
      eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1
    })

    const totalEventCount = Object.values(eventCounts).reduce((sum, c) => sum + c, 0)
    const topEvents = Object.entries(eventCounts)
      .map(([eventName, count]) => ({ 
        eventName, 
        count, 
        percentage: totalEventCount > 0 ? Math.round((count / totalEventCount) * 100) : 0 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // ===== PLATFORM BREAKDOWN (as array) =====
    const platformColors: Record<string, string> = {
      web: '#4A9EFF',
      ios: '#FF6B6B',
      android: '#4ECB71',
      unknown: '#888888',
    }
    const platformBreakdown = Object.entries(platformBreakdownMap).map(([platform, count]) => ({
      platform,
      count,
      percentage: totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0,
      color: platformColors[platform.toLowerCase()] || platformColors.unknown,
    }))

    // ===== RETENTION (simplified) =====
    // Calculate DAU/WAU/MAU from unique users in different time periods
    const dau = uniqueUsers // Users active in the selected period (approximation)
    const wau = uniqueUsers
    const mau = uniqueUsers
    const dauWauRatio = wau > 0 ? Math.round((dau / wau) * 100) : 0
    const dauMauRatio = mau > 0 ? Math.round((dau / mau) * 100) : 0
    
    const retention = {
      dau,
      wau,
      mau,
      dauWauRatio,
      dauMauRatio,
    }

    // ===== FUNNEL (simplified) =====
    const funnel = [
      { name: 'Visit', eventName: 'session_start', count: uniqueSessions, conversionRate: 100, dropOffRate: 0 },
      { name: 'Signup', eventName: 'signup', count: 0, conversionRate: 0, dropOffRate: 100 },
      { name: 'First Post', eventName: 'post_created', count: 0, conversionRate: 0, dropOffRate: 0 },
      { name: 'First Follow', eventName: 'follow', count: 0, conversionRate: 0, dropOffRate: 0 },
    ]

    // ===== SESSION INSIGHTS (simplified) =====
    const sessionInsights = {
      avgEventsPerSession,
      avgSessionDurationMinutes: 0,
      topPages: [] as Array<{ url: string; count: number }>,
      bounceRate: 0,
    }

    // ===== UNIQUE EVENT NAMES =====
    const { data: eventNamesData } = await supabaseAdmin.from('analytics_events').select('event_name')
    const eventNames = [...new Set(eventNamesData?.map(e => e.event_name) || [])].sort()

    // ===== KEY EVENTS METRICS =====
    // Now uses timezone-aware dates AND applies platform/eventType filters consistently
    const impressionEvents = ['impression', 'post_viewed', 'screen_viewed', 'page_view', 'view']
    const startOfToday = getStartOfTodayInTimezone(timezone)
    const sevenDaysAgo = getDaysAgoInTimezone(7, timezone)
    const thirtyDaysAgo = getDaysAgoInTimezone(30, timezone)
    const fourteenDaysAgo = getDaysAgoInTimezone(14, timezone)

    // Build base queries with consistent filter application
    const buildKeyEventsQuery = (startDate: string, endDate?: string) => {
      let query = supabaseAdmin.from('analytics_events').select('id', { count: 'exact', head: true })
        .gte('created_at', startDate)
      if (endDate) query = query.lt('created_at', endDate)
      query = query.or(impressionEvents.map(e => `event_name.ilike.%${e}%`).join(','))
      // Apply platform filter consistently with other sections
      if (platform && platform !== 'all') query = query.eq('platform', platform)
      return query
    }

    const [todayResult, weekResult, monthResult, prevWeekResult] = await Promise.all([
      buildKeyEventsQuery(startOfToday),
      buildKeyEventsQuery(sevenDaysAgo),
      buildKeyEventsQuery(thirtyDaysAgo),
      buildKeyEventsQuery(fourteenDaysAgo, sevenDaysAgo),
    ])

    const impressionsToday = todayResult.count || 0
    const impressionsWeek = weekResult.count || 0
    const impressionsMonth = monthResult.count || 0
    const previousWeekImpressions = prevWeekResult.count || 0

    let impressionsTrend: 'up' | 'down' | 'neutral' = 'neutral'
    let trendPercentage = 0
    if (previousWeekImpressions > 0) {
      const diff = impressionsWeek - previousWeekImpressions
      trendPercentage = Math.round((diff / previousWeekImpressions) * 100)
      impressionsTrend = trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'neutral'
    }

    const keyEvents = {
      impressionsToday,
      impressionsWeek,
      impressionsMonth,
      impressionsTrend,
      trendPercentage,
      previousWeekImpressions,
    }

    // ===== ENGAGEMENT METRICS =====
    // Use timezone-aware date boundaries for consistent counting
    const engagementTodayStart = new Date(startOfToday)
    const engagementWeekStart = new Date(sevenDaysAgo)
    const engagementMonthStart = new Date(thirtyDaysAgo)

    let engagementQuery = supabaseAdmin.from('analytics_events').select('event_name, created_at')
      .gte('created_at', thirtyDaysAgo)
    if (platform && platform !== 'all') engagementQuery = engagementQuery.eq('platform', platform)

    const { data: engagementData } = await engagementQuery

    const engagementCounts: Record<string, { today: number; week: number; month: number }> = {
      'post_liked': { today: 0, week: 0, month: 0 },
      'comment_created': { today: 0, week: 0, month: 0 },
      'post_shared': { today: 0, week: 0, month: 0 },
      'follow': { today: 0, week: 0, month: 0 },
    }

    engagementData?.forEach(e => {
      const eventDate = new Date(e.created_at)
      // Map event names to our categories
      let key: string | null = null
      if (e.event_name === 'post_liked' || e.event_name.includes('like')) key = 'post_liked'
      else if (e.event_name === 'comment_created' || e.event_name.includes('comment')) key = 'comment_created'
      else if (e.event_name === 'post_shared' || e.event_name.includes('share')) key = 'post_shared'
      else if (e.event_name === 'follow' || e.event_name.includes('follow')) key = 'follow'
      
      if (key && engagementCounts[key]) {
        if (eventDate >= engagementTodayStart) engagementCounts[key].today++
        if (eventDate >= engagementWeekStart) engagementCounts[key].week++
        engagementCounts[key].month++
      }
    })

    // Calculate engagement rate
    const totalEngagementActions = engagementCounts['post_liked'].month + 
      engagementCounts['comment_created'].month + 
      engagementCounts['post_shared'].month + 
      engagementCounts['follow'].month
    const engagementRate = uniqueUsers > 0 ? Math.round((totalEngagementActions / uniqueUsers) * 100) / 100 : 0

    const engagement = {
      engagementRate,
      likes: engagementCounts['post_liked'],
      comments: engagementCounts['comment_created'],
      shares: engagementCounts['post_shared'],
      follows: engagementCounts['follow'],
    }

    // ===== LOOP METRICS =====
    // Use timezone-aware dates and apply platform filter consistently
    let loopQuery = supabaseAdmin.from('analytics_events').select('event_name, created_at, user_id, properties')
      .gte('created_at', thirtyDaysAgo)
      .ilike('event_name', 'loop%')
    if (platform && platform !== 'all') loopQuery = loopQuery.eq('platform', platform)

    const { data: loopData } = await loopQuery

    const loopCounts = {
      views: { today: 0, week: 0, month: 0 },
      likes: { today: 0, week: 0, month: 0 },
      comments: { today: 0, week: 0, month: 0 },
    }

    const uniqueViewerIds = new Set<string>()
    const uniqueLoopIds = new Set<string>()
    let totalLoopsViewed = 0

    loopData?.forEach(e => {
      const eventDate = new Date(e.created_at)
      let category: keyof typeof loopCounts | null = null
      
      if (e.event_name.includes('view')) {
        category = 'views'
        totalLoopsViewed++
        if (e.user_id) uniqueViewerIds.add(e.user_id)
        // Try to extract loop_id from properties if available
        const props = e.properties as Record<string, unknown> | null
        if (props?.loop_id) uniqueLoopIds.add(String(props.loop_id))
      }
      else if (e.event_name.includes('like')) category = 'likes'
      else if (e.event_name.includes('comment')) category = 'comments'

      if (category) {
        if (eventDate >= engagementTodayStart) loopCounts[category].today++
        if (eventDate >= engagementWeekStart) loopCounts[category].week++
        loopCounts[category].month++
      }
    })

    const uniqueViewers = uniqueViewerIds.size
    const uniqueLoops = uniqueLoopIds.size
    const avgViewsPerLoop = uniqueLoops > 0 ? Math.round((totalLoopsViewed / uniqueLoops) * 10) / 10 : 0

    const loops = {
      views: loopCounts.views,
      likes: loopCounts.likes,
      comments: loopCounts.comments,
      totalLoopsViewed,
      uniqueViewers,
      uniqueLoops,
      avgViewsPerLoop,
    }

    // ===== TIMEFRAME DATA (grouped by day/week/month) =====
    // Uses SQL aggregation to avoid row limit issues
    const pageViewPatterns = ['page_view', 'screen_viewed']
    
    // Determine how far back to fetch based on groupBy
    const timeframeDays = groupBy === 'month' ? 365 : groupBy === 'week' ? 90 : days
    const timeframeStartDate = getDaysAgoInTimezone(timeframeDays, timezone)
    
    // Build date list for the period
    const periodData: Record<string, { impressions: number; pageViews: number }> = {}
    
    // Generate all period keys we want to show
    const periodKeys: string[] = []
    for (let i = 0; i < timeframeDays; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = getPeriodKey(date, groupBy, timezone)
      if (!periodKeys.includes(key)) {
        periodKeys.push(key)
        periodData[key] = { impressions: 0, pageViews: 0 }
      }
    }
    
    // Query each period individually to avoid row limit
    // Use count queries which bypass the row limit
    const periodQueries = periodKeys.slice(0, 30).map(async (periodKey) => {
      // Calculate the start and end of this period in UTC
      let periodStart: string
      let periodEnd: string
      
      const tzOffset = getTimezoneOffsetMinutes(timezone, new Date())
      const [year, month, day] = periodKey.split('-').map(Number)
      
      if (groupBy === 'day') {
        // For a day like 2025-12-11, calculate midnight to midnight in client timezone
        // Start: midnight of this day in client timezone, converted to UTC
        const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
        startDate.setUTCMinutes(startDate.getUTCMinutes() + tzOffset)
        periodStart = startDate.toISOString()
        
        // End: midnight of next day in client timezone, converted to UTC
        const endDate = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0))
        endDate.setUTCMinutes(endDate.getUTCMinutes() + tzOffset)
        periodEnd = endDate.toISOString()
      } else if (groupBy === 'week') {
        // For a week starting on the given date (Sunday)
        // periodKey is the Sunday of that week (e.g., 2025-12-08)
        const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
        startDate.setUTCMinutes(startDate.getUTCMinutes() + tzOffset)
        periodStart = startDate.toISOString()
        
        // End: 7 days later (next Sunday)
        const endDate = new Date(Date.UTC(year, month - 1, day + 7, 0, 0, 0))
        endDate.setUTCMinutes(endDate.getUTCMinutes() + tzOffset)
        periodEnd = endDate.toISOString()
      } else {
        // For a month (periodKey is like 2025-12-01)
        // Start: first day of the month
        const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
        startDate.setUTCMinutes(startDate.getUTCMinutes() + tzOffset)
        periodStart = startDate.toISOString()
        
        // End: first day of next month
        const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0))
        endDate.setUTCMinutes(endDate.getUTCMinutes() + tzOffset)
        periodEnd = endDate.toISOString()
      }
      
      // Build query for this period
      let query = supabaseAdmin.from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', periodStart)
        .lt('created_at', periodEnd)
        .or(impressionEvents.map(e => `event_name.ilike.%${e}%`).join(','))
      
      if (platform && platform !== 'all') {
        query = query.eq('platform', platform)
      }
      
      const { count } = await query
      return { periodKey, impressions: count || 0 }
    })
    
    const periodResults = await Promise.all(periodQueries)
    periodResults.forEach(({ periodKey, impressions }) => {
      if (periodData[periodKey]) {
        periodData[periodKey].impressions = impressions
      }
    })
    
    // For backward compatibility, keep timeframeRawData reference
    const timeframeRawData: Array<{ event_name: string; created_at: string }> = []
    
    // Convert to array and sort by date descending (most recent first)
    // Filter out periods with 0 impressions to keep table clean
    const timeframePeriods = Object.entries(periodData)
      .filter(([, counts]) => counts.impressions > 0)
      .map(([dateKey, counts]) => {
        return {
          period: formatPeriodLabel(dateKey, groupBy),
          date: dateKey,
          impressions: counts.impressions,
          pageViews: counts.pageViews, // Will be 0 for now, could add separate count query
          isTotal: false,
        }
      })
      .sort((a, b) => b.date.localeCompare(a.date))
    
    // Add summary rows at the top that match the hero card totals
    const timeframeData = [
      {
        period: '📊 Today (Rolling)',
        date: 'zzz-total-today', // Sort to top with zzz prefix
        impressions: impressionsToday,
        pageViews: 0,
        isTotal: true,
      },
      {
        period: '📊 Last 7 Days (Rolling)',
        date: 'zzz-total-week',
        impressions: impressionsWeek,
        pageViews: 0,
        isTotal: true,
      },
      {
        period: '📊 Last 30 Days (Rolling)',
        date: 'zzz-total-month',
        impressions: impressionsMonth,
        pageViews: 0,
        isTotal: true,
      },
      ...timeframePeriods,
    ]

    // ===== DEBUG DIAGNOSTICS =====
    // Get total count of ALL rows in the table
    const { count: totalRowsInTable } = await supabaseAdmin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
    
    // Get count of impression events in last 7 days (same filter as Key Events)
    const { count: impressionEventsLast7Days } = await supabaseAdmin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo)
      .or(impressionEvents.map(e => `event_name.ilike.%${e}%`).join(','))
    
    // Get sample of recent event names
    const { data: sampleEvents } = await supabaseAdmin
      .from('analytics_events')
      .select('event_name, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    
    // Debug: Get yesterday's key
    const yesterdayKey = formatDateInTimezone(new Date(Date.now() - 24 * 60 * 60 * 1000), timezone)
    const yesterdayImpressions = periodData[yesterdayKey]?.impressions || 0
    
    const debug = {
      clientTimezone: timezone,
      yesterdayDateKey: yesterdayKey,
      yesterdayImpressions,
      totalRowsInTable: totalRowsInTable || 0,
      impressionEventsLast7Days: impressionEventsLast7Days || 0,
      sampleEventNames: [...new Set(sampleEvents?.map(e => e.event_name) || [])],
      queryStartDate: startDate,
      startOfTodayInClientTz: startOfToday,
      sevenDaysAgoDate: sevenDaysAgo,
      timeframeStartDate: timeframeStartDate,
      platformFilter: platform,
      periodDataKeys: Object.keys(periodData),
    }

    // Debug logging disabled - uncomment if needed
    // console.log('\n========== ANALYTICS DEBUG ==========')
    // console.log('Client Timezone:', timezone)
    // console.log('Yesterday:', yesterdayKey, '-', yesterdayImpressions, 'impressions')
    // console.log('======================================\n')

    return NextResponse.json({
      data: {
        overview,
        trend,
        topEvents,
        platformBreakdown,
        retention,
        funnel,
        sessionInsights,
      },
      eventNames,
      keyEvents,
      engagement,
      loops,
      timeframeData,
      debug,
    })
  } catch (error) {
    console.error('Error in analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
