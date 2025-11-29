import { NextRequest, NextResponse } from 'next/server'
import { checkPendingInvite } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const invite = await checkPendingInvite(email)

    if (!invite) {
      return NextResponse.json(
        { error: 'No pending invite found for this email' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      adminId: invite.id,
      email: invite.email,
      name: invite.name,
    })
  } catch (error) {
    console.error('Check invite error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

