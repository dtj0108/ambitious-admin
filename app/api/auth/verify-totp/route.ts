import { NextRequest, NextResponse } from 'next/server'
import { 
  getAdminByEmail,
  getAdminById,
  verifyTotpToken,
  enableAdminTotp,
  createSession,
  setSessionCookie,
  updateLastLogin,
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { adminId, email, token, isSetup } = await request.json()

    if (!adminId || !email || !token) {
      return NextResponse.json(
        { error: 'Admin ID, email, and token are required' },
        { status: 400 }
      )
    }

    // Get admin with secret
    const adminWithSecret = await getAdminByEmail(email)
    
    if (!adminWithSecret || adminWithSecret.id !== adminId) {
      return NextResponse.json(
        { error: 'Invalid admin' },
        { status: 401 }
      )
    }

    if (!adminWithSecret.totp_secret) {
      return NextResponse.json(
        { error: 'TOTP not configured' },
        { status: 400 }
      )
    }

    // Verify the token
    const isValid = verifyTotpToken(token, adminWithSecret.totp_secret)
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401 }
      )
    }

    // If this is setup, enable TOTP
    if (isSetup) {
      const enabled = await enableAdminTotp(adminId)
      if (!enabled) {
        return NextResponse.json(
          { error: 'Failed to enable 2FA' },
          { status: 500 }
        )
      }
    }

    // Get full admin data for session
    const admin = await getAdminById(adminId)
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Create and set session
    const sessionToken = await createSession(admin)
    await setSessionCookie(sessionToken)

    // Update last login
    await updateLastLogin(adminId)

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    })
  } catch (error) {
    console.error('Verify TOTP error:', error)
    return NextResponse.json(
      { error: 'An error occurred during verification' },
      { status: 500 }
    )
  }
}

