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

export async function GET() {
  if (!isServiceRoleConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
  }

  try {
    const startOfToday = getStartOfToday()
    const sevenDaysAgo = getDaysAgo(7)

    // Get all messages for stats
    const { data: allMessages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id, created_at, message_type, conversation_id, sender_id')

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
    }

    const messages = allMessages || []

    // Calculate stats
    const total = messages.length
    const messagesToday = messages.filter(m => new Date(m.created_at) >= new Date(startOfToday)).length
    const messagesThisWeek = messages.filter(m => new Date(m.created_at) >= new Date(sevenDaysAgo)).length

    // Active conversations in last 7 days
    const recentMessages = messages.filter(m => new Date(m.created_at) >= new Date(sevenDaysAgo))
    const activeConversations7d = new Set(recentMessages.map(m => m.conversation_id).filter(Boolean)).size
    const uniqueSenders7d = new Set(recentMessages.map(m => m.sender_id).filter(Boolean)).size

    // Count by type
    const byType = {
      text: messages.filter(m => !m.message_type || m.message_type === 'text').length,
      system: messages.filter(m => m.message_type === 'system').length,
      image: messages.filter(m => m.message_type === 'image').length,
      video: messages.filter(m => m.message_type === 'video').length,
    }

    const stats = {
      total,
      messagesToday,
      messagesThisWeek,
      activeConversations7d,
      uniqueSenders7d,
      byType,
    }

    // Calculate activity trend (last 7 days)
    const trend: Array<{ date: string; label: string; count: number }> = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      
      const count = messages.filter(m => {
        const msgDate = new Date(m.created_at).toISOString().split('T')[0]
        return msgDate === dateStr
      }).length

      trend.push({ date: dateStr, label, count })
    }

    return NextResponse.json({ stats, trend })
  } catch (error) {
    console.error('Error in messages API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

