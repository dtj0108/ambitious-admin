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

type NotificationDateRange = 'all' | 'today' | '7d' | '30d'
type NotificationReadStatus = 'all' | 'read' | 'unread'

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
      const startOfToday = getStartOfToday()

      const [totalResult, unreadResult, todayResult, dismissedResult, allResult] = await Promise.all([
        supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }).is('read_at', null),
        supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday),
        supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }).not('dismissed_at', 'is', null),
        supabaseAdmin.from('notifications').select('type'),
      ])

      // Calculate by type
      const byType: Record<string, number> = {}
      allResult.data?.forEach(n => {
        const type = n.type || 'other'
        byType[type] = (byType[type] || 0) + 1
      })

      return NextResponse.json({
        stats: {
          total: totalResult.count || 0,
          unread: unreadResult.count || 0,
          notificationsToday: todayResult.count || 0,
          dismissed: dismissedResult.count || 0,
          byType,
        }
      })
    }

    if (action === 'list') {
      const page = parseInt(searchParams.get('page') || '1', 10)
      const limit = parseInt(searchParams.get('limit') || '20', 10)
      const type = searchParams.get('type')
      const readStatus = (searchParams.get('readStatus') || 'all') as NotificationReadStatus
      const dateRange = (searchParams.get('dateRange') || 'all') as NotificationDateRange

      const offset = (page - 1) * limit

      // Build query
      let query = supabaseAdmin
        .from('notifications')
        .select(`
          *,
          recipient:profiles!notifications_user_id_fkey(username, avatar_url),
          actor:profiles!notifications_actor_id_fkey(username, avatar_url)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply filters
      if (type && type !== 'all') {
        query = query.eq('type', type)
      }

      if (readStatus === 'read') {
        query = query.not('read_at', 'is', null)
      } else if (readStatus === 'unread') {
        query = query.is('read_at', null)
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

      // Transform data to match expected format
      const notifications = data?.map(n => ({
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
        recipient_username: n.recipient?.username || 'unknown',
        recipient_avatar_url: n.recipient?.avatar_url,
        actor_username: n.actor?.username,
        actor_avatar_url: n.actor?.avatar_url,
      })) || []

      return NextResponse.json({
        notifications,
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
        .from('notifications')
        .select(`
          *,
          recipient:profiles!notifications_user_id_fkey(username, avatar_url),
          actor:profiles!notifications_actor_id_fkey(username, avatar_url)
        `)
        .eq('id', id)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const notification = {
        ...data,
        recipient_username: data.recipient?.username || 'unknown',
        recipient_avatar_url: data.recipient?.avatar_url,
        actor_username: data.actor?.username,
        actor_avatar_url: data.actor?.avatar_url,
      }

      return NextResponse.json({ notification })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


