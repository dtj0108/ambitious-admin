import { NextRequest, NextResponse } from 'next/server'
import { 
  getNPCs, 
  getNPCStats,
  type NPCListOptions,
} from '@/lib/queries-npc'
import { supabase, supabaseAdmin, isSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase'

// GET /api/npc - List NPCs with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const options: NPCListOptions = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : 
                searchParams.get('isActive') === 'false' ? false : undefined,
      aiModel: searchParams.get('aiModel') as 'openai' | 'claude' | undefined,
      sortBy: searchParams.get('sortBy') as NPCListOptions['sortBy'] || 'newest',
    }

    // Check if requesting stats
    if (searchParams.get('stats') === 'true') {
      const stats = await getNPCStats()
      return NextResponse.json(stats)
    }

    const result = await getNPCs(options)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching NPCs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NPCs' },
      { status: 500 }
    )
  }
}

// POST /api/npc - Create new NPC (with optional profile creation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.persona_name) {
      return NextResponse.json(
        { error: 'persona_name is required' },
        { status: 400 }
      )
    }

    let userId: string

    // Check if we need to create a new profile
    if (body.create_profile && body.profile) {
      // Use admin client to bypass RLS for profile creation
      if (!isServiceRoleConfigured || !supabaseAdmin) {
        return NextResponse.json(
          { error: 'Admin database access not configured. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local' },
          { status: 500 }
        )
      }

      const { profile } = body

      // Validate username
      if (!profile.username || profile.username.length < 3) {
        return NextResponse.json(
          { error: 'Username must be at least 3 characters' },
          { status: 400 }
        )
      }

      // Check if username is already taken
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', profile.username.toLowerCase())
        .single()

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        )
      }

      // Create an auth user for the NPC first (profiles table has FK to auth.users)
      // Generate a unique email for the NPC bot account
      const npcEmail = `npc_${profile.username.toLowerCase()}@bot.ambitious.local`
      const npcPassword = crypto.randomUUID() // Random password, won't be used
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d29235c4-fbd3-4077-b45b-7562ed3c0c13',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/npc/route.ts:94',message:'Before createUser',data:{npcEmail,username:profile.username,isServiceConfigured:!!supabaseAdmin},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H3'})}).catch(()=>{});
      // #endregion
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: npcEmail,
        password: npcPassword,
        email_confirm: true, // Auto-confirm the email
        user_metadata: {
          is_bot: true,
          username: profile.username.toLowerCase(),
        },
      })

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d29235c4-fbd3-4077-b45b-7562ed3c0c13',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/npc/route.ts:107',message:'After createUser',data:{hasAuthData:!!authData,hasUser:!!authData?.user,errorMessage:authError?.message,errorStatus:authError?.status,errorCode:(authError as any)?.code,fullError:JSON.stringify(authError)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H4,H5'})}).catch(()=>{});
      // #endregion

      if (authError || !authData.user) {
        console.error('Error creating auth user:', authError)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d29235c4-fbd3-4077-b45b-7562ed3c0c13',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/npc/route.ts:114',message:'Auth error branch taken',data:{errorMessage:authError?.message,errorName:authError?.name,errorStack:authError?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        return NextResponse.json(
          { error: `Failed to create NPC account: ${authError?.message || 'Unknown error'}` },
          { status: 500 }
        )
      }

      const authUserId = authData.user.id

      // Update/create the profile for the NPC using the auth user's ID
      // Use upsert because a trigger may have already created a basic profile
      const profileData: Record<string, unknown> = {
        id: authUserId, // Must match the auth user ID
        username: profile.username.toLowerCase(),
        full_name: profile.full_name || null,
        bio: profile.bio || null,
        avatar_url: profile.avatar_url || null,
        tags: profile.tags || null,
        is_bot: true, // Mark as bot
        updated_at: new Date().toISOString(),
      }

      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select('id')
        .single()

      if (profileError || !newProfile) {
        console.error('Error creating profile:', profileError)
        // Try to clean up the auth user we created
        await supabaseAdmin.auth.admin.deleteUser(authUserId)
        return NextResponse.json(
          { error: `Failed to create profile: ${profileError?.message || 'Unknown error'}` },
          { status: 500 }
        )
      }

      userId = newProfile.id
    } else if (body.user_id) {
      // Use existing user_id
      if (!supabase) {
        return NextResponse.json(
          { error: 'Database not configured' },
          { status: 500 }
        )
      }

      // Verify user exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', body.user_id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      userId = body.user_id
    } else {
      return NextResponse.json(
        { error: 'Either create_profile with profile data or user_id is required' },
        { status: 400 }
      )
    }

    // Create NPC config using admin client (bypasses RLS)
    const defaultEngagementSettings = {
      auto_like: true,
      auto_comment: true,
      likes_per_day: 10,
      comments_per_day: 5,
      comment_on_types: ['win', 'dream'],
      engagement_style: 'supportive',
    }

    const defaultPostingTimes = {
      mode: 'posts_per_day',
      posts_per_day: 3,
      active_hours: { start: 8, end: 22 },
      randomize_minutes: true,
      timezone: 'America/New_York',
    }

    const npcData = {
      user_id: userId,
      ai_model: body.ai_model || 'openai',
      temperature: body.temperature ?? 0.8,
      persona_name: body.persona_name,
      persona_prompt: body.persona_prompt || null,
      persona_description: body.persona_description || null,
      topics: body.topics || [],
      tone: body.tone || 'casual',
      post_types: body.post_types || ['general'],
      posting_times: body.posting_times || defaultPostingTimes,
      custom_cron: body.custom_cron || null,
      engagement_settings: { ...defaultEngagementSettings, ...body.engagement_settings },
      is_active: body.is_active ?? true,
      // NPC type
      npc_type: body.npc_type || 'person',
      // Image generation settings
      generate_images: body.generate_images ?? false,
      image_frequency: body.image_frequency || 'sometimes',
      preferred_image_style: body.preferred_image_style || 'photo',
      visual_persona: body.visual_persona || null,
      reference_image_url: body.reference_image_url || null,
    }

    const { data: npc, error: npcError } = await supabaseAdmin
      .from('npc_profiles')
      .insert(npcData)
      .select(`
        *,
        profile:profiles!npc_profiles_user_id_fkey (
          username,
          full_name,
          avatar_url,
          email
        )
      `)
      .single()

    if (npcError || !npc) {
      console.error('Error creating NPC config:', npcError)
      return NextResponse.json(
        { error: `Failed to create NPC configuration: ${npcError?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    return NextResponse.json(npc, { status: 201 })
  } catch (error) {
    console.error('Error creating NPC:', error)
    return NextResponse.json(
      { error: 'Failed to create NPC' },
      { status: 500 }
    )
  }
}
