import { NextResponse } from 'next/server'
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

export async function GET(request: Request) {
  if (!isServiceRoleConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const type = searchParams.get('type') || undefined
  const readStatus = searchParams.get('readStatus') || 'all'
  const dateRange = searchParams.get('dateRange') || 'all'

  try {
    const startOfToday = getStartOfToday()

    // Get stats
    const [totalResult, unreadResult, todayResult, dismissedResult, allResult] = await Promise.all([
      supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }).is('read_at', null),
      supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday),
      supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }).not('dismissed_at', 'is', null),
      supabaseAdmin.from('notifications').select('type'),
    ])

    // Calculate by type
    const byType: Record<string, number> = {}
    allResult.data?.forEach((n: { type: string }) => {
      byType[n.type] = (byType[n.type] || 0) + 1
    })

    const stats = {
      total: totalResult.count || 0,
      unread: unreadResult.count || 0,
      notificationsToday: todayResult.count || 0,
      dismissed: dismissedResult.count || 0,
      byType,
    }

    // Build query for notifications list
    let query = supabaseAdmin
      .from('notifications')
      .select(`
        id,
        user_id,
        type,
        actor_id,
        post_id,
        comment_id,
        conversation_id,
        content,
        read_at,
        dismissed_at,
        created_at,
        recipient:profiles!notifications_user_id_fkey(username, avatar_url),
        actor:profiles!notifications_actor_id_fkey(username, avatar_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    if (readStatus === 'read') {
      query = query.not('read_at', 'is', null)
    } else if (readStatus === 'unread') {
      query = query.is('read_at', null)
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
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Transform data to match expected structure
    const notifications = (data || []).map((n: Record<string, unknown>) => {
      const recipient = n.recipient as { username?: string; avatar_url?: string } | null
      const actor = n.actor as { username?: string; avatar_url?: string } | null
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
        recipient_username: recipient?.username || 'unknown',
        recipient_avatar_url: recipient?.avatar_url || null,
        actor_username: actor?.username || null,
        actor_avatar_url: actor?.avatar_url || null,
      }
    })

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      stats,
      notifications,
      total,
      totalPages,
      page,
    })
  } catch (error) {
    console.error('Error in notifications API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

