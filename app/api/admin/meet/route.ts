import { NextResponse } from 'next/server'
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

export async function GET(request: Request) {
  if (!isServiceRoleConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const status = searchParams.get('status') || undefined
  const dateRange = searchParams.get('dateRange') || 'all'

  try {
    const sevenDaysAgo = getDaysAgo(7)

    // Get stats
    const [totalResult, pendingResult, acceptedResult, rejectedResult, swipesResult] = await Promise.all([
      supabaseAdmin.from('meet_requests').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('meet_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('meet_requests').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
      supabaseAdmin.from('meet_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabaseAdmin.from('meet_swipe_history').select('action').gte('created_at', sevenDaysAgo),
    ])

    const totalRequests = totalResult.count || 0
    const pending = pendingResult.count || 0
    const accepted = acceptedResult.count || 0
    const rejected = rejectedResult.count || 0

    // Count swipes by action
    const swipesByAction: Record<string, number> = {}
    swipesResult.data?.forEach((s: { action: string }) => {
      swipesByAction[s.action] = (swipesByAction[s.action] || 0) + 1
    })
    const totalSwipes7d = swipesResult.data?.length || 0

    // Calculate match rate (accepted / total requests that have been responded to)
    const respondedRequests = accepted + rejected
    const matchRate = respondedRequests > 0 ? Math.round((accepted / respondedRequests) * 100) : 0

    const stats = {
      totalRequests,
      pending,
      accepted,
      rejected,
      totalSwipes7d,
      matchRate,
      swipesByAction,
    }

    // Get swipe activity trend (last 7 days)
    const { data: swipeData } = await supabaseAdmin
      .from('meet_swipe_history')
      .select('action, created_at')
      .gte('created_at', sevenDaysAgo)

    const swipeTrend: Array<{ date: string; label: string; count: number; byAction: Record<string, number> }> = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

      const daySwipes = (swipeData || []).filter((s: { created_at: string }) => {
        const swipeDate = new Date(s.created_at).toISOString().split('T')[0]
        return swipeDate === dateStr
      })

      const byAction: Record<string, number> = {}
      daySwipes.forEach((s: { action: string }) => {
        byAction[s.action] = (byAction[s.action] || 0) + 1
      })

      swipeTrend.push({ date: dateStr, label, count: daySwipes.length, byAction })
    }

    // Build query for meet requests list
    let query = supabaseAdmin
      .from('meet_requests')
      .select(`
        id,
        requester_id,
        recipient_id,
        status,
        created_at,
        responded_at,
        requester:profiles!meet_requests_requester_id_fkey(username, avatar_url, full_name),
        recipient:profiles!meet_requests_recipient_id_fkey(username, avatar_url, full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (dateRange !== 'all') {
      let startDate: string
      switch (dateRange) {
        case 'today':
          startDate = getStartOfToday()
          break
        case '7d':
          startDate = getDaysAgo(7)
          break
        case '30d':
          startDate = getDaysAgo(30)
          break
        default:
          startDate = getDaysAgo(7)
      }
      query = query.gte('created_at', startDate)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching meet requests:', error)
      return NextResponse.json({ error: 'Failed to fetch meet requests' }, { status: 500 })
    }

    // Transform data to match expected structure
    const requests = (data || []).map((r: Record<string, unknown>) => {
      const requester = r.requester as { username?: string; avatar_url?: string; full_name?: string } | null
      const recipient = r.recipient as { username?: string; avatar_url?: string; full_name?: string } | null
      return {
        id: r.id,
        requester_id: r.requester_id,
        recipient_id: r.recipient_id,
        status: r.status,
        created_at: r.created_at,
        responded_at: r.responded_at,
        requester_username: requester?.username || 'unknown',
        requester_avatar_url: requester?.avatar_url || null,
        requester_full_name: requester?.full_name || null,
        recipient_username: recipient?.username || 'unknown',
        recipient_avatar_url: recipient?.avatar_url || null,
        recipient_full_name: recipient?.full_name || null,
      }
    })

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      stats,
      swipeTrend,
      requests,
      total,
      totalPages,
      page,
    })
  } catch (error) {
    console.error('Error in meet API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

