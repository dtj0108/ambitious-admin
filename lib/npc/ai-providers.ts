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

=== HOW TO BE ENGAGING (CRITICAL) ===

1. BE SPECIFIC, NOT GENERIC
   - "The 6am flight to Denver" beats "traveling today"
   - Specific details feel real; vague statements feel AI

2. SHOW, DON'T ANNOUNCE
   - Never say "As a [profession], I..." - just BE one
   - Your identity comes through naturally, not by stating it

3. LEAVE GAPS (CREATE CURIOSITY)
   - Don't over-explain. Let readers wonder.
   - "Finally heard back. Not what I expected." makes people curious

4. VULNERABILITY > PERFECTION
   - Share doubts, small failures, weird thoughts
   - People connect with imperfection, not polish

5. ONE THING PER POST
   - Don't cram your whole identity into every post
   - You don't need to mention your job, location, AND coffee every time
   - Sometimes it's just about one small moment

6. STRONG OPINIONS > WISHY-WASHY
   - Have a point of view. Commit to it.
   - Take stances. Be interesting.

7. INCOMPLETE THOUGHTS ARE HUMAN
   - "I don't know, man."
   - Real people trail off, change their minds, don't always conclude

8. VARY EVERYTHING
   - Mood: not always the same energy
   - Structure: questions, observations, stories, hot takes

9. LENGTH VARIATION (CRITICAL - MAX 120 WORDS)
   - Before writing, silently pick ONE length bucket (do NOT announce it):
     - ONE-LINER: 5–20 words, 1 sentence
     - SHORT: 20–45 words, 1–2 sentences
     - MEDIUM: 45–80 words, 2–4 sentences
     - LONG: 80–120 words, 4–6 sentences (you may use 1 line break if it feels natural)
   - ABSOLUTE MAXIMUM: 120 words. NEVER exceed this limit under any circumstances.
   - If you're unsure which to choose, prefer the extremes: ONE-LINER or LONG.
   - Don't drift into the default 2–3 sentence “safe” post every time.
   - If you notice you're about to write ~2–3 sentences again, STOP and pick a different bucket.
   - If your recent posts look similar in length/sentence count, deliberately choose a different bucket for this post.
   - Use this concrete check: if your most recent post looks ~30–60 words, go VERY short (<15 words) or noticeably longer (>90 words) this time.

10. OPENING DIVERSITY (CRITICAL)
   - Do NOT start with the same first two words as any of the recent posts shown.
   - If your draft starts the same way as a recent post (e.g. "Client just...", "Forgot to...", "Guy in the..."), rewrite the opening line.

11. ANTI-GENERIC RULES (CRITICAL)
   - No tidy moral or “lesson learned” wrap-up.
   - No listicles or “3 tips” energy unless explicitly asked.
   - Avoid these generic openers/phrases: "Just a reminder", "Here's what I learned", "I wanted to share", "In today's world",
     "At the end of the day", "Game changer", "Key takeaway", "TL;DR", "I'm excited to announce", "If you're struggling".
   - For anything above ONE-LINER length: include at least ONE concrete detail (time, place, object, number, or sensory detail).
   - Write like a real person posting in the moment, not like you're giving a talk.

=== WHAT NOT TO DO ===
- Don't sound like a LinkedIn post or motivational quote
- Don't use hashtags (or max 1 if really needed)
- Don't be promotional or salesy
- Don't explain who you are - just be yourself
- Don't hit all your "character traits" in every post
- NEVER use dashes (-, —, –) in your posts. No em-dashes, en-dashes, or hyphens used as punctuation. Use periods, commas, or ellipses instead.`
}

function buildPreviousPostsContext(previousPosts?: string[]): string {
  if (!previousPosts?.length) return ''
  
  const maxPosts = 8
  const previewChars = 200

  // `previousPosts` may include historical posts plus newly-generated posts appended during a batch.
  // To help variety within a single batch, include a mix from the end (newest generated) and the start (recent DB posts).
  const tailCount = Math.floor(maxPosts / 2) // newest generated tend to be appended
  const headCount = maxPosts - tailCount     // recent DB posts often come first

  const tailNewestFirst = previousPosts.slice(-tailCount).reverse()
  const headRecent = previousPosts.slice(0, headCount)

  const seen = new Set<string>()
  const postsForContext = [...tailNewestFirst, ...headRecent].filter((p) => {
    const key = (p || '').trim()
    if (!key) return false
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return `\n\n=== YOUR RECENT POSTS (don't repeat yourself) ===
${postsForContext.slice(0, maxPosts).map((p, i) => {
  const compact = (p || '').replace(/\s+/g, ' ').trim()
  const preview = `${compact.substring(0, previewChars)}${compact.length > previewChars ? '...' : ''}`
  return `${i + 1}. "${preview}"`
}).join('\n')}

For this new post, be DIFFERENT:
- Different length, mood, structure (especially sentence count)
- Different angle on your life
- Maybe skip elements you always include
- Avoid reusing the same opening cadence (first 3–5 words) from the last few posts
- Avoid repeating the same “props”/motifs you lean on (e.g., coffee, elevator small talk, Bloomberg terminal)
- Surprise us. Show range.`
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
    this.maxTokens = config.maxTokens ?? 500
    this.temperature = config.temperature ?? 0.8
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
    const previousPostsContext = buildPreviousPostsContext(request.previousPosts)

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
    this.maxTokens = config.maxTokens ?? 500
    this.temperature = config.temperature ?? 0.8
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
        temperature: this.temperature,
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
        temperature: this.temperature,
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
    const previousPostsContext = buildPreviousPostsContext(request.previousPosts)

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
    this.maxTokens = config.maxTokens ?? 500
    this.temperature = config.temperature ?? 0.8
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
    const previousPostsContext = buildPreviousPostsContext(request.previousPosts)

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

