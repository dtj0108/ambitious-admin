import { createAIProvider } from './ai-providers'
import { addToQueue, getNPCById, getRecentNPCPosts } from '../queries-npc'
import { calculateMultiplePostTimes, getPostsToGenerate } from './schedule-utils'
import { generateImagePrompt, buildCompleteImagePrompt } from './image-prompt-generator'
import { createGeminiImageProvider, isGeminiConfigured, fetchImageAsBase64 } from './gemini-provider'
import { uploadNPCImage } from './image-storage'
import type { 
  ContentGenerationOptions, 
  ScheduledPost, 
  GeneratePostRequest 
} from './types'
import type { NPCProfile, PostType, PostingTimes, ImageFrequency } from '../queries-npc'

export class ContentGenerator {
  /**
   * Generate posts for an NPC and add them to the queue
   */
  /**
   * Determine if an image should be generated based on frequency setting
   */
  private static shouldGenerateImage(frequency: ImageFrequency): boolean {
    const random = Math.random()
    switch (frequency) {
      case 'always':
        return true
      case 'sometimes':
        return random < 0.5 // 50% chance
      case 'rarely':
        return random < 0.25 // 25% chance
      default:
        return false
    }
  }

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
      generateImages = false,
      imageFrequency = 'sometimes',
      preferredImageStyle = 'photo',
      visualPersona = null,
      referenceImageUrl = null,
      npcType = 'person',
    } = options

    const provider = createAIProvider(aiModel, { temperature })
    const generatedPosts: ScheduledPost[] = []
    const isObjectNpc = npcType === 'object'
    
    // Fetch recent posts from the database to avoid repetition across sessions
    const historicalPosts = await getRecentNPCPosts(npcId, 15)
    const previousContents: string[] = [...historicalPosts]
    
    console.log(`[ContentGenerator] Loaded ${historicalPosts.length} historical posts for context`)
    console.log(`[ContentGenerator] NPC type: ${npcType}`)
    
    // Pre-fetch reference image for character consistency (only for person NPCs)
    let referenceImageData: { data: string; mimeType: string } | null = null
    if (referenceImageUrl && generateImages && !isObjectNpc) {
      console.log(`[ContentGenerator] Fetching reference image for person consistency: ${referenceImageUrl}`)
      referenceImageData = await fetchImageAsBase64(referenceImageUrl)
      if (referenceImageData) {
        console.log('[ContentGenerator] Reference image loaded successfully')
      }
    }

    // Calculate random schedule times based on posting configuration
    const scheduleTimes = postingTimes
      ? calculateMultiplePostTimes(postingTimes, count)
      : this.calculateLegacyScheduleTimes(count)

    // Check if we can generate images
    const canGenerateImages = generateImages && isGeminiConfigured()
    if (generateImages && !isGeminiConfigured()) {
      console.warn('[ContentGenerator] Image generation enabled but GEMINI_API_KEY not configured')
    }

    // Length hinting: keep the NPC "free", but strongly encourage visible variety.
    // This is intentionally random per post to avoid the model drifting to a consistent safe length.
    const pickLengthHint = (): string => {
      const r = Math.random()

      // Slight bias towards extremes (one-liner / long) to force range.
      if (r < 0.35) {
        return 'Length target: ONE-LINER (5–20 words, 1 sentence). Do not mention word counts or labels.'
      }
      if (r < 0.55) {
        return 'Length target: SHORT (20–45 words, 1–2 sentences). Do not mention word counts or labels.'
      }
      if (r < 0.75) {
        return 'Length target: MEDIUM (45–90 words, 2–5 sentences). Do not mention word counts or labels.'
      }
      return 'Length target: LONG (90–160 words, 4–10 sentences; 1 line break allowed if natural). Do not mention word counts or labels.'
    }

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
        additionalContext: pickLengthHint(),
      }

      try {
        console.log(
          `[ContentGenerator] Generating post ${i + 1}/${count} (${postType}) lengthHint="${request.additionalContext}" previousPosts=${previousContents.length}`
        )
        const response = await provider.generatePost(request)
        
        // Use pre-calculated random schedule time
        const scheduledFor = scheduleTimes[i]

        let imageUrl: string | null = null
        let imagePrompt: string | null = null

        // Generate image if enabled and random check passes
        if (canGenerateImages && this.shouldGenerateImage(imageFrequency)) {
          try {
            console.log(`[ContentGenerator] Generating image for post ${i + 1}`)
            
            // Step 1: Generate image prompt from text AI
            const promptResult = await generateImagePrompt({
              postContent: response.content,
              postType: response.postType,
              personaName,
              tone,
              visualPersona,
              preferredStyle: preferredImageStyle,
              aiModel,
              temperature,
              isObjectNpc,
            })

            // Step 2: Build complete prompt with visual persona
            const completePrompt = buildCompleteImagePrompt(
              promptResult,
              visualPersona,
              preferredImageStyle,
              isObjectNpc
            )
            imagePrompt = completePrompt

            // Step 3: Generate image with Gemini
            const gemini = createGeminiImageProvider()
            let imageResult
            
            // Use reference image for character consistency if available
            if (referenceImageData) {
              console.log('[ContentGenerator] Using reference image for character consistency')
              imageResult = await gemini.generateImageWithReference(
                {
                  prompt: completePrompt,
                  visualPersona,
                  style: preferredImageStyle,
                },
                referenceImageData.data,
                referenceImageData.mimeType
              )
            } else {
              imageResult = await gemini.generateImage({
                prompt: completePrompt,
                visualPersona,
                style: preferredImageStyle,
              })
            }

            // Step 4: Upload to storage
            const uploadResult = await uploadNPCImage(
              imageResult.imageData,
              imageResult.mimeType,
              npcId
            )

            if (uploadResult) {
              imageUrl = uploadResult.url
              console.log(`[ContentGenerator] Image uploaded: ${imageUrl}`)
            }
          } catch (imageError) {
            console.error(`[ContentGenerator] Error generating image:`, imageError)
            // Continue without image
          }
        }

        const post: ScheduledPost = {
          content: response.content,
          postType: response.postType,
          scheduledFor,
          generationPrompt: JSON.stringify(request),
          aiModelUsed: aiModel,
          imageUrl,
          imagePrompt,
        }

        generatedPosts.push(post)
        // Keep most-recent-first so the prompt sees the latest post during a batch.
        previousContents.unshift(response.content)

        // Add to queue
        await addToQueue({
          npc_id: npcId,
          content: post.content,
          post_type: post.postType,
          scheduled_for: post.scheduledFor,
          generation_prompt: post.generationPrompt,
          ai_model_used: post.aiModelUsed,
          image_url: post.imageUrl,
          image_prompt: post.imagePrompt,
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
      // Image generation settings
      generateImages: npc.generate_images,
      imageFrequency: npc.image_frequency,
      preferredImageStyle: npc.preferred_image_style,
      visualPersona: npc.visual_persona,
      // Use reference_image_url if set, otherwise fall back to avatar for character consistency (person NPCs only)
      referenceImageUrl: npc.npc_type === 'object' ? null : (npc.reference_image_url || npc.profile?.avatar_url || null),
      npcType: npc.npc_type || 'person',
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

