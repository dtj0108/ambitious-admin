import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
)
const COOKIE_NAME = 'admin_session'

// Public routes that don't require authentication
const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/setup-totp',
  '/api/auth/verify-totp',
  '/api/auth/claim',
  '/api/auth/set-password',
  '/api/execute-query',  // OpenAI agent endpoint (has its own API key auth)
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Allow static files and other Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    // Redirect to login
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Verify the token
  try {
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch {
    // Invalid or expired token - redirect to login
    const loginUrl = new URL('/login', request.url)
    const response = NextResponse.redirect(loginUrl)
    // Clear the invalid cookie
    response.cookies.delete(COOKIE_NAME)
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

