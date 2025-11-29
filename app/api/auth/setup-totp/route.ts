import { NextRequest, NextResponse } from 'next/server'
import { 
  getAdminByEmail, 
  generateQRCode,
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { adminId, email } = await request.json()

    if (!adminId || !email) {
      return NextResponse.json(
        { error: 'Admin ID and email are required' },
        { status: 400 }
      )
    }

    // Get admin to get the stored secret
    const admin = await getAdminByEmail(email)
    
    if (!admin || admin.id !== adminId) {
      return NextResponse.json(
        { error: 'Invalid admin' },
        { status: 401 }
      )
    }

    if (!admin.totp_secret) {
      return NextResponse.json(
        { error: 'TOTP secret not found. Please login again.' },
        { status: 400 }
      )
    }

    // Generate QR code
    const qrCode = await generateQRCode(email, admin.totp_secret)

    return NextResponse.json({
      success: true,
      qrCode,
      secret: admin.totp_secret, // Show secret for manual entry
    })
  } catch (error) {
    console.error('Setup TOTP error:', error)
    return NextResponse.json(
      { error: 'An error occurred during TOTP setup' },
      { status: 500 }
    )
  }
}

