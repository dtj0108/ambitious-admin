import { NextRequest, NextResponse } from 'next/server'
import { 
  getNPCById, 
  updateNPC, 
  deleteNPC, 
  toggleNPCActive,
  getQueueItems,
  getEngagementLogs,
  type UpdateNPCData,
} from '@/lib/queries-npc'
import { supabaseAdmin, isServiceRoleConfigured } from '@/lib/supabase'

// GET /api/npc/[id] - Get single NPC
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    
    // Check if requesting queue or engagement logs
    const include = searchParams.get('include')
    
    const npc = await getNPCById(id)
    
    if (!npc) {
      return NextResponse.json(
        { error: 'NPC not found' },
        { status: 404 }
      )
    }

    const response: Record<string, unknown> = { npc }

    if (include === 'queue' || include === 'all') {
      const queue = await getQueueItems({ npcId: id, limit: 20 })
      response.queue = queue
    }

    if (include === 'engagement' || include === 'all') {
      const engagement = await getEngagementLogs({ npcId: id, limit: 20 })
      response.engagement = engagement
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching NPC:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NPC' },
      { status: 500 }
    )
  }
}

// PATCH /api/npc/[id] - Update NPC
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if just toggling active status
    if (body.toggle_active !== undefined) {
      const success = await toggleNPCActive(id, body.toggle_active)
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to toggle NPC status' },
          { status: 500 }
        )
      }
      const npc = await getNPCById(id)
      return NextResponse.json(npc)
    }

    const updateData: UpdateNPCData = {}

    // DEBUG: Log what we receive
    console.log('=== PATCH NPC DEBUG ===')
    console.log('NPC ID:', id)
    console.log('Body received:', JSON.stringify(body, null, 2).substring(0, 500))
    console.log('Has persona_prompt in body:', 'persona_prompt' in body)
    console.log('persona_prompt value:', body.persona_prompt?.substring(0, 100) || 'UNDEFINED')
    console.log('========================')

    // Only include fields that are provided
    if (body.ai_model !== undefined) updateData.ai_model = body.ai_model
    if (body.temperature !== undefined) updateData.temperature = body.temperature
    if (body.persona_name !== undefined) updateData.persona_name = body.persona_name
    if (body.persona_prompt !== undefined) updateData.persona_prompt = body.persona_prompt
    if (body.persona_description !== undefined) updateData.persona_description = body.persona_description
    if (body.topics !== undefined) updateData.topics = body.topics
    if (body.tone !== undefined) updateData.tone = body.tone
    if (body.post_types !== undefined) updateData.post_types = body.post_types
    if (body.posting_frequency !== undefined) updateData.posting_frequency = body.posting_frequency
    if (body.posting_times !== undefined) updateData.posting_times = body.posting_times
    if (body.custom_cron !== undefined) updateData.custom_cron = body.custom_cron
    if (body.engagement_settings !== undefined) updateData.engagement_settings = body.engagement_settings
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    // NPC type
    if (body.npc_type !== undefined) updateData.npc_type = body.npc_type
    // Image generation settings
    if (body.generate_images !== undefined) updateData.generate_images = body.generate_images
    if (body.image_frequency !== undefined) updateData.image_frequency = body.image_frequency
    if (body.preferred_image_style !== undefined) updateData.preferred_image_style = body.preferred_image_style
    if (body.visual_persona !== undefined) updateData.visual_persona = body.visual_persona
    if (body.reference_image_url !== undefined) updateData.reference_image_url = body.reference_image_url

    // Handle profile updates
    if (body.profile && isServiceRoleConfigured && supabaseAdmin) {
      // First get the NPC to find user_id
      const existingNpc = await getNPCById(id)
      if (existingNpc) {
        const profileUpdates: Record<string, unknown> = {}
        if (body.profile.full_name !== undefined) profileUpdates.full_name = body.profile.full_name
        if (body.profile.bio !== undefined) profileUpdates.bio = body.profile.bio
        if (body.profile.avatar_url !== undefined) profileUpdates.avatar_url = body.profile.avatar_url
        if (body.profile.tags !== undefined) profileUpdates.tags = body.profile.tags
        
        if (Object.keys(profileUpdates).length > 0) {
          profileUpdates.updated_at = new Date().toISOString()
          
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update(profileUpdates)
            .eq('id', existingNpc.user_id)
          
          if (profileError) {
            console.error('Error updating profile:', profileError)
            return NextResponse.json(
              { error: `Failed to update profile: ${profileError.message}` },
              { status: 500 }
            )
          }
        }
      }
    }

    const npc = await updateNPC(id, updateData)

    if (!npc) {
      return NextResponse.json(
        { error: 'Failed to update NPC or NPC not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(npc)
  } catch (error) {
    console.error('Error updating NPC:', error)
    return NextResponse.json(
      { error: 'Failed to update NPC' },
      { status: 500 }
    )
  }
}

// DELETE /api/npc/[id] - Delete NPC
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const success = await deleteNPC(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete NPC or NPC not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting NPC:', error)
    return NextResponse.json(
      { error: 'Failed to delete NPC' },
      { status: 500 }
    )
  }
}

