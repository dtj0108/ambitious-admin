import { NextResponse } from 'next/server'
import { supabaseAdmin, isServiceRoleConfigured } from '@/lib/supabase'

// Helper to get start date based on date range
function getAnalyticsStartDate(dateRange: string): string | null {
  const now = new Date()
  switch (dateRange) {
    case 'today':
      now.setHours(0, 0, 0, 0)
      return now.toISOString()
    case '7d':
      now.setDate(now.getDate() - 7)
      return now.toISOString()
    case '30d':
      now.setDate(now.getDate() - 30)
      return now.toISOString()
    case '90d':
      now.setDate(now.getDate() - 90)
      return now.toISOString()
    case 'all':
      return null
    default:
      now.setDate(now.getDate() - 7)
      return now.toISOString()
  }
}

function getDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

function getStartOfToday(): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString()
}

export async function GET(request: Request) {
  if (!isServiceRoleConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const dateRange = searchParams.get('dateRange') || '7d'
  const platform = searchParams.get('platform') || 'all'
  const eventType = searchParams.get('eventType') || undefined

  const daysMap: Record<string, number> = {
    'today': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    'all': 90,
  }
  const days = daysMap[dateRange] || 7
  const startDate = getAnalyticsStartDate(dateRange)

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
    const trendStartDate = getDaysAgo(days)
    let trendQuery = supabaseAdmin.from('analytics_events').select('created_at, platform').gte('created_at', trendStartDate)
    if (platform && platform !== 'all') trendQuery = trendQuery.eq('platform', platform)
    if (eventType) trendQuery = trendQuery.eq('event_name', eventType)

    const { data: trendData } = await trendQuery

    const eventsByDate: Record<string, number> = {}
    // Initialize all days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      eventsByDate[dateStr] = 0
    }
    trendData?.forEach(e => {
      const date = new Date(e.created_at).toISOString().split('T')[0]
      eventsByDate[date] = (eventsByDate[date] || 0) + 1
    })

    const trend = Object.entries(eventsByDate)
      .map(([date, count]) => {
        const dateObj = new Date(date + 'T00:00:00')
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
    const impressionEvents = ['impression', 'post_viewed', 'screen_viewed', 'page_view', 'view']
    const startOfToday = getStartOfToday()
    const sevenDaysAgo = getDaysAgo(7)
    const thirtyDaysAgo = getDaysAgo(30)
    const fourteenDaysAgo = getDaysAgo(14)

    const [todayResult, weekResult, monthResult, prevWeekResult] = await Promise.all([
      supabaseAdmin.from('analytics_events').select('id', { count: 'exact', head: true })
        .gte('created_at', startOfToday)
        .or(impressionEvents.map(e => `event_name.ilike.%${e}%`).join(',')),
      supabaseAdmin.from('analytics_events').select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo)
        .or(impressionEvents.map(e => `event_name.ilike.%${e}%`).join(',')),
      supabaseAdmin.from('analytics_events').select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo)
        .or(impressionEvents.map(e => `event_name.ilike.%${e}%`).join(',')),
      supabaseAdmin.from('analytics_events').select('id', { count: 'exact', head: true })
        .gte('created_at', fourteenDaysAgo)
        .lt('created_at', sevenDaysAgo)
        .or(impressionEvents.map(e => `event_name.ilike.%${e}%`).join(',')),
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
    const now = new Date()
    const todayStartDate = new Date(now); todayStartDate.setHours(0, 0, 0, 0)
    const weekStartDate = new Date(now); weekStartDate.setDate(weekStartDate.getDate() - 7)
    const monthStartDate = new Date(now); monthStartDate.setDate(monthStartDate.getDate() - 30)

    let engagementQuery = supabaseAdmin.from('analytics_events').select('event_name, created_at')
      .gte('created_at', monthStartDate.toISOString())
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
        if (eventDate >= todayStartDate) engagementCounts[key].today++
        if (eventDate >= weekStartDate) engagementCounts[key].week++
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
    let loopQuery = supabaseAdmin.from('analytics_events').select('event_name, created_at, user_id, properties')
      .gte('created_at', monthStartDate.toISOString())
      .ilike('event_name', 'loop%')

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
        if (eventDate >= todayStartDate) loopCounts[category].today++
        if (eventDate >= weekStartDate) loopCounts[category].week++
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
    })
  } catch (error) {
    console.error('Error in analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
