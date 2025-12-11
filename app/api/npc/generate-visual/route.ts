import { NextRequest, NextResponse } from 'next/server'
import { generateVisualPersonaFromText, buildReferenceImagePrompt } from '@/lib/npc/image-prompt-generator'
import { createGeminiImageProvider, isGeminiConfigured } from '@/lib/npc/gemini-provider'
import { uploadNPCImage } from '@/lib/npc/image-storage'
import { supabaseAdmin, isServiceRoleConfigured } from '@/lib/supabase'
import type { AIModel, VisualPersona } from '@/lib/queries-npc'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, npc_id, persona_name, persona_prompt, ai_model, visual_persona } = body

    if (action === 'generate_visual_persona') {
      // Generate visual persona from text persona using AI
      if (!persona_name || !persona_prompt) {
        return NextResponse.json(
          { error: 'persona_name and persona_prompt are required' },
          { status: 400 }
        )
      }

      const visualPersona = await generateVisualPersonaFromText({
        personaName: persona_name,
        personaPrompt: persona_prompt,
        aiModel: (ai_model as AIModel) || 'openai',
      })

      return NextResponse.json({ visual_persona: visualPersona })
    }

    if (action === 'generate_reference_image') {
      // Generate a reference image for character consistency
      if (!isGeminiConfigured()) {
        return NextResponse.json(
          { error: 'GEMINI_API_KEY not configured' },
          { status: 500 }
        )
      }

      if (!visual_persona || !npc_id) {
        return NextResponse.json(
          { error: 'visual_persona and npc_id are required' },
          { status: 400 }
        )
      }

      const typedVisualPersona = visual_persona as VisualPersona

      // Build the reference image prompt
      const prompt = buildReferenceImagePrompt(typedVisualPersona, persona_name || 'Character')

      // Generate image with Gemini
      const gemini = createGeminiImageProvider()
      const imageResult = await gemini.generateImage({
        prompt,
        visualPersona: typedVisualPersona,
        style: 'photo',
      })

      // Upload to storage
      const uploadResult = await uploadNPCImage(
        imageResult.imageData,
        imageResult.mimeType,
        npc_id
      )

      if (!uploadResult) {
        return NextResponse.json(
          { error: 'Failed to upload reference image' },
          { status: 500 }
        )
      }

      // Update the NPC with the reference image URL
      if (isServiceRoleConfigured && supabaseAdmin) {
        await supabaseAdmin
          .from('npc_profiles')
          .update({ reference_image_url: uploadResult.url })
          .eq('id', npc_id)
      }

      return NextResponse.json({ reference_image_url: uploadResult.url })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "generate_visual_persona" or "generate_reference_image"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in generate-visual API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

