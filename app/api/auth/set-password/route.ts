import { NextRequest, NextResponse } from 'next/server'
import { setAdminPassword, checkPendingInvite } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { adminId, email, password } = await request.json()

    if (!adminId || !email || !password) {
      return NextResponse.json(
        { error: 'Admin ID, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Verify this is a valid pending invite
    const invite = await checkPendingInvite(email)
    if (!invite || invite.id !== adminId) {
      return NextResponse.json(
        { error: 'Invalid or already claimed invite' },
        { status: 400 }
      )
    }

    // Set the password
    const success = await setAdminPassword(adminId, password)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to set password' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password set successfully',
    })
  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

