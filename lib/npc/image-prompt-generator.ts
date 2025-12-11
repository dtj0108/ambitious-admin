import { createAIProvider } from './ai-providers'
import type { VisualPersona, PostType, Tone, AIModel, ImageStyle } from '../queries-npc'

// =====================================================
// Complete NPC Generation
// =====================================================

export interface GenerateCompleteNPCRequest {
  description: string
  aiModel?: AIModel
  temperature?: number
}

export interface GeneratedNPCData {
  username: string
  display_name: string
  bio: string
  persona_name: string
  persona_prompt: string
  tone: Tone
  post_types: PostType[]
  visual_persona: VisualPersona
}

/**
 * Generate a complete NPC profile from a free-text description
 */
export async function generateCompleteNPC(
  request: GenerateCompleteNPCRequest
): Promise<GeneratedNPCData> {
  const provider = createAIProvider(request.aiModel || 'openai', { temperature: request.temperature || 0.8 })

  const systemPrompt = `You are an expert at creating detailed character profiles for social media NPCs (AI-powered virtual users).
Based on a brief description, create a complete character profile that feels authentic and unique.

IMPORTANT RULES:
1. Create a believable, three-dimensional character with a specific background
2. The username should be memorable, lowercase, only letters/numbers/underscores, 3-15 chars
3. The persona_prompt should be detailed (200-400 words) and include: background story, personality traits, communication style, expertise areas, pet peeves, and specific phrases they might use
4. Choose a tone that matches their personality
5. Select post_types that fit their character
6. Create a vivid visual persona with specific physical details

Available tones: casual, professional, inspirational, humorous, motivational, friendly
Available post_types: win, dream, ask, hangout, intro, general

Respond with ONLY a valid JSON object in this exact format:
{
  "username": "lowercase_username",
  "display_name": "Full Display Name",
  "bio": "Profile bio (2-3 sentences max, under 160 chars)",
  "persona_name": "Descriptive Title (e.g., Tech Startup Coach)",
  "persona_prompt": "Detailed character prompt for AI generation. Include: who they are, their background, how they communicate, what they care about, their expertise, personality quirks, and writing style guidelines.",
  "tone": "one of the available tones",
  "post_types": ["array", "of", "post_types"],
  "visual_persona": {
    "appearance": "Physical description: age, ethnicity, hair, facial features, build",
    "style": "Overall aesthetic and personal style",
    "clothing": "Typical clothing, colors, accessories",
    "environment": "Common settings and backgrounds",
    "photography_style": "Image style: lighting, composition, mood"
  }
}`

  const userPrompt = `Create a complete NPC profile based on this description:

"${request.description}"

Remember to respond with ONLY valid JSON. Make the character feel real and specific, not generic.`

  try {
    const response = await provider.generatePost({
      personaName: 'NPC Generator',
      personaDescription: systemPrompt,
      personaPrompt: systemPrompt,
      topics: [],
      tone: 'professional',
      postType: 'general',
      additionalContext: userPrompt,
    })

    const content = response.content.trim()
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate and sanitize the response
      const validTones: Tone[] = ['casual', 'professional', 'inspirational', 'humorous', 'motivational', 'friendly']
      const validPostTypes: PostType[] = ['win', 'dream', 'ask', 'hangout', 'intro', 'general']
      
      return {
        username: sanitizeUsername(parsed.username || 'npc_user'),
        display_name: parsed.display_name || 'NPC User',
        bio: (parsed.bio || '').substring(0, 500),
        persona_name: parsed.persona_name || 'NPC',
        persona_prompt: parsed.persona_prompt || '',
        tone: validTones.includes(parsed.tone) ? parsed.tone : 'casual',
        post_types: Array.isArray(parsed.post_types) 
          ? parsed.post_types.filter((t: string) => validPostTypes.includes(t as PostType))
          : ['general'],
        visual_persona: {
          appearance: parsed.visual_persona?.appearance || '',
          style: parsed.visual_persona?.style || '',
          clothing: parsed.visual_persona?.clothing || '',
          environment: parsed.visual_persona?.environment || '',
          photography_style: parsed.visual_persona?.photography_style || '',
        },
      }
    }

    throw new Error('Failed to parse NPC data from AI response')
  } catch (error) {
    console.error('[generateCompleteNPC] Error:', error)
    throw error
  }
}

/**
 * Sanitize username to be valid (lowercase, alphanumeric + underscore only)
 */
function sanitizeUsername(username: string): string {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 15) || 'npc_user'
}

// =====================================================
// Visual Persona Generation
// =====================================================

export interface GenerateVisualPersonaRequest {
  personaName: string
  personaPrompt: string
  aiModel: AIModel
  temperature?: number
}

/**
 * Use AI to generate a visual persona based on the text persona
 */
export async function generateVisualPersonaFromText(
  request: GenerateVisualPersonaRequest
): Promise<VisualPersona> {
  const provider = createAIProvider(request.aiModel, { temperature: request.temperature || 0.7 })

  const systemPrompt = `You are an expert at creating visual character descriptions for AI image generation.
Based on a character's personality and background, create a detailed visual persona that will ensure consistent character appearance across multiple AI-generated images.

Rules:
1. Create a specific, memorable appearance (age, ethnicity, hair, facial features, build)
2. Define a consistent personal style and aesthetic
3. Describe typical clothing choices that match their personality
4. Suggest environments where they'd naturally be found
5. Define a photography/image style that suits their vibe

Respond with ONLY a JSON object in this exact format:
{
  "appearance": "Physical description: age range, ethnicity/skin tone, hair (color, style, length), facial features, build/height",
  "style": "Overall aesthetic and personal style",
  "clothing": "Typical clothing, colors, accessories",
  "environment": "Common settings and backgrounds",
  "photography_style": "Image style: lighting, composition, mood"
}`

  const userPrompt = `Create a visual persona for this character:

Name: ${request.personaName}
Character Prompt: ${request.personaPrompt}

Remember to respond with ONLY valid JSON.`

  try {
    const response = await provider.generatePost({
      personaName: 'Visual Persona Generator',
      personaDescription: systemPrompt,
      personaPrompt: systemPrompt,
      topics: [],
      tone: 'professional',
      postType: 'general',
      additionalContext: userPrompt,
    })

    const content = response.content.trim()
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        appearance: parsed.appearance || '',
        style: parsed.style || '',
        clothing: parsed.clothing || '',
        environment: parsed.environment || '',
        photography_style: parsed.photography_style || '',
      }
    }

    throw new Error('Failed to parse visual persona JSON')
  } catch (error) {
    console.error('[VisualPersonaGenerator] Error:', error)
    // Return a basic fallback
    return {
      appearance: `${request.personaName}, professional appearance`,
      style: 'Modern, clean aesthetic',
      clothing: 'Business casual attire',
      environment: 'Modern office or urban settings',
      photography_style: 'Natural lighting, candid style',
    }
  }
}

/**
 * Generate a prompt for creating a reference/base image of a character
 */
export function buildReferenceImagePrompt(visualPersona: VisualPersona, personaName: string): string {
  return `Create a professional headshot/portrait photograph of a person.

THE PERSON (must match exactly):
- ${visualPersona.appearance}
- Style: ${visualPersona.style}
- Wearing: ${visualPersona.clothing}

REQUIREMENTS:
- Clear, well-lit portrait showing face and upper body
- Neutral but warm expression, approachable
- Clean, simple background (solid color or subtle gradient)
- High quality, professional photography
- This will be used as a reference for future images of this character

Photography style: ${visualPersona.photography_style || 'Professional portrait, soft natural lighting'}`
}

export interface ImagePromptRequest {
  postContent: string
  postType: PostType
  personaName: string
  tone: Tone
  visualPersona: VisualPersona | null
  preferredStyle: ImageStyle
  aiModel: AIModel
  temperature?: number
}

export interface ImagePromptResponse {
  prompt: string
  shouldIncludeCharacter: boolean
  sceneDescription: string
}

/**
 * Use the text AI to generate a structured image prompt based on post content
 */
export async function generateImagePrompt(
  request: ImagePromptRequest
): Promise<ImagePromptResponse> {
  const provider = createAIProvider(request.aiModel, { temperature: request.temperature || 0.7 })

  const visualPersonaContext = request.visualPersona
    ? `
The character's visual appearance:
- Appearance: ${request.visualPersona.appearance}
- Style: ${request.visualPersona.style}
- Clothing: ${request.visualPersona.clothing}
- Environment: ${request.visualPersona.environment}
- Photography style: ${request.visualPersona.photography_style}
`
    : ''

  const systemPrompt = `You are an expert at creating image prompts for AI image generation.
Your task is to create a detailed image prompt that will accompany a social media post.

${visualPersonaContext}

Style preference: ${request.preferredStyle === 'photo' ? 'Photorealistic photography' : request.preferredStyle === 'illustration' ? 'Digital illustration' : 'Either photo or illustration'}

Rules:
1. The image should complement the post content, not just illustrate it literally
2. If the post is personal or about the character's experience, include the character in the scene
3. If the post is about a general concept or advice, you can create an abstract or symbolic image
4. Be specific about lighting, composition, and mood
5. Keep the prompt concise but detailed (50-100 words)

Respond with ONLY a JSON object in this exact format:
{
  "shouldIncludeCharacter": true/false,
  "sceneDescription": "Brief description of what the scene shows",
  "prompt": "The full detailed image prompt"
}`

  const userPrompt = `Create an image prompt for this ${request.postType} post by ${request.personaName}:

"${request.postContent}"

Remember to respond with ONLY valid JSON.`

  try {
    const response = await provider.generatePost({
      personaName: 'Image Prompt Generator',
      personaDescription: systemPrompt,
      personaPrompt: systemPrompt,
      topics: [],
      tone: 'professional',
      postType: 'general',
      additionalContext: userPrompt,
    })

    // Parse JSON response
    const content = response.content.trim()
    
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        prompt: parsed.prompt || content,
        shouldIncludeCharacter: parsed.shouldIncludeCharacter ?? true,
        sceneDescription: parsed.sceneDescription || '',
      }
    }

    // Fallback: use the content as the prompt
    return {
      prompt: content,
      shouldIncludeCharacter: true,
      sceneDescription: '',
    }
  } catch (error) {
    console.error('[ImagePromptGenerator] Error generating prompt:', error)
    
    // Fallback prompt based on post content
    return {
      prompt: `A professional, ${request.preferredStyle === 'photo' ? 'photorealistic' : 'illustrated'} scene representing: ${request.postContent.substring(0, 100)}`,
      shouldIncludeCharacter: false,
      sceneDescription: 'Fallback scene',
    }
  }
}

/**
 * Build a complete image prompt with visual persona for Gemini
 */
export function buildCompleteImagePrompt(
  generatedPrompt: ImagePromptResponse,
  visualPersona: VisualPersona | null,
  preferredStyle: ImageStyle
): string {
  const parts: string[] = []

  // Style instruction
  if (preferredStyle === 'photo') {
    parts.push('Create a photorealistic image with professional photography quality, natural lighting, and cinematic composition.')
  } else if (preferredStyle === 'illustration') {
    parts.push('Create a digital illustration with clean lines, modern aesthetic, and professional quality.')
  } else {
    parts.push('Create a high-quality image, either photorealistic or illustrated, whichever suits the scene better.')
  }

  parts.push('')

  // Character description if needed
  if (generatedPrompt.shouldIncludeCharacter && visualPersona) {
    parts.push('THE PERSON IN THIS IMAGE:')
    parts.push(`- ${visualPersona.appearance}`)
    parts.push(`- Wearing: ${visualPersona.clothing}`)
    parts.push(`- Style: ${visualPersona.style}`)
    parts.push('')
  }

  // Scene
  parts.push('SCENE:')
  parts.push(generatedPrompt.prompt)

  // Environment hints
  if (visualPersona?.environment) {
    parts.push('')
    parts.push(`Setting hints: ${visualPersona.environment}`)
  }

  // Photography style
  if (visualPersona?.photography_style) {
    parts.push('')
    parts.push(`Photography style: ${visualPersona.photography_style}`)
  }

  return parts.join('\n')
}

