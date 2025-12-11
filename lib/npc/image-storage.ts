import { supabaseAdmin, isServiceRoleConfigured } from '../supabase'

export interface UploadImageResult {
  url: string
  path: string
}

/**
 * Upload a base64 encoded image to Supabase Storage
 */
export async function uploadNPCImage(
  imageData: string,
  mimeType: string,
  npcId: string
): Promise<UploadImageResult | null> {
  if (!isServiceRoleConfigured || !supabaseAdmin) {
    console.error('[ImageStorage] Supabase admin not configured')
    return null
  }

  try {
    // Decode base64 to buffer
    const buffer = Buffer.from(imageData, 'base64')

    // Generate unique filename
    const timestamp = Date.now()
    const extension = mimeType.includes('png') ? 'png' : 'jpg'
    const filename = `${npcId}/${timestamp}.${extension}`

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('npc-images')
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (error) {
      console.error('[ImageStorage] Upload error:', error)
      return null
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('npc-images')
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path,
    }
  } catch (error) {
    console.error('[ImageStorage] Error uploading image:', error)
    return null
  }
}

/**
 * Delete an NPC image from storage
 */
export async function deleteNPCImage(path: string): Promise<boolean> {
  if (!isServiceRoleConfigured || !supabaseAdmin) {
    return false
  }

  try {
    const { error } = await supabaseAdmin.storage
      .from('npc-images')
      .remove([path])

    if (error) {
      console.error('[ImageStorage] Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[ImageStorage] Error deleting image:', error)
    return false
  }
}

