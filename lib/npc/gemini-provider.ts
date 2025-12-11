import type { VisualPersona } from '../queries-npc'

export interface GeminiImageConfig {
  apiKey: string
  model?: 'gemini-2.5-flash-image' | 'gemini-3-pro-image'
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
    this.model = config.model || 'gemini-2.5-flash-image'
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
    const fullPrompt = this.buildPromptWithPersona(request)

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
   * Generate image with a reference image for better consistency
   */
  async generateImageWithReference(
    request: ImageGenerationRequest,
    referenceImageBase64: string,
    referenceMimeType: string = 'image/png'
  ): Promise<ImageGenerationResponse> {
    const fullPrompt = this.buildPromptWithPersona(request)

    console.log('[GeminiImageProvider] Generating image with reference')

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
                { text: fullPrompt },
                {
                  inlineData: {
                    mimeType: referenceMimeType,
                    data: referenceImageBase64,
                  },
                },
              ],
            },
          ],
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
  model?: 'gemini-2.5-flash-image' | 'gemini-3-pro-image'
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

