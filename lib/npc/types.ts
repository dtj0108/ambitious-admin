import type { PostType, Tone, EngagementStyle, ScheduleMode, PostingTimes, ActiveHours, VisualPersona, ImageFrequency, ImageStyle } from '../queries-npc'

// Re-export schedule types
export type { ScheduleMode, PostingTimes, ActiveHours, VisualPersona, ImageFrequency, ImageStyle }

// =====================================================
// AI Provider Types
// =====================================================

export interface AIProviderConfig {
  apiKey: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export interface GeneratePostRequest {
  personaName: string
  personaDescription: string // Deprecated: Use personaPrompt
  personaPrompt?: string // Full character prompt for AI generation
  topics: string[] // Deprecated: Use personaPrompt
  tone: Tone
  postType: PostType
  previousPosts?: string[] // For context/avoiding repetition
  additionalContext?: string
}

export interface GeneratePostResponse {
  content: string
  postType: PostType
  suggestedImagePrompt?: string
}

export interface GenerateCommentRequest {
  personaName: string
  personaDescription: string // Deprecated: Use personaPrompt
  personaPrompt?: string // Full character prompt for AI generation
  tone: Tone
  engagementStyle: EngagementStyle
  postContent: string
  postType: PostType
  postAuthor: string
}

export interface GenerateCommentResponse {
  content: string
}

export interface AIProvider {
  name: string
  generatePost(request: GeneratePostRequest): Promise<GeneratePostResponse>
  generateComment(request: GenerateCommentRequest): Promise<GenerateCommentResponse>
}

// =====================================================
// Content Generation Types
// =====================================================

export interface ContentGenerationOptions {
  npcId: string
  userId: string
  personaName: string
  personaDescription: string // Deprecated: Use personaPrompt
  personaPrompt?: string // Full character prompt for AI generation
  topics: string[] // Deprecated: Use personaPrompt
  tone: Tone
  postTypes: PostType[]
  aiModel: 'openai' | 'claude' | 'xai'
  temperature?: number // AI creativity (0.0-1.0), defaults to 0.8
  postingTimes?: PostingTimes // Schedule configuration
  count?: number // Number of posts to generate
  // Image generation options
  generateImages?: boolean
  imageFrequency?: ImageFrequency
  preferredImageStyle?: ImageStyle
  visualPersona?: VisualPersona | null
}

export interface ScheduledPost {
  content: string
  postType: PostType
  scheduledFor: Date
  generationPrompt: string
  aiModelUsed: string
  imageUrl?: string | null
  imagePrompt?: string | null
}

// =====================================================
// Engagement Types
// =====================================================

export interface EngagementTarget {
  postId: string
  postContent: string
  postType: PostType
  authorUsername: string
  authorId: string
}

export interface EngagementAction {
  type: 'like' | 'comment'
  targetPostId: string
  commentContent?: string
}

// =====================================================
// Schedule Calculation Types
// =====================================================

export interface ScheduleCalculationOptions {
  postingTimes: PostingTimes
  count?: number
  fromDate?: Date
}

