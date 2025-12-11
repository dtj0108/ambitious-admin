import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const isServiceRoleConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey)

// Create a single supabase client for the browser (uses anon key, respects RLS)
// Only create if configured to avoid build errors
let supabaseClient: SupabaseClient | null = null

if (isSupabaseConfigured) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = supabaseClient as SupabaseClient

// Create a service role client for admin operations (bypasses RLS)
// This should ONLY be used in server-side code (API routes)
let supabaseAdminClient: SupabaseClient | null = null

if (isServiceRoleConfigured) {
  supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const supabaseAdmin = supabaseAdminClient as SupabaseClient
