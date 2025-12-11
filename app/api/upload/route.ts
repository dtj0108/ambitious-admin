import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isServiceRoleConfigured } from '@/lib/supabase'

// POST /api/upload - Upload file to Supabase storage
export async function POST(request: NextRequest) {
  console.log('Upload API called')
  
  try {
    if (!isServiceRoleConfigured || !supabaseAdmin) {
      console.error('Upload API: Supabase admin not configured')
      return NextResponse.json(
        { error: 'Storage not configured. SUPABASE_SERVICE_ROLE_KEY required.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string || 'general'

    console.log('Upload API received:', { 
      hasFile: !!file, 
      type,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size 
    })

    if (!file) {
      console.error('Upload API: No file in request')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB for avatars, 10MB for other images)
    const maxSize = type === 'avatar' ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size must be less than ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileName = `${type}_${timestamp}_${randomId}.${fileExt}`

    // Determine bucket and path
    const bucket = 'posts' // Using the existing posts bucket
    const path = type === 'avatar' ? `avatars/${fileName}` : `uploads/${fileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase storage using admin client (bypasses RLS)
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true, // Allow overwriting if file exists
      })

    if (uploadError) {
      console.error('Upload error details:', {
        message: uploadError.message,
        name: uploadError.name,
        bucket,
        path,
        fileType: file.type,
        fileSize: file.size,
      })
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path)

    console.log('Upload successful:', { path: data.path, publicUrl: urlData.publicUrl })

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    })
  } catch (error) {
    console.error('Error in upload:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

