import { createAIProvider } from './ai-providers'
import { addToQueue, getNPCById } from '../queries-npc'
import { calculateMultiplePostTimes, getPostsToGenerate } from './schedule-utils'
import type { 
  ContentGenerationOptions, 
  ScheduledPost, 
  GeneratePostRequest 
} from './types'
import type { NPCProfile, PostType, PostingTimes } from '../queries-npc'

export class ContentGenerator {
  /**
   * Generate posts for an NPC and add them to the queue
   */
  static async generatePosts(options: ContentGenerationOptions): Promise<ScheduledPost[]> {
    const {
      npcId,
      userId,
      personaName,
      personaDescription,
      personaPrompt,
      topics,
      tone,
      postTypes,
      aiModel,
      temperature,
      postingTimes,
      count = 1,
    } = options

    const provider = createAIProvider(aiModel, { temperature })
    const generatedPosts: ScheduledPost[] = []
    const previousContents: string[] = []

    // Calculate random schedule times based on posting configuration
    const scheduleTimes = postingTimes
      ? calculateMultiplePostTimes(postingTimes, count)
      : this.calculateLegacyScheduleTimes(count)

    for (let i = 0; i < count; i++) {
      // Pick a random post type from allowed types
      const postType = postTypes[Math.floor(Math.random() * postTypes.length)]

      const request: GeneratePostRequest = {
        personaName,
        personaDescription,
        personaPrompt, // Use the full persona prompt if available
        topics: topics || [],
        tone,
        postType,
        previousPosts: previousContents, // For avoiding repetition
      }

      try {
        const response = await provider.generatePost(request)
        
        // Use pre-calculated random schedule time
        const scheduledFor = scheduleTimes[i]

        const post: ScheduledPost = {
          content: response.content,
          postType: response.postType,
          scheduledFor,
          generationPrompt: JSON.stringify(request),
          aiModelUsed: aiModel,
        }

        generatedPosts.push(post)
        previousContents.push(response.content)

        // Add to queue
        await addToQueue({
          npc_id: npcId,
          content: post.content,
          post_type: post.postType,
          scheduled_for: post.scheduledFor,
          generation_prompt: post.generationPrompt,
          ai_model_used: post.aiModelUsed,
        })

        // Small delay to avoid rate limits
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`Error generating post ${i + 1}:`, error)
        // Continue with other posts even if one fails
      }
    }

    return generatedPosts
  }

  /**
   * Generate posts for an NPC by ID
   */
  static async generatePostsForNPC(
    npcId: string, 
    count: number = 1
  ): Promise<ScheduledPost[]> {
    const npc = await getNPCById(npcId)
    
    if (!npc) {
      throw new Error('NPC not found')
    }

    if (!npc.is_active) {
      throw new Error('NPC is not active')
    }

    // DEBUG: Log what we're reading from the NPC
    console.log('=== CONTENT GENERATOR DEBUG ===')
    console.log('NPC ID:', npc.id)
    console.log('Persona Name:', npc.persona_name)
    console.log('Has persona_prompt:', !!npc.persona_prompt)
    console.log('persona_prompt value:', npc.persona_prompt?.substring(0, 100) || 'NULL/UNDEFINED')
    console.log('persona_description:', npc.persona_description?.substring(0, 100) || 'NULL/UNDEFINED')
    console.log('AI Model:', npc.ai_model)
    console.log('Tone:', npc.tone)
    console.log('================================')

    return this.generatePosts({
      npcId: npc.id,
      userId: npc.user_id,
      personaName: npc.persona_name,
      personaDescription: npc.persona_description || '',
      personaPrompt: npc.persona_prompt || undefined, // Use the full persona prompt
      topics: npc.topics || [],
      tone: npc.tone,
      postTypes: npc.post_types,
      aiModel: npc.ai_model,
      temperature: npc.temperature, // AI creativity setting
      postingTimes: npc.posting_times, // Pass schedule configuration
      count,
    })
  }

  /**
   * Legacy schedule calculation for backwards compatibility
   * Spreads posts out over time based on index
   */
  private static calculateLegacyScheduleTimes(count: number): Date[] {
    const times: Date[] = []
    const now = new Date()
    
    for (let i = 0; i < count; i++) {
      // Schedule first post in 5 minutes, then spread 4 hours apart
      const offsetMinutes = 5 + (i * 240) // 4 hours between posts
      
      const scheduledTime = new Date(now.getTime() + offsetMinutes * 60000)
      
      // Add random minutes for more natural timing
      scheduledTime.setMinutes(scheduledTime.getMinutes() + Math.floor(Math.random() * 30), 0, 0)
      
      times.push(scheduledTime)
    }
    
    return times
  }

  /**
   * Generate a batch of posts for all active NPCs
   * Useful for pre-filling the queue
   */
  static async generateBatchForActiveNPCs(postsPerNPC: number = 3): Promise<{
    npcId: string
    posts: ScheduledPost[]
    error?: string
  }[]> {
    // Import here to avoid circular dependency
    const { getActiveNPCsForProcessing } = await import('../queries-npc')
    
    const activeNPCs = await getActiveNPCsForProcessing()
    const results: { npcId: string; posts: ScheduledPost[]; error?: string }[] = []

    for (const npc of activeNPCs) {
      try {
        const posts = await this.generatePostsForNPC(npc.id, postsPerNPC)
        results.push({ npcId: npc.id, posts })
      } catch (error) {
        results.push({
          npcId: npc.id,
          posts: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }

      // Delay between NPCs to avoid overwhelming AI APIs
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return results
  }

  /**
   * Refill queue for NPCs that are running low on scheduled posts
   */
  static async refillQueuesIfNeeded(minQueueSize: number = 5): Promise<void> {
    const { getActiveNPCsForProcessing, getQueueItems } = await import('../queries-npc')
    
    const activeNPCs = await getActiveNPCsForProcessing()

    for (const npc of activeNPCs) {
      try {
        // Check current queue size
        const { items } = await getQueueItems({ 
          npcId: npc.id, 
          status: 'pending',
          limit: 1,
        })

        const pendingCount = items.length

        if (pendingCount < minQueueSize) {
          const toGenerate = minQueueSize - pendingCount
          console.log(`NPC ${npc.persona_name}: Generating ${toGenerate} posts to refill queue`)
          
          await this.generatePostsForNPC(npc.id, toGenerate)
        }
      } catch (error) {
        console.error(`Error refilling queue for NPC ${npc.id}:`, error)
      }

      // Small delay between NPCs
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
}

