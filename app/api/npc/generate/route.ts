import { NextRequest, NextResponse } from 'next/server'
import { getNPCById } from '@/lib/queries-npc'
import { ContentGenerator } from '@/lib/npc'

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

    // Get NPC profile to verify it exists and is active
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

    // Use ContentGenerator which includes historical context for better variety
    const generatedPosts = await ContentGenerator.generatePostsForNPC(
      npc_id,
      Math.min(count, 10)
    )

    return NextResponse.json({
      generated: generatedPosts.length,
      posts: generatedPosts.map(post => ({
        content: post.content,
        postType: post.postType,
        scheduledFor: post.scheduledFor.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error generating posts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate posts' },
      { status: 500 }
    )
  }
}
