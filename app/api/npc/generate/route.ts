import { NextRequest, NextResponse } from 'next/server'
import { getNPCById, addToQueue } from '@/lib/queries-npc'
import { createAIProvider } from '@/lib/npc/ai-providers'
import { calculateMultiplePostTimes } from '@/lib/npc/schedule-utils'
import type { GeneratePostRequest } from '@/lib/npc/types'

// POST /api/npc/generate - Generate posts for an NPC
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { npc_id, count = 1 } = body

    if (!npc_id) {
      return NextResponse.json(
        { error: 'npc_id is required' },
        { status: 400 }
      )
    }

    // Get NPC profile
    const npc = await getNPCById(npc_id)
    
    if (!npc) {
      return NextResponse.json(
        { error: 'NPC not found' },
        { status: 404 }
      )
    }

    if (!npc.is_active) {
      return NextResponse.json(
        { error: 'NPC is not active' },
        { status: 400 }
      )
    }

    // Create AI provider with NPC's temperature setting
    let provider
    try {
      provider = createAIProvider(npc.ai_model, { temperature: npc.temperature })
    } catch (error) {
      return NextResponse.json(
        { error: `AI provider not configured: ${error}` },
        { status: 500 }
      )
    }

    // Calculate random schedule times using the NPC's posting settings
    const scheduleTimes = calculateMultiplePostTimes(
      npc.posting_times || {
        mode: 'posts_per_day',
        posts_per_day: 3,
        active_hours: { start: 8, end: 22 },
        randomize_minutes: true,
        timezone: 'America/New_York',
      },
      Math.min(count, 10)
    )

    const generatedPosts = []
    const errors = []

    // Generate requested number of posts
    for (let i = 0; i < Math.min(count, 10); i++) {
      // Pick a random post type from allowed types
      const postType = npc.post_types[Math.floor(Math.random() * npc.post_types.length)]

      const generateRequest: GeneratePostRequest = {
        personaName: npc.persona_name,
        personaDescription: npc.persona_description || '',
        personaPrompt: npc.persona_prompt || undefined,
        topics: npc.topics,
        tone: npc.tone,
        postType: postType,
        previousPosts: generatedPosts.map(p => p.content), // Avoid repetition
      }

      try {
        const response = await provider.generatePost(generateRequest)

        // Use pre-calculated random schedule time
        const scheduledFor = scheduleTimes[i]

        // Add to queue
        const queueItem = await addToQueue({
          npc_id: npc.id,
          content: response.content,
          post_type: response.postType,
          scheduled_for: scheduledFor,
          generation_prompt: JSON.stringify(generateRequest),
          ai_model_used: npc.ai_model,
        })

        if (queueItem) {
          generatedPosts.push({
            id: queueItem.id,
            content: response.content,
            postType: response.postType,
            scheduledFor: scheduledFor.toISOString(),
          })
        }
      } catch (error) {
        console.error(`Error generating post ${i + 1}:`, error)
        errors.push(`Post ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Small delay between generations to avoid rate limits
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return NextResponse.json({
      generated: generatedPosts.length,
      posts: generatedPosts,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error generating posts:', error)
    return NextResponse.json(
      { error: 'Failed to generate posts' },
      { status: 500 }
    )
  }
}
