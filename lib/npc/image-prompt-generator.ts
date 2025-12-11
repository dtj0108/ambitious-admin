import { createAIProvider } from './ai-providers'
import type { VisualPersona, PostType, Tone, AIModel, ImageStyle } from '../queries-npc'

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

