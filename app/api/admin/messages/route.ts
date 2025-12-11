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
  const action = searchParams.get('action') || 'stats'
  const days = parseInt(searchParams.get('days') || '7', 10)

  try {
    if (action === 'stats') {
      const startOfToday = getStartOfToday()
      const sevenDaysAgo = getDaysAgo(7)

      const [totalResult, todayResult, weekResult, allMessagesResult] = await Promise.all([
        supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday),
        supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabaseAdmin.from('messages').select('sender_id, conversation_id, message_type').gte('created_at', sevenDaysAgo),
      ])

      // Calculate unique conversations and senders
      const uniqueConversations = new Set(allMessagesResult.data?.map(m => m.conversation_id).filter(Boolean) || [])
      const uniqueSenders = new Set(allMessagesResult.data?.map(m => m.sender_id).filter(Boolean) || [])

      // Calculate by type
      const byType = { text: 0, system: 0, image: 0, video: 0 }
      
      // Get all messages for type breakdown
      const { data: allMessages } = await supabaseAdmin
        .from('messages')
        .select('message_type')

      allMessages?.forEach(m => {
        const type = m.message_type || 'text'
        if (type in byType) {
          byType[type as keyof typeof byType]++
        } else {
          byType.text++
        }
      })

      return NextResponse.json({
        stats: {
          total: totalResult.count || 0,
          messagesToday: todayResult.count || 0,
          messagesThisWeek: weekResult.count || 0,
          activeConversations7d: uniqueConversations.size,
          uniqueSenders7d: uniqueSenders.size,
          byType,
        }
      })
    }

    if (action === 'trend') {
      const startDate = getDaysAgo(days)
      const now = new Date()

      const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select('created_at')
        .gte('created_at', startDate)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
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
      const trend = Array.from(activityMap.entries()).map(([date, count]) => {
        const d = new Date(date)
        return {
          date,
          label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          count,
        }
      })

      return NextResponse.json({ trend })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


