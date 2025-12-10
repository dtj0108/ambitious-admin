import { NextRequest, NextResponse } from 'next/server'
import { 
  getPendingQueueItems, 
  updateQueueItem,
  updateNPCActivity,
  incrementNPCStat,
  getActiveNPCsForProcessing,
  getTodayEngagementCount,
  logEngagement,
  getQueueItems,
} from '@/lib/queries-npc'
import { supabase, supabaseAdmin, isServiceRoleConfigured } from '@/lib/supabase'
import { createAIProvider } from '@/lib/npc/ai-providers'
import { ContentGenerator, getPostsToGenerate } from '@/lib/npc'
import type { GenerateCommentRequest } from '@/lib/npc/types'

// This endpoint is designed to be called by a cron job
// POST /api/npc/process - Process scheduled posts and engagement

export async function POST(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const results = {
      postsPublished: 0,
      postsFailed: 0,
      likesGiven: 0,
      commentsGiven: 0,
      errors: [] as string[],
    }

    // Process pending posts
    const pendingItems = await getPendingQueueItems()
    
    // Use admin client for posting (bypasses RLS)
    const dbClient = isServiceRoleConfigured && supabaseAdmin ? supabaseAdmin : supabase

    for (const item of pendingItems) {
      try {
        if (!dbClient || !item.npc_profile) {
          throw new Error('Supabase not configured or NPC profile missing')
        }

        // Create the post using admin client
        const { data: post, error: postError } = await dbClient
          .from('posts')
          .insert({
            user_id: item.npc_profile.user_id,
            content: item.content,
            post_type: item.post_type,
          })
          .select('id')
          .single()

        if (postError) {
          throw new Error(`Failed to create post: ${postError.message}`)
        }

        // Update queue item
        await updateQueueItem(item.id, {
          status: 'published',
          published_post_id: post.id,
          published_at: new Date(),
        })

        // Update NPC activity and stats
        await updateNPCActivity(item.npc_id, 'post')
        await incrementNPCStat(item.npc_id, 'total_posts_generated')

        results.postsPublished++
      } catch (error) {
        console.error(`Error publishing post ${item.id}:`, error)
        
        await updateQueueItem(item.id, {
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })

        results.postsFailed++
        results.errors.push(`Post ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Process engagement for active NPCs
    const activeNPCs = await getActiveNPCsForProcessing()
    
    for (const npc of activeNPCs) {
      const settings = npc.engagement_settings
      
      if (!settings.auto_like && !settings.auto_comment) {
        continue
      }

      try {
        // Check daily limits
        const todayLikes = await getTodayEngagementCount(npc.id, 'like')
        const todayComments = await getTodayEngagementCount(npc.id, 'comment')

        // Find posts to engage with
        if (supabase && (settings.auto_like && todayLikes < settings.likes_per_day)) {
          const likeResult = await processLikes(npc, settings.likes_per_day - todayLikes)
          results.likesGiven += likeResult
        }

        if (supabase && (settings.auto_comment && todayComments < settings.comments_per_day)) {
          const commentResult = await processComments(npc, settings.comments_per_day - todayComments)
          results.commentsGiven += commentResult
        }
      } catch (error) {
        console.error(`Error processing engagement for NPC ${npc.id}:`, error)
        results.errors.push(`NPC ${npc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Auto-refill queues for NPCs that are running low on pending posts
    const refillResults = {
      npcRefilled: 0,
      postsGenerated: 0,
    }

    for (const npc of activeNPCs) {
      try {
        // Check how many pending posts this NPC has
        const { items: pendingPosts } = await getQueueItems({
          npcId: npc.id,
          status: 'pending',
          limit: 10,
        })

        // Get how many posts should be generated based on schedule mode
        const targetQueueSize = getPostsToGenerate(npc.posting_times) * 2 // Keep 2x buffer

        if (pendingPosts.length < targetQueueSize) {
          const toGenerate = targetQueueSize - pendingPosts.length
          console.log(`NPC ${npc.persona_name}: Queue low (${pendingPosts.length}/${targetQueueSize}), generating ${toGenerate} posts`)
          
          const generated = await ContentGenerator.generatePostsForNPC(npc.id, toGenerate)
          refillResults.npcRefilled++
          refillResults.postsGenerated += generated.length
        }
      } catch (error) {
        console.error(`Error refilling queue for NPC ${npc.id}:`, error)
      }
    }

    return NextResponse.json({
      ...results,
      queueRefill: refillResults,
    })
  } catch (error) {
    console.error('Error processing NPC queue:', error)
    return NextResponse.json(
      { error: 'Failed to process queue' },
      { status: 500 }
    )
  }
}

async function processLikes(
  npc: Awaited<ReturnType<typeof getActiveNPCsForProcessing>>[0],
  maxLikes: number
): Promise<number> {
  const dbClient = isServiceRoleConfigured && supabaseAdmin ? supabaseAdmin : supabase
  if (!dbClient) return 0

  let likesGiven = 0
  const settings = npc.engagement_settings

  // Find recent posts to like (exclude own posts and already liked)
  const { data: posts, error } = await dbClient
    .from('posts')
    .select('id, user_id')
    .neq('user_id', npc.user_id)
    .in('post_type', settings.comment_on_types)
    .order('created_at', { ascending: false })
    .limit(maxLikes * 2) // Get extra in case some fail

  if (error || !posts) {
    console.error('Error fetching posts to like:', error)
    return 0
  }

  for (const post of posts) {
    if (likesGiven >= maxLikes) break

    try {
      // Check if already liked
      const { data: existingLike } = await dbClient
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', npc.user_id)
        .single()

      if (existingLike) continue

      // Create like using admin client
      const { error: likeError } = await dbClient
        .from('likes')
        .insert({
          post_id: post.id,
          user_id: npc.user_id,
        })

      if (likeError) {
        throw new Error(likeError.message)
      }

      // Log engagement
      await logEngagement({
        npc_id: npc.id,
        action_type: 'like',
        target_post_id: post.id,
        status: 'completed',
      })

      await incrementNPCStat(npc.id, 'total_likes_given')
      likesGiven++
    } catch (error) {
      console.error(`Error liking post ${post.id}:`, error)
      await logEngagement({
        npc_id: npc.id,
        action_type: 'like',
        target_post_id: post.id,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  if (likesGiven > 0) {
    await updateNPCActivity(npc.id, 'engagement')
  }

  return likesGiven
}

async function processComments(
  npc: Awaited<ReturnType<typeof getActiveNPCsForProcessing>>[0],
  maxComments: number
): Promise<number> {
  const dbClient = isServiceRoleConfigured && supabaseAdmin ? supabaseAdmin : supabase
  if (!dbClient) return 0

  let commentsGiven = 0
  const settings = npc.engagement_settings

  // Find recent posts to comment on
  const { data: posts, error } = await dbClient
    .from('posts')
    .select('id, user_id, content, post_type, profiles!posts_user_id_fkey(username)')
    .neq('user_id', npc.user_id)
    .in('post_type', settings.comment_on_types)
    .order('created_at', { ascending: false })
    .limit(maxComments * 2)

  if (error || !posts) {
    console.error('Error fetching posts to comment on:', error)
    return 0
  }

  let provider
  try {
    provider = createAIProvider(npc.ai_model, { temperature: npc.temperature })
  } catch (error) {
    console.error('AI provider not configured:', error)
    return 0
  }

  for (const post of posts) {
    if (commentsGiven >= maxComments) break

    try {
      // Check if already commented
      const { data: existingComment } = await dbClient
        .from('comments')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', npc.user_id)
        .single()

      if (existingComment) continue

      // Generate comment
      const commentRequest: GenerateCommentRequest = {
        personaName: npc.persona_name,
        personaDescription: npc.persona_description || '',
        personaPrompt: npc.persona_prompt || undefined, // Use the full persona prompt
        tone: npc.tone,
        engagementStyle: settings.engagement_style,
        postContent: post.content,
        postType: post.post_type,
        postAuthor: (post.profiles as { username: string })?.username || 'user',
      }

      const { content: commentContent } = await provider.generateComment(commentRequest)

      // Create comment using admin client
      const { data: comment, error: commentError } = await dbClient
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: npc.user_id,
          content: commentContent,
        })
        .select('id')
        .single()

      if (commentError) {
        throw new Error(commentError.message)
      }

      // Log engagement
      await logEngagement({
        npc_id: npc.id,
        action_type: 'comment',
        target_post_id: post.id,
        comment_content: commentContent,
        created_comment_id: comment.id,
        status: 'completed',
      })

      await incrementNPCStat(npc.id, 'total_comments_given')
      commentsGiven++

      // Small delay between AI calls
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`Error commenting on post ${post.id}:`, error)
      await logEngagement({
        npc_id: npc.id,
        action_type: 'comment',
        target_post_id: post.id,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  if (commentsGiven > 0) {
    await updateNPCActivity(npc.id, 'engagement')
  }

  return commentsGiven
}

// Also support GET for manual triggering / testing
export async function GET(request: NextRequest) {
  // For manual triggers, redirect to POST
  return POST(request)
}

