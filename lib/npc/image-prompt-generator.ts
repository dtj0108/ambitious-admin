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
  isObjectNpc?: boolean // If true, generate object/product images, not person images
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
  const isObject = request.isObjectNpc ?? false

  // Different context for person vs object NPCs
  const visualPersonaContext = request.visualPersona
    ? isObject
      ? `
The object/product style:
- Appearance: ${request.visualPersona.appearance}
- Style: ${request.visualPersona.style}
- Presentation: ${request.visualPersona.clothing}
- Setting: ${request.visualPersona.environment}
- Photography style: ${request.visualPersona.photography_style}
`
      : `
The character's visual appearance:
- Appearance: ${request.visualPersona.appearance}
- Style: ${request.visualPersona.style}
- Clothing: ${request.visualPersona.clothing}
- Environment: ${request.visualPersona.environment}
- Photography style: ${request.visualPersona.photography_style}
`
    : ''

  const objectRules = `Rules:
1. Create an image of the OBJECT/PRODUCT only - NO people or characters
2. Focus on beautiful product/food/object photography
3. Use appealing composition, lighting, and styling
4. The object should be the hero of the image
5. Keep the prompt concise but detailed (50-100 words)`

  const personRules = `Rules:
1. The image should complement the post content, not just illustrate it literally
2. If the post is personal or about the character's experience, include the character in the scene
3. If the post is about a general concept or advice, you can create an abstract or symbolic image
4. Be specific about lighting, composition, and mood
5. Keep the prompt concise but detailed (50-100 words)`

  const systemPrompt = `You are an expert at creating image prompts for AI image generation.
Your task is to create a detailed image prompt that will accompany a social media post.
${isObject ? 'This is for an OBJECT/PRODUCT account - DO NOT include any people.' : ''}

${visualPersonaContext}

Style preference: ${request.preferredStyle === 'photo' ? 'Photorealistic photography' : request.preferredStyle === 'illustration' ? 'Digital illustration' : 'Either photo or illustration'}

${isObject ? objectRules : personRules}

Respond with ONLY a JSON object in this exact format:
{
  "shouldIncludeCharacter": ${isObject ? 'false' : 'true/false'},
  "sceneDescription": "Brief description of what the scene shows",
  "prompt": "The full detailed image prompt"
}`

  const userPrompt = `Create an image prompt for this ${request.postType} post by ${request.personaName}:

"${request.postContent}"

${isObject ? 'Remember: This is an OBJECT account. Generate an image of the product/object only, NO people.' : ''}
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
 * Emphasizes dynamic scenes showing the character "living their life"
 */
export function buildCompleteImagePrompt(
  generatedPrompt: ImagePromptResponse,
  visualPersona: VisualPersona | null,
  preferredStyle: ImageStyle,
  isObjectNpc: boolean = false
): string {
  const parts: string[] = []

  if (isObjectNpc) {
    // Object/Product NPC prompts
    if (preferredStyle === 'photo') {
      parts.push('Create a stunning product/food photography image. Professional quality, beautiful lighting, appetizing/appealing presentation.')
    } else if (preferredStyle === 'illustration') {
      parts.push('Create a beautiful digital illustration of the object/product. Clean, modern, visually striking.')
    } else {
      parts.push('Create a high-quality, visually appealing image of this object/product.')
    }

    parts.push('')
    parts.push('KEY REQUIREMENTS:')
    parts.push('1. NO PEOPLE in the image - focus entirely on the object/product')
    parts.push('2. Beautiful composition and styling')
    parts.push('3. Appetizing/appealing presentation')
    parts.push('4. Professional product photography quality')
    parts.push('')

    // Object styling if available
    if (visualPersona) {
      parts.push('OBJECT/PRODUCT STYLE:')
      if (visualPersona.appearance) parts.push(`- Type: ${visualPersona.appearance}`)
      if (visualPersona.style) parts.push(`- Style: ${visualPersona.style}`)
      if (visualPersona.clothing) parts.push(`- Presentation: ${visualPersona.clothing}`)
      parts.push('')
    }

    parts.push('THE SCENE:')
    parts.push(generatedPrompt.prompt)

  } else {
    // Person NPC prompts (original logic)
    if (preferredStyle === 'photo') {
      parts.push('Create a photorealistic candid photograph - capture a natural, in-the-moment scene. Use professional photography quality with dynamic composition.')
    } else if (preferredStyle === 'illustration') {
      parts.push('Create a dynamic digital illustration showing the character in action, with expressive poses and engaging composition.')
    } else {
      parts.push('Create a high-quality, dynamic image capturing a natural moment in this person\'s life.')
    }

    parts.push('')
    parts.push('KEY REQUIREMENTS:')
    parts.push('1. Show this person actively engaged in the scene - NOT a static portrait')
    parts.push('2. REALISTIC PHYSICS: Feet on ground, proper weight distribution, no floating or levitating')
    parts.push('3. ANATOMICALLY CORRECT: Natural proportions, proper joint positions, realistic hands')
    parts.push('4. GROUNDED: Believable scene with coherent environment and natural lighting')
    parts.push('')

    // Character description if needed
    if (generatedPrompt.shouldIncludeCharacter && visualPersona) {
      parts.push('THE PERSON (keep their identity but show them in a NEW situation):')
      parts.push(`- Physical: ${visualPersona.appearance}`)
      parts.push(`- Clothing style (adapt to scene): ${visualPersona.clothing}`)
      parts.push(`- Their vibe: ${visualPersona.style}`)
      parts.push('')
    }

    parts.push('THE SCENE (create this as a new, unique moment):')
    parts.push(generatedPrompt.prompt)
    parts.push('')
    parts.push('Make it feel like a snapshot from their real life - natural, spontaneous, and full of personality.')
  }

  // Environment hints (both types)
  if (visualPersona?.environment) {
    parts.push('')
    parts.push(`Setting: ${visualPersona.environment}`)
  }

  // Photography style (both types)
  if (visualPersona?.photography_style) {
    parts.push('')
    parts.push(`Photography style: ${visualPersona.photography_style}`)
  }

  return parts.join('\n')
}

