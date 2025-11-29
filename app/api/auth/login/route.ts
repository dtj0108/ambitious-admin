import { NextRequest, NextResponse } from 'next/server'
import { 
  getAdminByEmail, 
  verifyPassword, 
  generateTotpSecret,
  updateAdminTotpSecret,
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get admin user
    const admin = await getAdminByEmail(email)
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, admin.password_hash)
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if TOTP is enabled
    if (admin.totp_enabled && admin.totp_secret) {
      // Need to verify TOTP
      return NextResponse.json({
        success: true,
        requiresTotp: true,
        adminId: admin.id,
        email: admin.email,
        name: admin.name,
      })
    }

    // TOTP not set up - generate secret for enrollment
    const totpSecret = generateTotpSecret()
    await updateAdminTotpSecret(admin.id, totpSecret)

    return NextResponse.json({
      success: true,
      requiresSetup: true,
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}

