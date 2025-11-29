import { NextResponse } from 'next/server'
import { getSession, listAdmins } from '@/lib/auth'

export async function GET() {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const admins = await listAdmins()

    return NextResponse.json({
      success: true,
      admins,
    })
  } catch (error) {
    console.error('List admins error:', error)
    return NextResponse.json(
      { error: 'Failed to list admins' },
      { status: 500 }
    )
  }
}

