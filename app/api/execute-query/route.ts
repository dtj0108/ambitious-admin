import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// API key for OpenAI agent authentication
const AGENT_API_KEY = process.env.AGENT_API_KEY

export async function POST(request: Request) {
  // Check authentication - either admin session OR agent API key
  const authHeader = request.headers.get('authorization')
  const apiKey = authHeader?.replace('Bearer ', '')
  
  // Option 1: OpenAI agent using API key
  const isAgentAuth = AGENT_API_KEY && apiKey === AGENT_API_KEY
  
  // Option 2: Logged-in admin using the dashboard
  const session = await getSession()
  const isSessionAuth = !!session
  
  if (!isAgentAuth && !isSessionAuth) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { sql_query } = body

  if (!sql_query || typeof sql_query !== 'string') {
    return NextResponse.json(
      { error: 'SQL query is required and must be a string' },
      { status: 400 }
    )
  }

  try {
    const { data, error } = await supabase.rpc('query_sql', {
      query: sql_query
    })

    if (error) {
      console.error('Query error:', error)
      return NextResponse.json(
        { error: error.message || 'Query failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({ results: data })

  } catch (error) {
    console.error('Error executing query:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

