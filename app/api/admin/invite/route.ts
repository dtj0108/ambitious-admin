import { NextRequest, NextResponse } from 'next/server'
import { getSession, inviteAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const result = await inviteAdmin(email, name || null, session.adminId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin invited successfully',
    })
  } catch (error) {
    console.error('Invite admin error:', error)
    return NextResponse.json(
      { error: 'Failed to invite admin' },
      { status: 500 }
    )
  }
}

