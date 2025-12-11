import type { VisualPersona } from '../queries-npc'

export interface GeminiImageConfig {
  apiKey: string
  // Valid Gemini models with image generation capability
  model?: 'gemini-2.0-flash-exp' | 'imagen-3.0-generate-002'
}

export interface ImageGenerationRequest {
  prompt: string
  visualPersona?: VisualPersona | null
  referenceImageUrl?: string | null
  style?: 'photo' | 'illustration' | 'mixed'
}

export interface ImageGenerationResponse {
  imageData: string // Base64 encoded image
  mimeType: string
}

/**
 * Gemini Image Provider for generating images using Google's Nano Banana models
 */
export class GeminiImageProvider {
  private apiKey: string
  private model: string
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models'

  constructor(config: GeminiImageConfig) {
    this.apiKey = config.apiKey
    // Use gemini-2.0-flash-exp which supports image generation
    this.model = config.model || 'gemini-2.0-flash-exp'
  }

  /**
   * Build a complete image prompt with character consistency
   */
  private buildPromptWithPersona(request: ImageGenerationRequest): string {
    const parts: string[] = []

    // Add visual persona for character consistency
    if (request.visualPersona) {
      const persona = request.visualPersona
      parts.push('CHARACTER DESCRIPTION (must match exactly):')
      if (persona.appearance) parts.push(`- Appearance: ${persona.appearance}`)
      if (persona.clothing) parts.push(`- Clothing: ${persona.clothing}`)
      if (persona.style) parts.push(`- Style: ${persona.style}`)
      if (persona.environment) parts.push(`- Environment: ${persona.environment}`)
      if (persona.photography_style) parts.push(`- Photography style: ${persona.photography_style}`)
      parts.push('')
    }

    // Add style preference
    if (request.style === 'photo') {
      parts.push('Style: Photorealistic, professional photography, natural lighting')
    } else if (request.style === 'illustration') {
      parts.push('Style: Digital illustration, clean lines, modern aesthetic')
    }

    // Add the main prompt
    parts.push('')
    parts.push('SCENE:')
    parts.push(request.prompt)

    return parts.join('\n')
  }

  /**
   * Generate an image from a text prompt
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const fullPrompt = 'Generate an image: ' + this.buildPromptWithPersona(request)

    console.log('[GeminiImageProvider] Generating image with prompt:', fullPrompt.substring(0, 200) + '...')

    const response = await fetch(
      `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    // Extract image from response
    const parts = data.candidates?.[0]?.content?.parts || []
    
    for (const part of parts) {
      if (part.inlineData) {
        return {
          imageData: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
        }
      }
    }

    throw new Error('No image generated from Gemini')
  }

  /**
   * Generate image with a reference image for facial consistency only
   */
  async generateImageWithReference(
    request: ImageGenerationRequest,
    referenceImageBase64: string,
    referenceMimeType: string = 'image/png'
  ): Promise<ImageGenerationResponse> {
    // Build the scene prompt
    const scenePrompt = this.buildPromptWithPersona(request)
    
    // Add face-only reference instructions
    const fullPrompt = `REFERENCE IMAGE INSTRUCTIONS:
The attached reference image shows a person. Use it ONLY for:
- Facial features (face shape, eyes, nose, mouth, skin tone)
- Hair color and general style
- Overall identity/likeness

DO NOT copy from the reference:
- The pose or body position
- The clothing or accessories
- The background or setting
- The lighting or composition
- The facial expression (create a new one fitting the scene)

CREATE A COMPLETELY NEW IMAGE showing this same person in the scene described below. They should be "living their life" - in motion, engaged in activities, in new environments.

REALISM REQUIREMENTS (CRITICAL):
- Realistic physics: feet on the ground, proper weight distribution, no floating
- Anatomically correct: proper proportions, natural joint positions, realistic hands
- Grounded in reality: believable scene, natural lighting, coherent environment
- No surreal or impossible poses

${scenePrompt}`

    console.log('[GeminiImageProvider] Generating image with face-only reference')

    // Prepend instruction to generate an image
    const imagePrompt = 'Generate an image based on this description and reference photo: ' + fullPrompt

    const response = await fetch(
      `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: imagePrompt },
                {
                  inlineData: {
                    mimeType: referenceMimeType,
                    data: referenceImageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    const parts = data.candidates?.[0]?.content?.parts || []
    
    for (const part of parts) {
      if (part.inlineData) {
        return {
          imageData: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
        }
      }
    }

    throw new Error('No image generated from Gemini')
  }
}

/**
 * Create a Gemini image provider instance
 */
export function createGeminiImageProvider(
  model?: 'gemini-2.0-flash-exp' | 'imagen-3.0-generate-002'
): GeminiImageProvider {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  return new GeminiImageProvider({ apiKey, model })
}

/**
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}

/**
 * Fetch an image from URL and convert to base64
 */
export async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`[fetchImageAsBase64] Failed to fetch image: ${response.status}`)
      return null
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    return {
      data: base64,
      mimeType: contentType,
    }
  } catch (error) {
    console.error('[fetchImageAsBase64] Error:', error)
    return null
  }
}

