import type { AIProvider, AIProviderConfig, GeneratePostRequest, GeneratePostResponse, GenerateCommentRequest, GenerateCommentResponse } from './types'

// =====================================================
// Shared System Prompt Builder
// =====================================================

function buildPostSystemPrompt(request: GeneratePostRequest): string {
  // Build the character context from persona prompt or fallback to description
  const characterContext = request.personaPrompt 
    ? request.personaPrompt 
    : request.personaDescription || '';

  // DEBUG: Log what we're receiving
  console.log('=== AI SYSTEM PROMPT DEBUG ===')
  console.log('Persona Name:', request.personaName)
  console.log('Has Persona Prompt:', !!request.personaPrompt)
  console.log('Persona Prompt Length:', request.personaPrompt?.length || 0)
  console.log('Persona Prompt Preview:', request.personaPrompt?.substring(0, 100) || 'NONE')
  console.log('Tone:', request.tone)
  console.log('==============================')

  return `You are ${request.personaName}.

=== YOUR CHARACTER & PERSONALITY ===
${characterContext || 'A friendly and engaging social media user.'}

=== YOUR WRITING STYLE ===
Tone: ${request.tone}
You must stay in character at all times. Your personality, background, and unique voice should come through in every post.

=== PLATFORM CONTEXT ===
You are posting on Ambitious Social, a platform for ambitious people to share their wins, dreams, and connect with others.

Post types:
- "win": Celebrating achievements and victories
- "dream": Sharing aspirations and goals  
- "ask": Asking for advice or help
- "hangout": Inviting others to connect or meet up
- "intro": Introducing yourself
- "general": General thoughts and updates

=== CRITICAL RULES ===
- Write naturally as YOUR CHARACTER would - not like a generic AI
- FOLLOW THE WRITING STYLE in YOUR CHARACTER section above - that is your guide for length, tone, and structure
- If your character sometimes writes short one-liners, DO THAT. If they write longer posts, DO THAT.
- Don't be promotional or salesy
- Be genuine, authentic, and TRUE TO YOUR CHARACTER
- Your unique personality should be obvious in every post
- Never break character or sound generic
- Don't use hashtags excessively (max 1-2 if any)

=== VARIETY GUIDELINES ===
Avoid overusing the same openings. Try varying your style:
- Bold statements or hot takes
- Numbers or stats
- Single punchy word then elaborate
- Mid-story (drop readers into the action)
- Metaphors or comparisons
- Direct questions
- Confessions or admissions
- Quotes or what someone else said
- Contradictions or surprising twists

But ultimately, write how YOUR CHARACTER naturally writes.`
}

function buildCommentSystemPrompt(request: GenerateCommentRequest): string {
  const characterContext = request.personaPrompt 
    ? request.personaPrompt 
    : request.personaDescription || '';

  return `You are ${request.personaName}.

=== YOUR CHARACTER ===
${characterContext || 'A friendly and supportive social media user.'}

=== COMMENTING STYLE ===
Tone: ${request.tone}
Engagement style: ${request.engagementStyle}

You are commenting on a post on Ambitious Social. Stay in character.

=== RULES ===
- Write a brief, genuine comment (1-2 sentences max)
- Be supportive and encouraging in YOUR character's voice
- Reference something specific from the post
- Sound like YOUR CHARACTER, not a generic AI
- No excessive emojis or hashtags`
}

// =====================================================
// OpenAI Provider
// =====================================================

export class OpenAIProvider implements AIProvider {
  name = 'openai'
  private apiKey: string
  private model: string
  private maxTokens: number
  private temperature: number

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'gpt-4o'
    this.maxTokens = config.maxTokens || 500
    this.temperature = config.temperature || 0.8
  }

  async generatePost(request: GeneratePostRequest): Promise<GeneratePostResponse> {
    const prompt = this.buildPostPrompt(request)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getPostSystemPrompt(request),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('No content generated from OpenAI')
    }

    return this.parsePostResponse(content, request.postType)
  }

  async generateComment(request: GenerateCommentRequest): Promise<GenerateCommentResponse> {
    const prompt = this.buildCommentPrompt(request)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getCommentSystemPrompt(request),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: this.temperature,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('No comment generated from OpenAI')
    }

    return { content }
  }

  private getPostSystemPrompt(request: GeneratePostRequest): string {
    return buildPostSystemPrompt(request)
  }

  private getCommentSystemPrompt(request: GenerateCommentRequest): string {
    return buildCommentSystemPrompt(request)
  }

  private buildPostPrompt(request: GeneratePostRequest): string {
    const previousPostsContext = request.previousPosts?.length
      ? `\n\nIMPORTANT: Do NOT start your post the same way as these recent posts. Use a completely different opening structure:\n${request.previousPosts.slice(0, 3).join('\n')}`
      : ''

    // If using persona prompt, topics are included in the system prompt
    if (request.personaPrompt) {
      return `Write a ${request.postType} post.

Post type: ${request.postType}
${request.additionalContext ? `Additional context: ${request.additionalContext}` : ''}
${previousPostsContext}

Respond with ONLY the post content, nothing else.`
    }

    // Legacy: use topics from request
    const topicsStr = request.topics.length > 0 ? request.topics.join(', ') : 'general topics'
    return `Write a ${request.postType} post about one of these topics: ${topicsStr}

Post type: ${request.postType}
${request.additionalContext ? `Additional context: ${request.additionalContext}` : ''}
${previousPostsContext}

Respond with ONLY the post content, nothing else.`
  }

  private buildCommentPrompt(request: GenerateCommentRequest): string {
    return `Post by @${request.postAuthor} (${request.postType}):
"${request.postContent}"

Write a ${request.engagementStyle} comment on this post. Respond with ONLY the comment text.`
  }

  private parsePostResponse(content: string, requestedType: string): GeneratePostResponse {
    // Clean up the content
    let cleanContent = content
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/^Post:\s*/i, '') // Remove "Post:" prefix if present
      .trim()

    return {
      content: cleanContent,
      postType: requestedType as GeneratePostResponse['postType'],
    }
  }
}

// =====================================================
// Claude Provider
// =====================================================

export class ClaudeProvider implements AIProvider {
  name = 'claude'
  private apiKey: string
  private model: string
  private maxTokens: number
  private temperature: number

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'claude-sonnet-4-20250514'
    this.maxTokens = config.maxTokens || 500
    this.temperature = config.temperature || 0.8
  }

  async generatePost(request: GeneratePostRequest): Promise<GeneratePostResponse> {
    const prompt = this.buildPostPrompt(request)
    const systemPrompt = this.getPostSystemPrompt(request)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text?.trim()

    if (!content) {
      throw new Error('No content generated from Claude')
    }

    return this.parsePostResponse(content, request.postType)
  }

  async generateComment(request: GenerateCommentRequest): Promise<GenerateCommentResponse> {
    const prompt = this.buildCommentPrompt(request)
    const systemPrompt = this.getCommentSystemPrompt(request)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 200,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text?.trim()

    if (!content) {
      throw new Error('No comment generated from Claude')
    }

    return { content }
  }

  private getPostSystemPrompt(request: GeneratePostRequest): string {
    return buildPostSystemPrompt(request)
  }

  private getCommentSystemPrompt(request: GenerateCommentRequest): string {
    return buildCommentSystemPrompt(request)
  }

  private buildPostPrompt(request: GeneratePostRequest): string {
    const previousPostsContext = request.previousPosts?.length
      ? `\n\nIMPORTANT: Do NOT start your post the same way as these recent posts. Use a completely different opening structure:\n${request.previousPosts.slice(0, 3).join('\n')}`
      : ''

    // If using persona prompt, topics are included in the system prompt
    if (request.personaPrompt) {
      return `Write a ${request.postType} post.

Post type: ${request.postType}
${request.additionalContext ? `Additional context: ${request.additionalContext}` : ''}
${previousPostsContext}

Respond with ONLY the post content, nothing else.`
    }

    // Legacy: use topics from request
    const topicsStr = request.topics.length > 0 ? request.topics.join(', ') : 'general topics'
    return `Write a ${request.postType} post about one of these topics: ${topicsStr}

Post type: ${request.postType}
${request.additionalContext ? `Additional context: ${request.additionalContext}` : ''}
${previousPostsContext}

Respond with ONLY the post content, nothing else.`
  }

  private buildCommentPrompt(request: GenerateCommentRequest): string {
    return `Post by @${request.postAuthor} (${request.postType}):
"${request.postContent}"

Write a ${request.engagementStyle} comment on this post. Respond with ONLY the comment text.`
  }

  private parsePostResponse(content: string, requestedType: string): GeneratePostResponse {
    // Clean up the content
    let cleanContent = content
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/^Post:\s*/i, '') // Remove "Post:" prefix if present
      .trim()

    return {
      content: cleanContent,
      postType: requestedType as GeneratePostResponse['postType'],
    }
  }
}

// =====================================================
// xAI (Grok) Provider - Uses OpenAI-compatible API
// =====================================================

export class XAIProvider implements AIProvider {
  name = 'xai'
  private apiKey: string
  private model: string
  private maxTokens: number
  private temperature: number

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'grok-4-1-fast-non-reasoning'
    this.maxTokens = config.maxTokens || 500
    this.temperature = config.temperature || 0.8
  }

  async generatePost(request: GeneratePostRequest): Promise<GeneratePostResponse> {
    const prompt = this.buildPostPrompt(request)
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getPostSystemPrompt(request),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`xAI API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('No content generated from xAI')
    }

    return this.parsePostResponse(content, request.postType)
  }

  async generateComment(request: GenerateCommentRequest): Promise<GenerateCommentResponse> {
    const prompt = this.buildCommentPrompt(request)

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getCommentSystemPrompt(request),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: this.temperature,
        stream: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`xAI API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('No comment generated from xAI')
    }

    return { content }
  }

  private getPostSystemPrompt(request: GeneratePostRequest): string {
    return buildPostSystemPrompt(request)
  }

  private getCommentSystemPrompt(request: GenerateCommentRequest): string {
    return buildCommentSystemPrompt(request)
  }

  private buildPostPrompt(request: GeneratePostRequest): string {
    const previousPostsContext = request.previousPosts?.length
      ? `\n\nIMPORTANT: Do NOT start your post the same way as these recent posts. Use a completely different opening structure:\n${request.previousPosts.slice(0, 3).join('\n')}`
      : ''

    if (request.personaPrompt) {
      return `Write a ${request.postType} post.

Post type: ${request.postType}
${request.additionalContext ? `Additional context: ${request.additionalContext}` : ''}
${previousPostsContext}

Respond with ONLY the post content, nothing else.`
    }

    const topicsStr = request.topics.length > 0 ? request.topics.join(', ') : 'general topics'
    return `Write a ${request.postType} post about one of these topics: ${topicsStr}

Post type: ${request.postType}
${request.additionalContext ? `Additional context: ${request.additionalContext}` : ''}
${previousPostsContext}

Respond with ONLY the post content, nothing else.`
  }

  private buildCommentPrompt(request: GenerateCommentRequest): string {
    return `Post by @${request.postAuthor} (${request.postType}):
"${request.postContent}"

Write a ${request.engagementStyle} comment on this post. Respond with ONLY the comment text.`
  }

  private parsePostResponse(content: string, requestedType: string): GeneratePostResponse {
    let cleanContent = content
      .replace(/^["']|["']$/g, '')
      .replace(/^Post:\s*/i, '')
      .trim()

    return {
      content: cleanContent,
      postType: requestedType as GeneratePostResponse['postType'],
    }
  }
}

// =====================================================
// Provider Factory
// =====================================================

export function createAIProvider(
  providerType: 'openai' | 'claude' | 'xai',
  config?: Partial<AIProviderConfig>
): AIProvider {
  let apiKey: string

  switch (providerType) {
    case 'openai':
      apiKey = process.env.OPENAI_API_KEY || ''
      break
    case 'claude':
      apiKey = process.env.ANTHROPIC_API_KEY || ''
      break
    case 'xai':
      apiKey = process.env.XAI_API_KEY || ''
      break
    default:
      throw new Error(`Unknown provider type: ${providerType}`)
  }

  if (!apiKey) {
    throw new Error(`API key not configured for ${providerType}`)
  }

  const fullConfig: AIProviderConfig = {
    apiKey,
    ...config,
  }

  switch (providerType) {
    case 'openai':
      return new OpenAIProvider(fullConfig)
    case 'claude':
      return new ClaudeProvider(fullConfig)
    case 'xai':
      return new XAIProvider(fullConfig)
  }
}

// =====================================================
// Check if providers are configured
// =====================================================

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export function isXAIConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY)
}

export function getAvailableProviders(): ('openai' | 'claude' | 'xai')[] {
  const providers: ('openai' | 'claude' | 'xai')[] = []
  if (isOpenAIConfigured()) providers.push('openai')
  if (isClaudeConfigured()) providers.push('claude')
  if (isXAIConfigured()) providers.push('xai')
  return providers
}

