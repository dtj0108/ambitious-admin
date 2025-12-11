import { supabase } from '../supabase'
import { createAIProvider } from './ai-providers'
import { 
  getTodayEngagementCount, 
  logEngagement, 
  incrementNPCStat, 
  updateNPCActivity,
  type NPCProfile,
  type PostType,
} from '../queries-npc'
import type { GenerateCommentRequest, EngagementTarget, EngagementAction } from './types'

export class BehaviorEngine {
  private npc: NPCProfile

  constructor(npc: NPCProfile) {
    this.npc = npc
  }

  /**
   * Process engagement actions for this NPC
   */
  async processEngagement(): Promise<{
    likes: number
    comments: number
    errors: string[]
  }> {
    const results = {
      likes: 0,
      comments: 0,
      errors: [] as string[],
    }

    if (!this.npc.is_active) {
      return results
    }

    const settings = this.npc.engagement_settings

    // Process likes
    if (settings.auto_like) {
      try {
        const likesGiven = await this.processLikes()
        results.likes = likesGiven
      } catch (error) {
        results.errors.push(`Likes: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Process comments
    if (settings.auto_comment) {
      try {
        const commentsGiven = await this.processComments()
        results.comments = commentsGiven
      } catch (error) {
        results.errors.push(`Comments: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return results
  }

  /**
   * Process like actions
   */
  private async processLikes(): Promise<number> {
    if (!supabase) return 0

    const settings = this.npc.engagement_settings
    
    // Check daily limit
    const todayCount = await getTodayEngagementCount(this.npc.id, 'like')
    const remaining = settings.likes_per_day - todayCount

    if (remaining <= 0) {
      return 0
    }

    // Find posts to like
    const targets = await this.findPostsToLike(remaining)
    let likesGiven = 0

    for (const target of targets) {
      const success = await this.likePost(target.postId)
      if (success) {
        likesGiven++
        
        await logEngagement({
          npc_id: this.npc.id,
          action_type: 'like',
          target_post_id: target.postId,
          status: 'completed',
        })

        await incrementNPCStat(this.npc.id, 'total_likes_given')
      }
    }

    if (likesGiven > 0) {
      await updateNPCActivity(this.npc.id, 'engagement')
    }

    return likesGiven
  }

  /**
   * Process comment actions
   */
  private async processComments(): Promise<number> {
    if (!supabase) return 0

    const settings = this.npc.engagement_settings
    
    // Check daily limit
    const todayCount = await getTodayEngagementCount(this.npc.id, 'comment')
    const remaining = settings.comments_per_day - todayCount

    if (remaining <= 0) {
      return 0
    }

    // Find posts to comment on
    const targets = await this.findPostsToComment(remaining)
    let commentsGiven = 0

    const provider = createAIProvider(this.npc.ai_model, { temperature: this.npc.temperature })

    for (const target of targets) {
      try {
        // Generate comment
        const request: GenerateCommentRequest = {
          personaName: this.npc.persona_name,
          personaDescription: this.npc.persona_description || '',
          personaPrompt: this.npc.persona_prompt || undefined, // Use the full persona prompt
          tone: this.npc.tone,
          engagementStyle: settings.engagement_style,
          postContent: target.postContent,
          postType: target.postType,
          postAuthor: target.authorUsername,
        }

        const { content } = await provider.generateComment(request)

        // Create comment
        const commentId = await this.createComment(target.postId, content)
        
        if (commentId) {
          commentsGiven++

          await logEngagement({
            npc_id: this.npc.id,
            action_type: 'comment',
            target_post_id: target.postId,
            comment_content: content,
            created_comment_id: commentId,
            status: 'completed',
          })

          await incrementNPCStat(this.npc.id, 'total_comments_given')
        }

        // Delay between comments to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Error commenting on post ${target.postId}:`, error)
        
        await logEngagement({
          npc_id: this.npc.id,
          action_type: 'comment',
          target_post_id: target.postId,
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    if (commentsGiven > 0) {
      await updateNPCActivity(this.npc.id, 'engagement')
    }

    return commentsGiven
  }

  /**
   * Find posts to like
   */
  private async findPostsToLike(limit: number): Promise<EngagementTarget[]> {
    if (!supabase) return []

    const settings = this.npc.engagement_settings

    // Get recent posts from post types we engage with
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        post_type,
        user_id,
        profiles!posts_user_id_fkey (
          username
        )
      `)
      .neq('user_id', this.npc.user_id) // Don't like own posts
      .in('post_type', settings.comment_on_types)
      .order('created_at', { ascending: false })
      .limit(limit * 3) // Get more than needed in case some are already liked

    if (error || !posts) {
      console.error('Error fetching posts to like:', error)
      return []
    }

    const targets: EngagementTarget[] = []

    for (const post of posts) {
      if (targets.length >= limit) break

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', this.npc.user_id)
        .single()

      if (!existingLike) {
        targets.push({
          postId: post.id,
          postContent: post.content,
          postType: post.post_type as PostType,
          authorUsername: (Array.isArray(post.profiles) ? post.profiles[0]?.username : (post.profiles as { username: string } | null)?.username) || 'user',
          authorId: post.user_id,
        })
      }
    }

    return targets
  }

  /**
   * Find posts to comment on
   */
  private async findPostsToComment(limit: number): Promise<EngagementTarget[]> {
    if (!supabase) return []

    const settings = this.npc.engagement_settings

    // Get recent posts from post types we engage with
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        post_type,
        user_id,
        profiles!posts_user_id_fkey (
          username
        )
      `)
      .neq('user_id', this.npc.user_id) // Don't comment on own posts
      .in('post_type', settings.comment_on_types)
      .order('created_at', { ascending: false })
      .limit(limit * 3)

    if (error || !posts) {
      console.error('Error fetching posts to comment on:', error)
      return []
    }

    const targets: EngagementTarget[] = []

    for (const post of posts) {
      if (targets.length >= limit) break

      // Check if already commented
      const { data: existingComment } = await supabase
        .from('comments')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', this.npc.user_id)
        .single()

      if (!existingComment) {
        targets.push({
          postId: post.id,
          postContent: post.content,
          postType: post.post_type as PostType,
          authorUsername: (Array.isArray(post.profiles) ? post.profiles[0]?.username : (post.profiles as { username: string } | null)?.username) || 'user',
          authorId: post.user_id,
        })
      }
    }

    return targets
  }

  /**
   * Like a post
   */
  private async likePost(postId: string): Promise<boolean> {
    if (!supabase) return false

    const { error } = await supabase
      .from('likes')
      .insert({
        post_id: postId,
        user_id: this.npc.user_id,
      })

    if (error) {
      console.error(`Error liking post ${postId}:`, error)
      return false
    }

    return true
  }

  /**
   * Create a comment
   */
  private async createComment(postId: string, content: string): Promise<string | null> {
    if (!supabase) return null

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: this.npc.user_id,
        content,
      })
      .select('id')
      .single()

    if (error) {
      console.error(`Error creating comment on post ${postId}:`, error)
      return null
    }

    return data.id
  }

  /**
   * Process all active NPCs
   */
  static async processAllActiveNPCs(): Promise<{
    processed: number
    totalLikes: number
    totalComments: number
    errors: string[]
  }> {
    const { getActiveNPCsForProcessing } = await import('../queries-npc')
    
    const activeNPCs = await getActiveNPCsForProcessing()
    
    const results = {
      processed: 0,
      totalLikes: 0,
      totalComments: 0,
      errors: [] as string[],
    }

    for (const npc of activeNPCs) {
      const engine = new BehaviorEngine(npc)
      const { likes, comments, errors } = await engine.processEngagement()
      
      results.processed++
      results.totalLikes += likes
      results.totalComments += comments
      results.errors.push(...errors.map(e => `${npc.persona_name}: ${e}`))

      // Small delay between NPCs
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return results
  }
}

