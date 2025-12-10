import { supabase, supabaseAdmin, isSupabaseConfigured, isServiceRoleConfigured } from './supabase'

// Use admin client for NPC queries (bypasses RLS)
const getClient = () => {
  if (isServiceRoleConfigured && supabaseAdmin) {
    return supabaseAdmin
  }
  return supabase
}

// =====================================================
// Types
// =====================================================

export type AIModel = 'openai' | 'claude' | 'xai'
export type Tone = 'professional' | 'casual' | 'inspirational' | 'humorous' | 'motivational' | 'friendly'
export type PostingFrequency = 'hourly' | 'twice_daily' | 'daily' | 'weekly' | 'custom'
export type ScheduleMode = 'posts_per_day' | 'posts_per_week' | 'variable_interval'
export type PostType = 'win' | 'dream' | 'ask' | 'hangout' | 'intro' | 'general'
export type QueueStatus = 'pending' | 'published' | 'failed' | 'cancelled'
export type EngagementStyle = 'supportive' | 'curious' | 'enthusiastic' | 'thoughtful'

export interface ActiveHours {
  start: number // Hour of day (0-23)
  end: number   // Hour of day (0-23)
}

export interface PostingTimes {
  // Legacy fields (kept for backwards compatibility)
  hours?: number[]
  
  // New schedule mode
  mode?: ScheduleMode
  
  // Posts per day mode: post X times randomly throughout the day
  posts_per_day?: number
  
  // Posts per week mode: post X times randomly throughout the week
  posts_per_week?: number
  
  // Variable interval mode: post every X-Y hours
  min_interval_hours?: number
  max_interval_hours?: number
  
  // Active hours window (don't post outside these hours)
  active_hours?: ActiveHours
  
  // Add random minutes to scheduled times (0-59)
  randomize_minutes?: boolean
  
  // Timezone for all calculations
  timezone: string
}

export interface EngagementSettings {
  auto_like: boolean
  auto_comment: boolean
  likes_per_day: number
  comments_per_day: number
  comment_on_types: PostType[]
  engagement_style: EngagementStyle
}

export interface NPCProfile {
  id: string
  user_id: string
  ai_model: AIModel
  temperature: number // AI creativity/randomness (0.0-1.0)
  persona_name: string
  persona_description: string | null // Deprecated: Use persona_prompt
  persona_prompt: string | null // Full character prompt for AI generation
  topics: string[] // Deprecated: Use persona_prompt
  tone: Tone
  post_types: PostType[]
  posting_frequency: PostingFrequency
  posting_times: PostingTimes
  custom_cron: string | null
  engagement_settings: EngagementSettings
  is_active: boolean
  last_activity_at: string | null
  last_post_at: string | null
  last_engagement_at: string | null
  total_posts_generated: number
  total_likes_given: number
  total_comments_given: number
  created_at: string
  updated_at: string
  // Joined profile data
  profile?: {
    username: string
    full_name: string | null
    avatar_url: string | null
    email: string | null
    bio: string | null
    tags: string[] | null
  }
}

export interface NPCPostQueueItem {
  id: string
  npc_id: string
  content: string
  post_type: PostType
  image_url: string | null
  scheduled_for: string
  status: QueueStatus
  published_post_id: string | null
  error_message: string | null
  generation_prompt: string | null
  ai_model_used: string | null
  created_at: string
  published_at: string | null
  // Joined NPC data
  npc_profile?: {
    persona_name: string
    user_id: string
  }
}

export interface NPCEngagementLog {
  id: string
  npc_id: string
  action_type: 'like' | 'comment'
  target_post_id: string | null
  target_comment_id: string | null
  comment_content: string | null
  created_comment_id: string | null
  status: 'completed' | 'failed'
  error_message: string | null
  created_at: string
}

export interface CreateNPCData {
  user_id: string
  ai_model: AIModel
  temperature?: number // AI creativity/randomness (0.0-1.0), defaults to 0.8
  persona_name: string
  persona_description?: string // Deprecated: Use persona_prompt
  persona_prompt?: string // Full character prompt for AI generation
  topics?: string[] // Deprecated: Use persona_prompt
  tone: Tone
  post_types: PostType[]
  posting_frequency: PostingFrequency
  posting_times?: PostingTimes
  custom_cron?: string
  engagement_settings?: Partial<EngagementSettings>
  is_active?: boolean
}

export interface UpdateNPCData {
  ai_model?: AIModel
  temperature?: number // AI creativity/randomness (0.0-1.0)
  persona_name?: string
  persona_description?: string // Deprecated: Use persona_prompt
  persona_prompt?: string // Full character prompt for AI generation
  topics?: string[] // Deprecated: Use persona_prompt
  tone?: Tone
  post_types?: PostType[]
  posting_frequency?: PostingFrequency
  posting_times?: PostingTimes
  custom_cron?: string
  engagement_settings?: Partial<EngagementSettings>
  is_active?: boolean
}

export interface NPCListOptions {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  aiModel?: AIModel
  sortBy?: 'newest' | 'oldest' | 'most_posts' | 'most_active' | 'name'
}

export interface NPCStats {
  total: number
  active: number
  inactive: number
  totalPostsGenerated: number
  totalLikesGiven: number
  totalCommentsGiven: number
  pendingQueueItems: number
  byModel: {
    openai: number
    claude: number
    xai: number
  }
}

// =====================================================
// NPC CRUD Operations
// =====================================================

export async function getNPCs(options: NPCListOptions = {}): Promise<{
  npcs: NPCProfile[]
  total: number
  totalPages: number
}> {
  const client = getClient()
  if (!client) {
    return { npcs: [], total: 0, totalPages: 0 }
  }

  const { page = 1, limit = 10, search, isActive, aiModel, sortBy = 'newest' } = options
  const offset = (page - 1) * limit

  let query = client
    .from('npc_profiles')
    .select(`
      *,
      profile:profiles!npc_profiles_user_id_fkey (
        username,
        full_name,
        avatar_url,
        email,
        bio,
        tags
      )
    `, { count: 'exact' })

  // Filters
  if (isActive !== undefined) {
    query = query.eq('is_active', isActive)
  }

  if (aiModel) {
    query = query.eq('ai_model', aiModel)
  }

  if (search) {
    query = query.or(`persona_name.ilike.%${search}%,persona_description.ilike.%${search}%`)
  }

  // Sorting
  switch (sortBy) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'most_posts':
      query = query.order('total_posts_generated', { ascending: false })
      break
    case 'most_active':
      query = query.order('last_activity_at', { ascending: false, nullsFirst: false })
      break
    case 'name':
      query = query.order('persona_name', { ascending: true })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching NPCs:', error)
    return { npcs: [], total: 0, totalPages: 0 }
  }

  return {
    npcs: data as NPCProfile[],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function getNPCById(id: string): Promise<NPCProfile | null> {
  const client = getClient()
  if (!client) return null

  const { data, error } = await client
    .from('npc_profiles')
    .select(`
      *,
      profile:profiles!npc_profiles_user_id_fkey (
        username,
        full_name,
        avatar_url,
        email,
        bio,
        tags
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching NPC:', error)
    return null
  }

  return data as NPCProfile
}

export async function getNPCByUserId(userId: string): Promise<NPCProfile | null> {
  const client = getClient()
  if (!client) return null

  const { data, error } = await client
    .from('npc_profiles')
    .select(`
      *,
      profile:profiles!npc_profiles_user_id_fkey (
        username,
        full_name,
        avatar_url,
        email,
        bio,
        tags
      )
    `)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') { // Not found is ok
      console.error('Error fetching NPC by user:', error)
    }
    return null
  }

  return data as NPCProfile
}

export async function createNPC(data: CreateNPCData): Promise<NPCProfile | null> {
  const client = getClient()
  if (!client) return null

  const defaultEngagementSettings: EngagementSettings = {
    auto_like: true,
    auto_comment: true,
    likes_per_day: 10,
    comments_per_day: 5,
    comment_on_types: ['win', 'dream'],
    engagement_style: 'supportive',
  }

  const defaultPostingTimes: PostingTimes = {
    mode: 'posts_per_day',
    posts_per_day: 3,
    active_hours: { start: 8, end: 22 },
    randomize_minutes: true,
    timezone: 'America/New_York',
  }

  const insertData = {
    ...data,
    posting_times: data.posting_times || defaultPostingTimes,
    engagement_settings: { ...defaultEngagementSettings, ...data.engagement_settings },
  }

  const { data: npc, error } = await client
    .from('npc_profiles')
    .insert(insertData)
    .select(`
      *,
      profile:profiles!npc_profiles_user_id_fkey (
        username,
        full_name,
        avatar_url,
        email,
        bio,
        tags
      )
    `)
    .single()

  if (error) {
    console.error('Error creating NPC:', error)
    return null
  }

  return npc as NPCProfile
}

export async function updateNPC(id: string, data: UpdateNPCData): Promise<NPCProfile | null> {
  const client = getClient()
  if (!client) return null

  // DEBUG: Log what we're sending to Supabase
  console.log('=== UPDATE NPC DEBUG ===')
  console.log('NPC ID:', id)
  console.log('Update data keys:', Object.keys(data))
  console.log('Has persona_prompt:', 'persona_prompt' in data)
  console.log('persona_prompt value:', data.persona_prompt?.substring(0, 100) || 'NOT IN DATA')
  console.log('========================')

  const { data: npc, error } = await client
    .from('npc_profiles')
    .update(data)
    .eq('id', id)
    .select(`
      *,
      profile:profiles!npc_profiles_user_id_fkey (
        username,
        full_name,
        avatar_url,
        email,
        bio,
        tags
      )
    `)
    .single()

  if (error) {
    console.error('Error updating NPC:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return null
  }

  // DEBUG: Log what came back
  console.log('=== UPDATE NPC RESULT ===')
  console.log('Returned persona_prompt:', npc?.persona_prompt?.substring(0, 100) || 'NULL/UNDEFINED')
  console.log('=========================')

  return npc as NPCProfile
}

export async function deleteNPC(id: string): Promise<boolean> {
  const client = getClient()
  if (!client) return false

  const { error } = await client
    .from('npc_profiles')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting NPC:', error)
    return false
  }

  return true
}

export async function toggleNPCActive(id: string, isActive: boolean): Promise<boolean> {
  const client = getClient()
  if (!client) return false

  const { error } = await client
    .from('npc_profiles')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    console.error('Error toggling NPC active:', error)
    return false
  }

  return true
}

// =====================================================
// NPC Stats
// =====================================================

export async function getNPCStats(): Promise<NPCStats> {
  const client = getClient()
  if (!client) {
    return {
      total: 0,
      active: 0,
      inactive: 0,
      totalPostsGenerated: 0,
      totalLikesGiven: 0,
      totalCommentsGiven: 0,
      pendingQueueItems: 0,
      byModel: { openai: 0, claude: 0, xai: 0 },
    }
  }

  // Get all NPCs with aggregates
  const { data: npcs, error } = await client
    .from('npc_profiles')
    .select('is_active, ai_model, total_posts_generated, total_likes_given, total_comments_given')

  if (error) {
    console.error('Error fetching NPC stats:', error)
    return {
      total: 0,
      active: 0,
      inactive: 0,
      totalPostsGenerated: 0,
      totalLikesGiven: 0,
      totalCommentsGiven: 0,
      pendingQueueItems: 0,
      byModel: { openai: 0, claude: 0, xai: 0 },
    }
  }

  // Get pending queue count
  const { count: pendingCount } = await client
    .from('npc_post_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const stats = (npcs || []).reduce(
    (acc, npc) => {
      acc.total++
      if (npc.is_active) acc.active++
      else acc.inactive++
      acc.totalPostsGenerated += npc.total_posts_generated || 0
      acc.totalLikesGiven += npc.total_likes_given || 0
      acc.totalCommentsGiven += npc.total_comments_given || 0
      if (npc.ai_model === 'openai') acc.byModel.openai++
      else if (npc.ai_model === 'claude') acc.byModel.claude++
      else if (npc.ai_model === 'xai') acc.byModel.xai++
      return acc
    },
    {
      total: 0,
      active: 0,
      inactive: 0,
      totalPostsGenerated: 0,
      totalLikesGiven: 0,
      totalCommentsGiven: 0,
      pendingQueueItems: pendingCount || 0,
      byModel: { openai: 0, claude: 0, xai: 0 },
    }
  )

  return stats
}

// =====================================================
// Post Queue Operations
// =====================================================

export async function getQueueItems(options: {
  npcId?: string
  status?: QueueStatus
  limit?: number
  page?: number
} = {}): Promise<{ items: NPCPostQueueItem[]; total: number }> {
  if (!getClient()) {
    return { items: [], total: 0 }
  }

  const { npcId, status, limit = 20, page = 1 } = options
  const offset = (page - 1) * limit
  const client = getClient()!

  let query = client
    .from('npc_post_queue')
    .select(`
      *,
      npc_profile:npc_profiles!npc_post_queue_npc_id_fkey (
        persona_name,
        user_id
      )
    `, { count: 'exact' })

  if (npcId) {
    query = query.eq('npc_id', npcId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  query = query
    .order('scheduled_for', { ascending: true })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching queue items:', error)
    return { items: [], total: 0 }
  }

  return {
    items: data as NPCPostQueueItem[],
    total: count || 0,
  }
}

export async function getPendingQueueItems(beforeTime?: Date): Promise<NPCPostQueueItem[]> {
  const client = getClient()
  if (!client) return []

  const targetTime = beforeTime || new Date()

  const { data, error } = await client
    .from('npc_post_queue')
    .select(`
      *,
      npc_profile:npc_profiles!npc_post_queue_npc_id_fkey (
        persona_name,
        user_id
      )
    `)
    .eq('status', 'pending')
    .lte('scheduled_for', targetTime.toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(10) // Process in batches

  if (error) {
    console.error('Error fetching pending queue items:', error)
    return []
  }

  return data as NPCPostQueueItem[]
}

export async function addToQueue(item: {
  npc_id: string
  content: string
  post_type: PostType
  scheduled_for: Date
  generation_prompt?: string
  ai_model_used?: string
  image_url?: string
}): Promise<NPCPostQueueItem | null> {
  const client = getClient()
  if (!client) return null

  const { data, error } = await client
    .from('npc_post_queue')
    .insert({
      ...item,
      scheduled_for: item.scheduled_for.toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding to queue:', error)
    return null
  }

  return data as NPCPostQueueItem
}

export async function updateQueueItem(
  id: string,
  updates: {
    status?: QueueStatus
    published_post_id?: string
    error_message?: string
    published_at?: Date
  }
): Promise<boolean> {
  const client = getClient()
  if (!client) return false

  const updateData: Record<string, unknown> = { ...updates }
  if (updates.published_at) {
    updateData.published_at = updates.published_at.toISOString()
  }

  const { error } = await client
    .from('npc_post_queue')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating queue item:', error)
    return false
  }

  return true
}

export async function cancelQueueItem(id: string): Promise<boolean> {
  return updateQueueItem(id, { status: 'cancelled' })
}

export async function deleteQueueItem(id: string): Promise<boolean> {
  const client = getClient()
  if (!client) return false

  const { error } = await client
    .from('npc_post_queue')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting queue item:', error)
    return false
  }

  return true
}

export async function bulkDeleteQueueItems(ids: string[]): Promise<boolean> {
  const client = getClient()
  if (!client) return false

  if (ids.length === 0) return true

  const { error } = await client
    .from('npc_post_queue')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Error bulk deleting queue items:', error)
    return false
  }

  return true
}

// =====================================================
// Engagement Log Operations
// =====================================================

export async function getEngagementLogs(options: {
  npcId?: string
  actionType?: 'like' | 'comment'
  limit?: number
  page?: number
} = {}): Promise<{ logs: NPCEngagementLog[]; total: number }> {
  const client = getClient()
  if (!client) {
    return { logs: [], total: 0 }
  }

  const { npcId, actionType, limit = 20, page = 1 } = options
  const offset = (page - 1) * limit

  let query = client
    .from('npc_engagement_log')
    .select('*', { count: 'exact' })

  if (npcId) {
    query = query.eq('npc_id', npcId)
  }

  if (actionType) {
    query = query.eq('action_type', actionType)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching engagement logs:', error)
    return { logs: [], total: 0 }
  }

  return {
    logs: data as NPCEngagementLog[],
    total: count || 0,
  }
}

export async function logEngagement(log: {
  npc_id: string
  action_type: 'like' | 'comment'
  target_post_id?: string
  target_comment_id?: string
  comment_content?: string
  created_comment_id?: string
  status: 'completed' | 'failed'
  error_message?: string
}): Promise<boolean> {
  const client = getClient()
  if (!client) return false

  const { error } = await client
    .from('npc_engagement_log')
    .insert(log)

  if (error) {
    console.error('Error logging engagement:', error)
    return false
  }

  return true
}

// =====================================================
// Helper: Update NPC activity timestamp
// =====================================================

export async function updateNPCActivity(
  npcId: string,
  activityType: 'post' | 'engagement'
): Promise<boolean> {
  const client = getClient()
  if (!client) return false

  const now = new Date().toISOString()
  const updates: Record<string, string> = {
    last_activity_at: now,
  }

  if (activityType === 'post') {
    updates.last_post_at = now
  } else {
    updates.last_engagement_at = now
  }

  const { error } = await client
    .from('npc_profiles')
    .update(updates)
    .eq('id', npcId)

  if (error) {
    console.error('Error updating NPC activity:', error)
    return false
  }

  return true
}

// =====================================================
// Helper: Increment NPC stats
// =====================================================

export async function incrementNPCStat(
  npcId: string,
  stat: 'total_posts_generated' | 'total_likes_given' | 'total_comments_given',
  amount: number = 1
): Promise<boolean> {
  const client = getClient()
  if (!client) return false

  const { data: npc, error: fetchError } = await client
    .from('npc_profiles')
    .select(stat)
    .eq('id', npcId)
    .single()

  if (fetchError) {
    console.error('Error fetching NPC for stat update:', fetchError)
    return false
  }

  const currentValue = (npc as Record<string, number>)[stat] || 0

  const { error } = await client
    .from('npc_profiles')
    .update({ [stat]: currentValue + amount })
    .eq('id', npcId)

  if (error) {
    console.error('Error incrementing NPC stat:', error)
    return false
  }

  return true
}

// =====================================================
// Get active NPCs for processing
// =====================================================

export async function getActiveNPCsForProcessing(): Promise<NPCProfile[]> {
  const client = getClient()
  if (!client) return []

  const { data, error } = await client
    .from('npc_profiles')
    .select(`
      *,
      profile:profiles!npc_profiles_user_id_fkey (
        username,
        full_name,
        avatar_url,
        email,
        bio,
        tags
      )
    `)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching active NPCs:', error)
    return []
  }

  return data as NPCProfile[]
}

// =====================================================
// Get today's engagement count for an NPC
// =====================================================

export async function getTodayEngagementCount(
  npcId: string,
  actionType: 'like' | 'comment'
): Promise<number> {
  const client = getClient()
  if (!client) return 0

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const { count, error } = await client
    .from('npc_engagement_log')
    .select('*', { count: 'exact', head: true })
    .eq('npc_id', npcId)
    .eq('action_type', actionType)
    .eq('status', 'completed')
    .gte('created_at', startOfToday.toISOString())

  if (error) {
    console.error('Error fetching engagement count:', error)
    return 0
  }

  return count || 0
}

