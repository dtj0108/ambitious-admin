import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { runAgentChat } from '@/lib/agent'

export async function POST(request: Request) {
  // Verify admin is logged in
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { message } = body

  if (!message || typeof message !== 'string') {
    return NextResponse.json(
      { error: 'Message is required and must be a string' },
      { status: 400 }
    )
  }

  if (message.length > 2000) {
    return NextResponse.json(
      { error: 'Message is too long (max 2000 characters)' },
      { status: 400 }
    )
  }

  try {
    const result = await runAgentChat({ message })

    return NextResponse.json({
      response: result.response,
      error: result.error
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

