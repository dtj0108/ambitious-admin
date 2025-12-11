'use client'

import { useState, useEffect } from 'react'
import { X, Bot, Zap, Brain, Plus, User, Upload, Tag, Search, ChevronDown, ChevronRight, Sparkles, Image, Wand2, RefreshCw } from 'lucide-react'
import { Button } from './Button'
import type { 
  AIModel, 
  Tone, 
  PostType,
  EngagementStyle,
  PostingTimes,
  EngagementSettings,
  NPCProfile,
  ScheduleMode,
  ActiveHours,
  VisualPersona,
  ImageFrequency,
  ImageStyle,
} from '@/lib/queries-npc'
import { PROFILE_TAG_CATEGORIES, searchTags } from '@/lib/profileTags'

interface NPCCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  editNPC?: NPCProfile | null // For edit mode
}

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Professional' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'motivational', label: 'Motivational' },
  { value: 'friendly', label: 'Friendly' },
]

const SCHEDULE_MODE_OPTIONS: { value: ScheduleMode; label: string; description: string }[] = [
  { value: 'posts_per_day', label: 'Posts Per Day', description: 'Post X times randomly throughout the day' },
  { value: 'posts_per_week', label: 'Posts Per Week', description: 'Post X times randomly throughout the week' },
  { value: 'variable_interval', label: 'Variable Interval', description: 'Post every X-Y hours randomly' },
]

const POST_TYPE_OPTIONS: { value: PostType; label: string; color: string }[] = [
  { value: 'win', label: 'Win', color: 'bg-post-win/20 text-post-win' },
  { value: 'dream', label: 'Dream', color: 'bg-post-dream/20 text-post-dream' },
  { value: 'ask', label: 'Ask', color: 'bg-post-ask/20 text-post-ask' },
  { value: 'hangout', label: 'Hangout', color: 'bg-post-hangout/20 text-post-hangout' },
  { value: 'intro', label: 'Intro', color: 'bg-post-intro/20 text-post-intro' },
  { value: 'general', label: 'General', color: 'bg-primary/20 text-primary' },
]

const ENGAGEMENT_STYLE_OPTIONS: { value: EngagementStyle; label: string }[] = [
  { value: 'supportive', label: 'Supportive' },
  { value: 'curious', label: 'Curious' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
  { value: 'thoughtful', label: 'Thoughtful' },
]

const IMAGE_FREQUENCY_OPTIONS: { value: ImageFrequency; label: string; description: string }[] = [
  { value: 'always', label: 'Always', description: '100% of posts will have images' },
  { value: 'sometimes', label: 'Sometimes', description: '~50% of posts will have images' },
  { value: 'rarely', label: 'Rarely', description: '~25% of posts will have images' },
]

const IMAGE_STYLE_OPTIONS: { value: ImageStyle; label: string }[] = [
  { value: 'photo', label: 'Photorealistic' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'mixed', label: 'Mixed' },
]

export function NPCCreateModal({ isOpen, onClose, onCreated, editNPC }: NPCCreateModalProps) {
  const isEditMode = Boolean(editNPC)
  
  // Step 1: Profile Creation (new user)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [profileTags, setProfileTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tagSearch, setTagSearch] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [showTagPicker, setShowTagPicker] = useState(false)
  
  // Step 2: AI & Persona
  const [aiModel, setAIModel] = useState<AIModel>('openai')
  const [temperature, setTemperature] = useState(0.8) // AI creativity (0.0-1.0)
  const [personaName, setPersonaName] = useState('')
  const [personaPrompt, setPersonaPrompt] = useState('')
  
  // Step 3: Content Config
  const [tone, setTone] = useState<Tone>('casual')
  const [postTypes, setPostTypes] = useState<PostType[]>(['general'])
  
  // Step 4: Schedule
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('posts_per_day')
  const [postsPerDay, setPostsPerDay] = useState(3)
  const [postsPerWeek, setPostsPerWeek] = useState(10)
  const [minIntervalHours, setMinIntervalHours] = useState(4)
  const [maxIntervalHours, setMaxIntervalHours] = useState(8)
  const [activeHoursStart, setActiveHoursStart] = useState(8)
  const [activeHoursEnd, setActiveHoursEnd] = useState(22)
  const [randomizeMinutes, setRandomizeMinutes] = useState(true)
  const [timezone, setTimezone] = useState('America/New_York')
  
  // Step 5: Engagement settings
  const [autoLike, setAutoLike] = useState(true)
  const [autoComment, setAutoComment] = useState(true)
  const [likesPerDay, setLikesPerDay] = useState(10)
  const [commentsPerDay, setCommentsPerDay] = useState(5)
  const [commentOnTypes, setCommentOnTypes] = useState<PostType[]>(['win', 'dream'])
  const [engagementStyle, setEngagementStyle] = useState<EngagementStyle>('supportive')
  
  // Step 6: Image generation settings
  const [generateImages, setGenerateImages] = useState(false)
  const [imageFrequency, setImageFrequency] = useState<ImageFrequency>('sometimes')
  const [preferredImageStyle, setPreferredImageStyle] = useState<ImageStyle>('photo')
  const [visualPersona, setVisualPersona] = useState<VisualPersona>({
    appearance: '',
    style: '',
    clothing: '',
    environment: '',
    photography_style: '',
  })
  const [referenceImageUrl, setReferenceImageUrl] = useState('')
  const [generatingVisualPersona, setGeneratingVisualPersona] = useState(false)
  const [generatingReferenceImage, setGeneratingReferenceImage] = useState(false)
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  
  // Current step
  const [step, setStep] = useState(1)
  const totalSteps = 6

  // Load edit data
  useEffect(() => {
    if (editNPC) {
      // In edit mode, we don't change the profile - just NPC settings
      setAIModel(editNPC.ai_model)
      setTemperature(editNPC.temperature ?? 0.8)
      setPersonaName(editNPC.persona_name)
      setPersonaPrompt(editNPC.persona_prompt || editNPC.persona_description || '')
      setTone(editNPC.tone)
      setPostTypes(editNPC.post_types)
      
      // Load schedule settings
      const pt = editNPC.posting_times
      if (pt?.mode) {
        setScheduleMode(pt.mode)
      }
      if (pt?.posts_per_day) setPostsPerDay(pt.posts_per_day)
      if (pt?.posts_per_week) setPostsPerWeek(pt.posts_per_week)
      if (pt?.min_interval_hours) setMinIntervalHours(pt.min_interval_hours)
      if (pt?.max_interval_hours) setMaxIntervalHours(pt.max_interval_hours)
      if (pt?.active_hours) {
        setActiveHoursStart(pt.active_hours.start)
        setActiveHoursEnd(pt.active_hours.end)
      }
      if (pt?.randomize_minutes !== undefined) setRandomizeMinutes(pt.randomize_minutes)
      setTimezone(pt?.timezone || 'America/New_York')
      setAutoLike(editNPC.engagement_settings?.auto_like ?? true)
      setAutoComment(editNPC.engagement_settings?.auto_comment ?? true)
      setLikesPerDay(editNPC.engagement_settings?.likes_per_day ?? 10)
      setCommentsPerDay(editNPC.engagement_settings?.comments_per_day ?? 5)
      setCommentOnTypes(editNPC.engagement_settings?.comment_on_types || ['win', 'dream'])
      setEngagementStyle(editNPC.engagement_settings?.engagement_style || 'supportive')
      
      // Load image generation settings
      setGenerateImages(editNPC.generate_images ?? false)
      setImageFrequency(editNPC.image_frequency ?? 'sometimes')
      setPreferredImageStyle(editNPC.preferred_image_style ?? 'photo')
      if (editNPC.visual_persona) {
        setVisualPersona(editNPC.visual_persona)
      }
      setReferenceImageUrl(editNPC.reference_image_url || '')
      
      // Load profile data for editing
      if (editNPC.profile) {
        setUsername(editNPC.profile.username)
        setDisplayName(editNPC.profile.full_name || '')
        setAvatarUrl(editNPC.profile.avatar_url || '')
        setAvatarPreview(editNPC.profile.avatar_url || null)
        setBio(editNPC.profile.bio || '')
        setProfileTags(editNPC.profile.tags || [])
      }
      
      // Start at step 1 in edit mode (profile is editable)
      setStep(1)
    }
  }, [editNPC])

  // Validate username
  const validateUsername = (value: string) => {
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters')
      return false
    }
    if (value.length > 20) {
      setUsernameError('Username must be 20 characters or less')
      return false
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError('Username can only contain letters, numbers, and underscores')
      return false
    }
    setUsernameError(null)
    return true
  }

  // Handle avatar file selection
  const handleAvatarFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setAvatarFile(file)
    setAvatarUrl('') // Clear URL if file is selected
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleAvatarFile(files[0])
    }
  }

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleAvatarFile(files[0])
    }
  }

  // Upload avatar to storage
  const uploadAvatar = async (): Promise<string | null> => {
    console.log('uploadAvatar called', { 
      hasFile: !!avatarFile, 
      fileName: avatarFile?.name,
      fileSize: avatarFile?.size,
      existingUrl: avatarUrl,
      isEditMode 
    })
    
    if (!avatarFile) {
      console.log('No avatar file, returning existing URL:', avatarUrl || null)
      return avatarUrl || null
    }

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', avatarFile)
      formData.append('type', 'avatar')

      console.log('Uploading avatar file:', avatarFile.name, avatarFile.size, avatarFile.type)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('Upload response status:', response.status)

      const data = await response.json()
      console.log('Upload response data:', data)

      if (!response.ok) {
        console.error('Avatar upload failed:', data.error || 'Unknown error')
        // Don't throw - just return existing URL and continue without new avatar
        return avatarUrl || null
      }

      console.log('Avatar uploaded successfully:', data.url)
      return data.url
    } catch (error) {
      console.error('Error uploading avatar:', error)
      // Don't set error - just skip the avatar and continue with NPC creation
      return avatarUrl || null
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Clear avatar
  const clearAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarUrl('')
  }

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !profileTags.includes(trimmed) && profileTags.length < 15) {
      setProfileTags([...profileTags, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setProfileTags(profileTags.filter(t => t !== tag))
  }

  const togglePostType = (type: PostType) => {
    if (postTypes.includes(type)) {
      if (postTypes.length > 1) {
        setPostTypes(postTypes.filter(t => t !== type))
      }
    } else {
      setPostTypes([...postTypes, type])
    }
  }

  const toggleCommentOnType = (type: PostType) => {
    if (commentOnTypes.includes(type)) {
      setCommentOnTypes(commentOnTypes.filter(t => t !== type))
    } else {
      setCommentOnTypes([...commentOnTypes, type])
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        // In edit mode, always allow proceeding (username already exists)
        // In create mode, require valid username
        return isEditMode || (username.length >= 3 && !usernameError)
      case 2:
        return personaName.trim().length > 0 && personaPrompt.trim().length > 0
      default:
        return true
    }
  }

  const handleSave = async () => {
    setError(null)
    
    if (!isEditMode) {
      if (!validateUsername(username)) {
        setStep(1)
        return
      }
    }
    
    if (!personaName.trim()) {
      setError('Persona name is required')
      setStep(2)
      return
    }
    
    if (!personaPrompt.trim()) {
      setError('Persona prompt is required')
      setStep(2)
      return
    }

    setSaving(true)

    try {
      // Upload avatar if file was selected
      let finalAvatarUrl = avatarUrl
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar()
        if (uploadedUrl) {
          finalAvatarUrl = uploadedUrl
        } else if (!avatarUrl) {
          // Upload failed and no fallback URL
          finalAvatarUrl = ''
        }
      }

      const postingTimes: PostingTimes = {
        mode: scheduleMode,
        posts_per_day: scheduleMode === 'posts_per_day' ? postsPerDay : undefined,
        posts_per_week: scheduleMode === 'posts_per_week' ? postsPerWeek : undefined,
        min_interval_hours: scheduleMode === 'variable_interval' ? minIntervalHours : undefined,
        max_interval_hours: scheduleMode === 'variable_interval' ? maxIntervalHours : undefined,
        active_hours: { start: activeHoursStart, end: activeHoursEnd },
        randomize_minutes: randomizeMinutes,
        timezone,
      }

      const engagementSettings: EngagementSettings = {
        auto_like: autoLike,
        auto_comment: autoComment,
        likes_per_day: likesPerDay,
        comments_per_day: commentsPerDay,
        comment_on_types: commentOnTypes,
        engagement_style: engagementStyle,
      }

      // Build visual persona if any field is filled
      const hasVisualPersona = Object.values(visualPersona).some(v => v.trim() !== '')
      const finalVisualPersona = hasVisualPersona ? visualPersona : null

      if (isEditMode) {
        // Update existing NPC
        const payload = {
          ai_model: aiModel,
          temperature,
          persona_name: personaName,
          persona_prompt: personaPrompt || null,
          tone,
          post_types: postTypes,
          posting_times: postingTimes,
          engagement_settings: engagementSettings,
          // Image generation settings
          generate_images: generateImages,
          image_frequency: imageFrequency,
          preferred_image_style: preferredImageStyle,
          visual_persona: finalVisualPersona,
          reference_image_url: referenceImageUrl || null,
          // Include profile updates
          profile: {
            full_name: displayName || null,
            bio: bio || null,
            avatar_url: finalAvatarUrl || avatarUrl || null,
            tags: profileTags.length > 0 ? profileTags : null,
          },
        }

        const response = await fetch(`/api/npc/${editNPC?.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update NPC')
        }
      } else {
        // Create new NPC with new profile
        const payload = {
          // Profile data (for creating new user)
          create_profile: true,
          profile: {
            username: username.toLowerCase(),
            full_name: displayName || null,
            bio: bio || null,
            avatar_url: finalAvatarUrl || null,
            tags: profileTags.length > 0 ? profileTags : null,
          },
          // NPC config
          ai_model: aiModel,
          temperature,
          persona_name: personaName,
          persona_prompt: personaPrompt || null,
          tone,
          post_types: postTypes,
          posting_times: postingTimes,
          engagement_settings: engagementSettings,
          // Image generation settings
          generate_images: generateImages,
          image_frequency: imageFrequency,
          preferred_image_style: preferredImageStyle,
          visual_persona: finalVisualPersona,
          reference_image_url: referenceImageUrl || null,
        }

        const response = await fetch('/api/npc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create NPC')
        }
      }

      onCreated()
      handleClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save NPC')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setUsername('')
    setDisplayName('')
    setBio('')
    setAvatarUrl('')
    setAvatarFile(null)
    setAvatarPreview(null)
    setIsDragging(false)
    setProfileTags([])
    setTagInput('')
    setTagSearch('')
    setExpandedCategories([])
    setShowTagPicker(false)
    setPersonaName('')
    setPersonaPrompt('')
    setTone('casual')
    setPostTypes(['general'])
    setScheduleMode('posts_per_day')
    setPostsPerDay(3)
    setPostsPerWeek(10)
    setMinIntervalHours(4)
    setMaxIntervalHours(8)
    setActiveHoursStart(8)
    setActiveHoursEnd(22)
    setRandomizeMinutes(true)
    setTimezone('America/New_York')
    setAIModel('openai')
    setAutoLike(true)
    setAutoComment(true)
    setLikesPerDay(10)
    setCommentsPerDay(5)
    setCommentOnTypes(['win', 'dream'])
    setEngagementStyle('supportive')
    setGenerateImages(false)
    setImageFrequency('sometimes')
    setPreferredImageStyle('photo')
    setVisualPersona({
      appearance: '',
      style: '',
      clothing: '',
      environment: '',
      photography_style: '',
    })
    setReferenceImageUrl('')
    setGeneratingVisualPersona(false)
    setGeneratingReferenceImage(false)
    setError(null)
    setUsernameError(null)
    onClose()
  }

  const handleGenerateVisualPersona = async () => {
    if (!personaPrompt.trim()) {
      setError('Please fill in the persona prompt first (Step 2)')
      return
    }

    setGeneratingVisualPersona(true)
    setError(null)

    try {
      const response = await fetch('/api/npc/generate-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_visual_persona',
          persona_name: personaName,
          persona_prompt: personaPrompt,
          ai_model: aiModel,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate visual persona')
      }

      if (data.visual_persona) {
        setVisualPersona(data.visual_persona)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate visual persona')
    } finally {
      setGeneratingVisualPersona(false)
    }
  }

  const handleGenerateReferenceImage = async () => {
    if (!editNPC?.id) {
      setError('Please save the NPC first before generating a reference image')
      return
    }

    if (!visualPersona.appearance) {
      setError('Please fill in the visual persona first')
      return
    }

    setGeneratingReferenceImage(true)
    setError(null)

    try {
      const response = await fetch('/api/npc/generate-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_reference_image',
          npc_id: editNPC.id,
          persona_name: personaName,
          visual_persona: visualPersona,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate reference image')
      }

      if (data.reference_image_url) {
        setReferenceImageUrl(data.reference_image_url)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate reference image')
    } finally {
      setGeneratingReferenceImage(false)
    }
  }

  if (!isOpen) return null

  // All steps are visible in both modes now
  const currentDisplayStep = step
  const displayTotalSteps = totalSteps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-border/50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">
                {isEditMode ? 'Edit NPC' : 'Create NPC'}
              </h2>
              <p className="text-sm text-text-secondary">
                Step {currentDisplayStep} of {displayTotalSteps}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-elevated transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 bg-elevated/30">
          <div className="flex gap-2">
            {Array.from({ length: displayTotalSteps }).map((_, i) => (
              <div 
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i + 1 <= currentDisplayStep ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Profile Creation/Edit */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text mb-4">
                  {isEditMode ? 'Edit NPC Profile' : 'Create NPC Profile'}
                </h3>
                <p className="text-sm text-text-secondary mb-6">
                  {isEditMode 
                    ? 'Update the profile information for this NPC'
                    : 'Create a new user account for this NPC'
                  }
                </p>
                
                {/* Username */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text mb-2">
                    Username {!isEditMode && '*'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">@</span>
                    <input
                      type="text"
                      placeholder="npc_username"
                      value={username}
                      onChange={(e) => {
                        if (isEditMode) return // Can't change username in edit mode
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                        setUsername(value)
                        validateUsername(value)
                      }}
                      disabled={isEditMode}
                      className={`w-full h-11 pl-9 pr-4 bg-elevated border rounded-xl text-sm text-text placeholder:text-text-tertiary focus:outline-none transition-colors ${
                        usernameError ? 'border-error focus:border-error' : 'border-border focus:border-primary'
                      } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  {usernameError && !isEditMode && (
                    <p className="text-xs text-error mt-1">{usernameError}</p>
                  )}
                  {isEditMode && (
                    <p className="text-xs text-text-tertiary mt-1">Username cannot be changed</p>
                  )}
                </div>

                {/* Display Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="NPC Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-11 px-4 bg-elevated border border-border rounded-xl text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Bio */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text mb-2">
                    Bio
                  </label>
                  <textarea
                    placeholder="A brief bio for the NPC's profile..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-elevated border border-border rounded-xl text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary resize-none"
                  />
                  <p className="text-xs text-text-tertiary mt-1">{bio.length}/500</p>
                </div>

                {/* Avatar Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text mb-2">
                    Avatar
                  </label>
                  
                  {/* Preview or Drop Zone */}
                  {avatarPreview || avatarUrl ? (
                    <div className="flex items-center gap-4 p-4 bg-elevated rounded-xl border border-border">
                      <div className="w-20 h-20 rounded-full border-2 border-primary overflow-hidden bg-surface flex-shrink-0">
                        <img 
                          src={avatarPreview || avatarUrl} 
                          alt="Avatar preview" 
                          className="w-full h-full object-cover"
                          onError={() => {
                            if (avatarUrl) {
                              setAvatarUrl('')
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-text font-medium mb-1">
                          {avatarFile ? avatarFile.name : 'Image from URL'}
                        </p>
                        <p className="text-xs text-text-tertiary mb-2">
                          {avatarFile 
                            ? `${(avatarFile.size / 1024).toFixed(1)} KB`
                            : avatarUrl
                          }
                        </p>
                        <Button variant="ghost" size="sm" onClick={clearAvatar}>
                          <X size={14} />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                        isDragging 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center">
                          <Upload size={20} className="text-text-tertiary" />
                        </div>
                        <div>
                          <p className="text-sm text-text font-medium">
                            {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
                          </p>
                          <p className="text-xs text-text-tertiary mt-1">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* URL Alternative */}
                  {!avatarPreview && !avatarUrl && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-text-tertiary">or paste URL</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <input
                        type="url"
                        placeholder="https://example.com/avatar.jpg"
                        value={avatarUrl}
                        onChange={(e) => {
                          setAvatarUrl(e.target.value)
                          setAvatarFile(null)
                          setAvatarPreview(null)
                        }}
                        className="w-full h-10 px-4 bg-elevated border border-border rounded-xl text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                      />
                    </div>
                  )}
                </div>

                {/* Profile Tags */}
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    <Tag size={14} className="inline mr-1" />
                    Profile Tags ({profileTags.length}/15)
                  </label>
                  <p className="text-xs text-text-secondary mb-3">
                    Select tags to describe this NPC's interests
                  </p>
                  
                  {/* Selected tags */}
                  {profileTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 p-3 bg-elevated/50 rounded-xl">
                      {profileTags.map((tag) => (
                        <span 
                          key={tag}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm"
                        >
                          {tag}
                          <button 
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-primary/70"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tag Picker Toggle */}
                  <button
                    onClick={() => setShowTagPicker(!showTagPicker)}
                    className="w-full flex items-center justify-between p-3 bg-elevated border border-border rounded-xl text-sm text-text hover:border-primary transition-colors mb-3"
                  >
                    <span className="flex items-center gap-2">
                      <Tag size={16} className="text-text-tertiary" />
                      {showTagPicker ? 'Hide tag picker' : 'Browse all tags'}
                    </span>
                    <ChevronDown size={16} className={`text-text-tertiary transition-transform ${showTagPicker ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Tag Picker */}
                  {showTagPicker && (
                    <div className="border border-border rounded-xl overflow-hidden bg-surface">
                      {/* Search */}
                      <div className="p-3 border-b border-border">
                        <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                          <input
                            type="text"
                            placeholder="Search tags..."
                            value={tagSearch}
                            onChange={(e) => setTagSearch(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-elevated border border-border rounded-lg text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      {/* Categories or Search Results */}
                      <div className="max-h-64 overflow-y-auto">
                        {tagSearch.trim() ? (
                          // Search results
                          <div className="p-3">
                            <div className="flex flex-wrap gap-2">
                              {searchTags(tagSearch).slice(0, 30).map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => {
                                    if (!profileTags.includes(tag) && profileTags.length < 15) {
                                      handleAddTag(tag)
                                    }
                                  }}
                                  disabled={profileTags.includes(tag) || profileTags.length >= 15}
                                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                                    profileTags.includes(tag)
                                      ? 'bg-primary/20 text-primary cursor-default'
                                      : 'bg-elevated text-text-secondary hover:bg-primary/10 hover:text-primary'
                                  }`}
                                >
                                  {profileTags.includes(tag) ? '✓ ' : '+ '}{tag}
                                </button>
                              ))}
                              {searchTags(tagSearch).length === 0 && (
                                <p className="text-sm text-text-tertiary">No tags found</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          // Categories
                          <div>
                            {PROFILE_TAG_CATEGORIES.map((category) => (
                              <div key={category.name} className="border-b border-border/50 last:border-0">
                                <button
                                  onClick={() => {
                                    if (expandedCategories.includes(category.name)) {
                                      setExpandedCategories(expandedCategories.filter(c => c !== category.name))
                                    } else {
                                      setExpandedCategories([...expandedCategories, category.name])
                                    }
                                  }}
                                  className="w-full flex items-center justify-between p-3 text-left hover:bg-elevated/50 transition-colors"
                                >
                                  <span className="text-sm font-medium text-text">{category.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-text-tertiary">{category.tags.length} tags</span>
                                    {expandedCategories.includes(category.name) ? (
                                      <ChevronDown size={14} className="text-text-tertiary" />
                                    ) : (
                                      <ChevronRight size={14} className="text-text-tertiary" />
                                    )}
                                  </div>
                                </button>
                                {expandedCategories.includes(category.name) && (
                                  <div className="px-3 pb-3 flex flex-wrap gap-2">
                                    {category.tags.map((tag) => (
                                      <button
                                        key={tag}
                                        onClick={() => {
                                          if (!profileTags.includes(tag) && profileTags.length < 15) {
                                            handleAddTag(tag)
                                          }
                                        }}
                                        disabled={profileTags.includes(tag) || profileTags.length >= 15}
                                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                                          profileTags.includes(tag)
                                            ? 'bg-primary/20 text-primary cursor-default'
                                            : 'bg-elevated text-text-secondary hover:bg-primary/10 hover:text-primary'
                                        }`}
                                      >
                                        {profileTags.includes(tag) ? '✓ ' : '+ '}{tag}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Custom tag input */}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      placeholder="Or add a custom tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag(tagInput)
                        }
                      }}
                      className="flex-1 h-10 px-4 bg-elevated border border-border rounded-xl text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                    />
                    <Button variant="secondary" size="sm" onClick={() => handleAddTag(tagInput)} disabled={profileTags.length >= 15}>
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: AI Model & Persona */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text mb-4">AI & Persona</h3>
                
                {/* AI Model */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text mb-3">
                    AI Model
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setAIModel('openai')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        aiModel === 'openai'
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-border hover:border-green-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Zap size={24} className="text-green-400" />
                        <div className="text-left">
                          <p className="font-medium text-text">OpenAI</p>
                          <p className="text-xs text-text-secondary">GPT-4o</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setAIModel('claude')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        aiModel === 'claude'
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-border hover:border-orange-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Brain size={24} className="text-orange-400" />
                        <div className="text-left">
                          <p className="font-medium text-text">Claude</p>
                          <p className="text-xs text-text-secondary">Sonnet</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setAIModel('xai')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        aiModel === 'xai'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-border hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles size={24} className="text-blue-400" />
                        <div className="text-left">
                          <p className="font-medium text-text">xAI</p>
                          <p className="text-xs text-text-secondary">Grok</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Temperature / Creativity Slider */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text mb-2">
                    AI Creativity
                  </label>
                  <p className="text-xs text-text-secondary mb-3">
                    Controls how creative vs. predictable the AI responses are. Lower = more focused on the prompt, Higher = more varied and creative.
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-secondary w-16">Focused</span>
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full h-2 bg-elevated rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-xs text-text-tertiary mt-1">
                        <span>0</span>
                        <span>0.5</span>
                        <span>1</span>
                      </div>
                    </div>
                    <span className="text-xs text-text-secondary w-16 text-right">Creative</span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-elevated rounded-lg text-sm">
                      <span className="text-text-secondary">Value:</span>
                      <span className="font-mono font-medium text-primary">{temperature.toFixed(1)}</span>
                    </span>
                  </div>
                </div>

                {/* Persona Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text mb-2">
                    Persona Name *
                  </label>
                  <p className="text-xs text-text-secondary mb-2">
                    A descriptive name for this NPC's character (e.g., "Tech Enthusiast", "Fitness Coach")
                  </p>
                  <input
                    type="text"
                    placeholder="e.g., Tech Enthusiast, Fitness Coach"
                    value={personaName}
                    onChange={(e) => setPersonaName(e.target.value)}
                    className="w-full h-11 px-4 bg-elevated border border-border rounded-xl text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Persona Prompt */}
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Persona Prompt *
                  </label>
                  <p className="text-xs text-text-secondary mb-2">
                    Write a detailed character prompt for the AI. Include personality, background, writing style, and topics they care about.
                  </p>
                  <textarea
                    placeholder={`You are Alex Chen, a 32-year-old startup founder who bootstrapped a SaaS to $2M ARR. You're known for honest, no-BS advice about entrepreneurship. You frequently share lessons from your failures and celebrate others' wins enthusiastically.

Writing style:
- Use casual but smart language
- Share personal anecdotes when relevant
- Ask thoughtful follow-up questions
- Never use corporate jargon
- Occasionally use humor

Topics you care about: bootstrapping, product-market fit, mental health for founders, building in public`}
                    value={personaPrompt}
                    onChange={(e) => setPersonaPrompt(e.target.value)}
                    rows={10}
                    className="w-full px-4 py-3 bg-elevated border border-border rounded-xl text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary resize-none font-mono"
                  />
                  <p className="text-xs text-text-tertiary mt-2">
                    This prompt will be used as the system prompt when generating posts and comments.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Content Config */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text mb-4">Content Configuration</h3>

                {/* Tone Override */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text mb-2">
                    Tone Override
                  </label>
                  <p className="text-xs text-text-secondary mb-3">
                    Optional: Override the tone from the persona prompt
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TONE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTone(option.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          tone === option.value
                            ? 'bg-primary text-white'
                            : 'bg-elevated text-text-secondary hover:bg-elevated/80'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Post Types */}
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Post Types
                  </label>
                  <p className="text-xs text-text-secondary mb-3">
                    Select which types of posts this NPC can create
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {POST_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => togglePostType(option.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          postTypes.includes(option.value)
                            ? option.color
                            : 'bg-elevated text-text-tertiary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Schedule */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text mb-4">Posting Schedule</h3>
                
                {/* Schedule Mode */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text mb-3">
                    Schedule Mode
                  </label>
                  <div className="space-y-2">
                    {SCHEDULE_MODE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setScheduleMode(option.value)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          scheduleMode === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-medium text-text">{option.label}</p>
                        <p className="text-xs text-text-secondary">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode-specific settings */}
                {scheduleMode === 'posts_per_day' && (
                  <div className="mb-6 p-4 bg-elevated rounded-xl">
                    <label className="block text-sm font-medium text-text mb-2">
                      Posts per day
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={postsPerDay}
                        onChange={(e) => setPostsPerDay(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-lg font-semibold text-primary w-8 text-center">{postsPerDay}</span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2">
                      Will post {postsPerDay} time{postsPerDay !== 1 ? 's' : ''} at random moments throughout the day
                    </p>
                  </div>
                )}

                {scheduleMode === 'posts_per_week' && (
                  <div className="mb-6 p-4 bg-elevated rounded-xl">
                    <label className="block text-sm font-medium text-text mb-2">
                      Posts per week
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={1}
                        max={30}
                        value={postsPerWeek}
                        onChange={(e) => setPostsPerWeek(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-lg font-semibold text-primary w-8 text-center">{postsPerWeek}</span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2">
                      Will post {postsPerWeek} time{postsPerWeek !== 1 ? 's' : ''} spread randomly across the week
                    </p>
                  </div>
                )}

                {scheduleMode === 'variable_interval' && (
                  <div className="mb-6 p-4 bg-elevated rounded-xl">
                    <label className="block text-sm font-medium text-text mb-3">
                      Post every X-Y hours
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-text-tertiary">Min hours</label>
                        <input
                          type="number"
                          min={1}
                          max={maxIntervalHours - 1}
                          value={minIntervalHours}
                          onChange={(e) => setMinIntervalHours(Math.min(parseInt(e.target.value) || 1, maxIntervalHours - 1))}
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"
                        />
                      </div>
                      <span className="text-text-tertiary mt-4">to</span>
                      <div className="flex-1">
                        <label className="text-xs text-text-tertiary">Max hours</label>
                        <input
                          type="number"
                          min={minIntervalHours + 1}
                          max={48}
                          value={maxIntervalHours}
                          onChange={(e) => setMaxIntervalHours(Math.max(parseInt(e.target.value) || 2, minIntervalHours + 1))}
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2">
                      Will post every {minIntervalHours}-{maxIntervalHours} hours randomly
                    </p>
                  </div>
                )}

                {/* Active Hours */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text mb-3">
                    Active Hours
                  </label>
                  <p className="text-xs text-text-secondary mb-3">
                    Only post during these hours (prevents late night posts)
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-text-tertiary">Start</label>
                      <select
                        value={activeHoursStart}
                        onChange={(e) => setActiveHoursStart(parseInt(e.target.value))}
                        className="w-full h-10 px-3 bg-elevated border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="text-text-tertiary mt-4">to</span>
                    <div className="flex-1">
                      <label className="text-xs text-text-tertiary">End</label>
                      <select
                        value={activeHoursEnd}
                        onChange={(e) => setActiveHoursEnd(parseInt(e.target.value))}
                        className="w-full h-10 px-3 bg-elevated border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Randomize Minutes */}
                <div className="mb-6 p-4 bg-elevated rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text">Randomize Minutes</p>
                      <p className="text-xs text-text-secondary">Add random minutes (0-59) to each scheduled time</p>
                    </div>
                    <button
                      onClick={() => setRandomizeMinutes(!randomizeMinutes)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        randomizeMinutes ? 'bg-primary' : 'bg-border'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        randomizeMinutes ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-11 px-4 bg-elevated border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Engagement */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text mb-4">Engagement Settings</h3>
                
                {/* Auto Like */}
                <div className="mb-6 p-4 bg-elevated rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-text">Auto-Like Posts</p>
                      <p className="text-xs text-text-secondary">Automatically like posts from other users</p>
                    </div>
                    <button
                      onClick={() => setAutoLike(!autoLike)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        autoLike ? 'bg-primary' : 'bg-border'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        autoLike ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  {autoLike && (
                    <div>
                      <label className="text-xs text-text-secondary">Likes per day</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={likesPerDay}
                        onChange={(e) => setLikesPerDay(parseInt(e.target.value) || 10)}
                        className="w-full h-10 px-3 mt-1 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"
                      />
                    </div>
                  )}
                </div>

                {/* Auto Comment */}
                <div className="mb-6 p-4 bg-elevated rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-text">Auto-Comment on Posts</p>
                      <p className="text-xs text-text-secondary">Generate and post AI comments</p>
                    </div>
                    <button
                      onClick={() => setAutoComment(!autoComment)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        autoComment ? 'bg-primary' : 'bg-border'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        autoComment ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  {autoComment && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-text-secondary">Comments per day</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={commentsPerDay}
                          onChange={(e) => setCommentsPerDay(parseInt(e.target.value) || 5)}
                          className="w-full h-10 px-3 mt-1 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-secondary mb-2 block">Comment on post types</label>
                        <div className="flex flex-wrap gap-2">
                          {POST_TYPE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => toggleCommentOnType(option.value)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                commentOnTypes.includes(option.value)
                                  ? option.color
                                  : 'bg-surface text-text-tertiary'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Engagement Style */}
                {autoComment && (
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Engagement Style
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ENGAGEMENT_STYLE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setEngagementStyle(option.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            engagementStyle === option.value
                              ? 'bg-primary text-white'
                              : 'bg-elevated text-text-secondary hover:bg-elevated/80'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Image Generation */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text mb-2">Image Generation</h3>
                <p className="text-sm text-text-secondary mb-6">
                  Configure AI-generated images for this NPC's posts. Requires GEMINI_API_KEY.
                </p>
                
                {/* Enable/Disable */}
                <div className="mb-6 p-4 bg-elevated rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Image size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-text">Generate Images with Posts</p>
                        <p className="text-xs text-text-secondary">AI will create images to accompany posts</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setGenerateImages(!generateImages)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        generateImages ? 'bg-primary' : 'bg-border'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        generateImages ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                {generateImages && (
                  <>
                    {/* Image Frequency */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-text mb-3">
                        Image Frequency
                      </label>
                      <div className="space-y-2">
                        {IMAGE_FREQUENCY_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setImageFrequency(option.value)}
                            className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                              imageFrequency === option.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <p className="font-medium text-text">{option.label}</p>
                            <p className="text-xs text-text-secondary">{option.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image Style */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-text mb-3">
                        Preferred Image Style
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {IMAGE_STYLE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setPreferredImageStyle(option.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              preferredImageStyle === option.value
                                ? 'bg-primary text-white'
                                : 'bg-elevated text-text-secondary hover:bg-elevated/80'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Visual Persona */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-text">
                          Visual Persona
                        </label>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleGenerateVisualPersona}
                          disabled={generatingVisualPersona || !personaPrompt.trim()}
                        >
                          {generatingVisualPersona ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Wand2 size={14} />
                              Generate with AI
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-text-secondary mb-4">
                        Describe the character's visual appearance for consistent image generation. Use the AI button to auto-generate from the persona prompt.
                      </p>
                      
                      <div className="space-y-4 p-4 bg-elevated rounded-xl">
                        <div>
                          <label className="block text-xs text-text-secondary mb-1">Appearance</label>
                          <input
                            type="text"
                            placeholder="e.g., 30s professional woman, warm brown skin, short natural curly hair"
                            value={visualPersona.appearance}
                            onChange={(e) => setVisualPersona({ ...visualPersona, appearance: e.target.value })}
                            className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-secondary mb-1">Style</label>
                          <input
                            type="text"
                            placeholder="e.g., clean, modern, minimalist aesthetic"
                            value={visualPersona.style}
                            onChange={(e) => setVisualPersona({ ...visualPersona, style: e.target.value })}
                            className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-secondary mb-1">Clothing</label>
                          <input
                            type="text"
                            placeholder="e.g., usually wears blazers, neutral tones, subtle gold jewelry"
                            value={visualPersona.clothing}
                            onChange={(e) => setVisualPersona({ ...visualPersona, clothing: e.target.value })}
                            className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-secondary mb-1">Environment</label>
                          <input
                            type="text"
                            placeholder="e.g., modern office spaces, coffee shops, urban settings"
                            value={visualPersona.environment}
                            onChange={(e) => setVisualPersona({ ...visualPersona, environment: e.target.value })}
                            className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-secondary mb-1">Photography Style</label>
                          <input
                            type="text"
                            placeholder="e.g., candid, natural lighting, shallow depth of field"
                            value={visualPersona.photography_style}
                            onChange={(e) => setVisualPersona({ ...visualPersona, photography_style: e.target.value })}
                            className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reference Image URL */}
                    {/* Reference Image */}
                    <div className="p-4 bg-elevated rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <label className="block text-sm font-medium text-text">
                            Reference Image
                          </label>
                          <p className="text-xs text-text-secondary">
                            Used for character consistency across generated images
                          </p>
                        </div>
                        {isEditMode && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleGenerateReferenceImage}
                            disabled={generatingReferenceImage || !visualPersona.appearance}
                          >
                            {generatingReferenceImage ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Wand2 size={14} />
                                Generate Reference
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {referenceImageUrl ? (
                        <div className="flex items-start gap-4">
                          <div className="w-24 h-24 rounded-xl border-2 border-primary overflow-hidden bg-surface flex-shrink-0">
                            <img 
                              src={referenceImageUrl} 
                              alt="Reference" 
                              className="w-full h-full object-cover"
                              onError={() => setReferenceImageUrl('')}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-text font-medium mb-1">Reference Image Set</p>
                            <p className="text-xs text-text-tertiary mb-2 break-all">
                              {referenceImageUrl.length > 50 
                                ? referenceImageUrl.substring(0, 50) + '...' 
                                : referenceImageUrl}
                            </p>
                            <Button variant="ghost" size="sm" onClick={() => setReferenceImageUrl('')}>
                              <X size={14} />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-text-tertiary mb-3">
                            {isEditMode 
                              ? 'Click "Generate Reference" to create a base image, or paste a URL below.'
                              : 'Save the NPC first, then generate a reference image for consistency.'}
                          </p>
                          <input
                            type="url"
                            placeholder="Or paste image URL: https://example.com/reference.jpg"
                            value={referenceImageUrl}
                            onChange={(e) => setReferenceImageUrl(e.target.value)}
                            className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-surface/50">
          <Button 
            variant="ghost" 
            onClick={() => {
              if (isEditMode && step === 2) {
                handleClose()
              } else if (step > 1) {
                setStep(step - 1)
              } else {
                handleClose()
              }
            }}
          >
            {(isEditMode && step === 2) || step === 1 ? 'Cancel' : 'Back'}
          </Button>
          <div className="flex gap-3">
            {step < totalSteps ? (
              <Button 
                variant="primary" 
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Continue
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Creating...' : isEditMode ? 'Update NPC' : 'Create NPC'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
