import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isServiceRoleConfigured } from '@/lib/supabase'

function getStartOfToday(): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString()
}

function getDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

export async function GET(request: NextRequest) {
  if (!isServiceRoleConfigured || !supabaseAdmin) {
    return NextResponse.json(
      { error: 'Service role not configured' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform') || 'all'

  try {
    const startOfToday = getStartOfToday()
    const sevenDaysAgo = getDaysAgo(7)
    const thirtyDaysAgo = getDaysAgo(30)
    const fourteenDaysAgo = getDaysAgo(14)

    // Impression event names to look for
    const impressionEvents = ['impression', 'post_viewed', 'screen_viewed', 'page_view', 'view']
    const orFilter = impressionEvents.map(e => `event_name.ilike.%${e}%`).join(',')

    // Build queries
    const buildQuery = (startDate: string, endDate?: string) => {
      let query = supabaseAdmin
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .or(orFilter)

      if (endDate) {
        query = query.lt('created_at', endDate)
      }

      if (platform && platform !== 'all') {
        query = query.eq('platform', platform)
      }
      return query
    }

    const [todayResult, weekResult, monthResult, prevWeekResult] = await Promise.all([
      buildQuery(startOfToday),
      buildQuery(sevenDaysAgo),
      buildQuery(thirtyDaysAgo),
      // Previous week (7-14 days ago) for trend comparison
      buildQuery(fourteenDaysAgo, sevenDaysAgo),
    ])

    const impressionsToday = todayResult.count || 0
    const impressionsWeek = weekResult.count || 0
    const impressionsMonth = monthResult.count || 0
    const previousWeekImpressions = prevWeekResult.count || 0

    // Calculate trend
    let impressionsTrend: 'up' | 'down' | 'neutral' = 'neutral'
    let trendPercentage = 0

    if (previousWeekImpressions > 0) {
      const diff = impressionsWeek - previousWeekImpressions
      trendPercentage = Math.round((diff / previousWeekImpressions) * 100)
      if (trendPercentage > 0) {
        impressionsTrend = 'up'
      } else if (trendPercentage < 0) {
        impressionsTrend = 'down'
        trendPercentage = Math.abs(trendPercentage)
      }
    } else if (impressionsWeek > 0) {
      impressionsTrend = 'up'
      trendPercentage = 100
    }

    return NextResponse.json({
      metrics: {
        impressionsToday,
        impressionsWeek,
        impressionsMonth,
        impressionsTrend,
        trendPercentage,
        previousWeekImpressions,
      }
    })
  } catch (error) {
    console.error('Ad Inventory API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

