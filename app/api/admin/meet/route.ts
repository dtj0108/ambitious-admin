import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isServiceRoleConfigured } from '@/lib/supabase'

function getDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

function getStartOfToday(): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString()
}

type MeetRequestStatus = 'pending' | 'accepted' | 'rejected'
type MeetDateRange = 'all' | 'today' | '7d' | '30d'

export async function GET(request: NextRequest) {
  if (!isServiceRoleConfigured || !supabaseAdmin) {
    return NextResponse.json(
      { error: 'Service role not configured' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'stats'

  try {
    if (action === 'stats') {
      const sevenDaysAgo = getDaysAgo(7)

      const [
        totalResult,
        pendingResult,
        acceptedResult,
        rejectedResult,
        swipesResult,
      ] = await Promise.all([
        supabaseAdmin.from('meet_requests').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('meet_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabaseAdmin.from('meet_requests').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
        supabaseAdmin.from('meet_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabaseAdmin.from('meet_swipe_history').select('action').gte('created_at', sevenDaysAgo),
      ])

      // Calculate swipe stats
      const swipesByAction: Record<string, number> = {}
      swipesResult.data?.forEach(s => {
        const action = s.action || 'pass'
        swipesByAction[action] = (swipesByAction[action] || 0) + 1
      })

      const totalSwipes = swipesResult.data?.length || 0
      const likes = swipesByAction['like'] || 0
      const matchRate = totalSwipes > 0 ? Math.round((likes / totalSwipes) * 100) : 0

      return NextResponse.json({
        stats: {
          totalRequests: totalResult.count || 0,
          pending: pendingResult.count || 0,
          accepted: acceptedResult.count || 0,
          rejected: rejectedResult.count || 0,
          totalSwipes7d: totalSwipes,
          swipesByAction,
          matchRate,
        }
      })
    }

    if (action === 'list') {
      const page = parseInt(searchParams.get('page') || '1', 10)
      const limit = parseInt(searchParams.get('limit') || '20', 10)
      const status = searchParams.get('status') as MeetRequestStatus | null
      const dateRange = (searchParams.get('dateRange') || 'all') as MeetDateRange

      const offset = (page - 1) * limit

      // Build query
      let query = supabaseAdmin
        .from('meet_requests')
        .select(`
          *,
          requester:profiles!meet_requests_requester_id_fkey(username, full_name, avatar_url),
          recipient:profiles!meet_requests_recipient_id_fkey(username, full_name, avatar_url)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply filters
      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      if (dateRange === 'today') {
        query = query.gte('created_at', getStartOfToday())
      } else if (dateRange === '7d') {
        query = query.gte('created_at', getDaysAgo(7))
      } else if (dateRange === '30d') {
        query = query.gte('created_at', getDaysAgo(30))
      }

      const { data, error, count } = await query

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Transform data
      const requests = data?.map(r => ({
        id: r.id,
        requester_id: r.requester_id,
        recipient_id: r.recipient_id,
        status: r.status,
        created_at: r.created_at,
        responded_at: r.responded_at,
        requester_username: r.requester?.username || 'unknown',
        requester_full_name: r.requester?.full_name,
        requester_avatar_url: r.requester?.avatar_url,
        recipient_username: r.recipient?.username || 'unknown',
        recipient_full_name: r.recipient?.full_name,
        recipient_avatar_url: r.recipient?.avatar_url,
      })) || []

      return NextResponse.json({
        requests,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      })
    }

    if (action === 'byId') {
      const id = searchParams.get('id')
      if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 })
      }

      const { data, error } = await supabaseAdmin
        .from('meet_requests')
        .select(`
          *,
          requester:profiles!meet_requests_requester_id_fkey(username, full_name, avatar_url),
          recipient:profiles!meet_requests_recipient_id_fkey(username, full_name, avatar_url)
        `)
        .eq('id', id)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const request = {
        ...data,
        requester_username: data.requester?.username || 'unknown',
        requester_full_name: data.requester?.full_name,
        requester_avatar_url: data.requester?.avatar_url,
        recipient_username: data.recipient?.username || 'unknown',
        recipient_full_name: data.recipient?.full_name,
        recipient_avatar_url: data.recipient?.avatar_url,
      }

      return NextResponse.json({ request })
    }

    if (action === 'swipeTrend') {
      const days = parseInt(searchParams.get('days') || '7', 10)
      const now = new Date()

      const { data: swipes, error } = await supabaseAdmin
        .from('meet_swipe_history')
        .select('action, created_at')
        .gte('created_at', getDaysAgo(days))

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Build activity by day
      const activityMap = new Map<string, { count: number; byAction: Record<string, number> }>()

      // Initialize all days
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
          const day = activityMap.get(dateStr)!
          day.count++
          day.byAction[s.action] = (day.byAction[s.action] || 0) + 1
        }
      })

      // Convert to array
      const trend = Array.from(activityMap.entries()).map(([date, data]) => {
        const d = new Date(date)
        return {
          date,
          label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          count: data.count,
          byAction: data.byAction,
        }
      })

      return NextResponse.json({ trend })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Meet API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

