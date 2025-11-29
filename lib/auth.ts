import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { supabase, isSupabaseConfigured } from './supabase'

// Configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
)
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours in ms
const COOKIE_NAME = 'admin_session'
const APP_NAME = 'Ambitious Admin'

// Types
export interface AdminUser {
  id: string
  email: string
  name: string | null
  totp_enabled: boolean
  created_at: string
  last_login: string | null
}

export interface SessionPayload {
  adminId: string
  email: string
  name: string | null
  exp: number
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// TOTP functions
export function generateTotpSecret(): string {
  return authenticator.generateSecret()
}

export function verifyTotpToken(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret })
}

export async function generateQRCode(email: string, secret: string): Promise<string> {
  const otpauth = authenticator.keyuri(email, APP_NAME, secret)
  return QRCode.toDataURL(otpauth)
}

// Session management
export async function createSession(admin: AdminUser): Promise<string> {
  const expiresAt = Date.now() + SESSION_DURATION

  const token = await new SignJWT({
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .sign(JWT_SECRET)

  return token
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION / 1000,
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Admin user functions
export async function getAdminByEmail(email: string): Promise<{
  id: string
  email: string
  password_hash: string
  name: string | null
  totp_secret: string | null
  totp_enabled: boolean
} | null> {
  if (!isSupabaseConfigured || !supabase) return null

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, password_hash, name, totp_secret, totp_enabled')
    .eq('email', email.toLowerCase())
    .single()

  if (error || !data) return null
  return data
}

export async function getAdminById(id: string): Promise<AdminUser | null> {
  if (!isSupabaseConfigured || !supabase) return null

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, name, totp_enabled, created_at, last_login')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as AdminUser
}

export async function updateAdminTotpSecret(adminId: string, secret: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  const { error } = await supabase
    .from('admin_users')
    .update({ totp_secret: secret })
    .eq('id', adminId)

  return !error
}

export async function enableAdminTotp(adminId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  const { error } = await supabase
    .from('admin_users')
    .update({ totp_enabled: true })
    .eq('id', adminId)

  return !error
}

export async function updateLastLogin(adminId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return

  await supabase
    .from('admin_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', adminId)
}

// Helper to create first admin (run once)
export async function createFirstAdmin(email: string, password: string, name?: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  const passwordHash = await hashPassword(password)

  const { error } = await supabase
    .from('admin_users')
    .insert([{
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name: name || null,
      totp_enabled: false,
    }])

  return !error
}

// Extended admin type for list view
export interface AdminUserFull {
  id: string
  email: string
  name: string | null
  totp_enabled: boolean
  created_at: string
  last_login: string | null
  invited_at: string | null
  invited_by: string | null
  inviter_name?: string | null
  inviter_email?: string | null
  has_password: boolean
}

// List all admins
export async function listAdmins(): Promise<AdminUserFull[]> {
  if (!isSupabaseConfigured || !supabase) return []

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, name, totp_enabled, created_at, last_login, invited_at, invited_by, password_hash')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  // Get inviter names
  const inviterIds = data.filter(a => a.invited_by).map(a => a.invited_by)
  let inviterMap: Record<string, { name: string | null, email: string }> = {}
  
  if (inviterIds.length > 0) {
    const { data: inviters } = await supabase
      .from('admin_users')
      .select('id, name, email')
      .in('id', inviterIds)
    
    if (inviters) {
      inviterMap = Object.fromEntries(inviters.map(i => [i.id, { name: i.name, email: i.email }]))
    }
  }

  return data.map(admin => ({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    totp_enabled: admin.totp_enabled,
    created_at: admin.created_at,
    last_login: admin.last_login,
    invited_at: admin.invited_at,
    invited_by: admin.invited_by,
    inviter_name: admin.invited_by ? inviterMap[admin.invited_by]?.name : null,
    inviter_email: admin.invited_by ? inviterMap[admin.invited_by]?.email : null,
    has_password: !!admin.password_hash,
  }))
}

// Invite a new admin
export async function inviteAdmin(
  email: string, 
  name: string | null, 
  invitedById: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Database not configured' }
  }

  // Check if admin already exists
  const existing = await getAdminByEmail(email)
  if (existing) {
    return { success: false, error: 'An admin with this email already exists' }
  }

  const { error } = await supabase
    .from('admin_users')
    .insert([{
      email: email.toLowerCase(),
      name: name || null,
      password_hash: null,
      totp_enabled: false,
      invited_at: new Date().toISOString(),
      invited_by: invitedById,
    }])

  if (error) {
    console.error('Invite error:', error)
    return { success: false, error: 'Failed to create invite' }
  }

  return { success: true }
}

// Delete an admin
export async function deleteAdmin(adminId: string, currentAdminId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Database not configured' }
  }

  // Prevent self-deletion
  if (adminId === currentAdminId) {
    return { success: false, error: 'You cannot delete yourself' }
  }

  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', adminId)

  if (error) {
    console.error('Delete error:', error)
    return { success: false, error: 'Failed to delete admin' }
  }

  return { success: true }
}

// Check if email has pending invite (no password set)
export async function checkPendingInvite(email: string): Promise<{
  id: string
  email: string
  name: string | null
} | null> {
  if (!isSupabaseConfigured || !supabase) return null

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, name, password_hash')
    .eq('email', email.toLowerCase())
    .single()

  if (error || !data) return null
  
  // Only return if password is not set (pending invite)
  if (data.password_hash) return null

  return {
    id: data.id,
    email: data.email,
    name: data.name,
  }
}

// Set password for invited admin
export async function setAdminPassword(adminId: string, password: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  const passwordHash = await hashPassword(password)
  
  // Also generate TOTP secret for 2FA setup
  const totpSecret = generateTotpSecret()

  const { error } = await supabase
    .from('admin_users')
    .update({ 
      password_hash: passwordHash,
      totp_secret: totpSecret,
    })
    .eq('id', adminId)

  return !error
}

