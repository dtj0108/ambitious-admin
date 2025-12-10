-- NPC (AI-powered user) Management Tables
-- Run this migration in Supabase SQL Editor

-- =====================================================
-- NPC Profiles Table - Configuration for each NPC
-- =====================================================
CREATE TABLE IF NOT EXISTS npc_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- AI Configuration
    ai_model TEXT NOT NULL DEFAULT 'openai' CHECK (ai_model IN ('openai', 'claude')),
    
    -- Persona Configuration
    persona_name TEXT NOT NULL,
    persona_description TEXT, -- Deprecated: Use persona_prompt instead
    persona_prompt TEXT, -- Full character prompt for AI generation
    topics TEXT[] DEFAULT '{}', -- Deprecated: Use persona_prompt instead
    tone TEXT DEFAULT 'casual' CHECK (tone IN ('professional', 'casual', 'inspirational', 'humorous', 'motivational', 'friendly')),
    post_types TEXT[] DEFAULT ARRAY['general'] CHECK (post_types <@ ARRAY['win', 'dream', 'ask', 'hangout', 'intro', 'general']),
    
    -- Posting Schedule
    posting_frequency TEXT DEFAULT 'daily' CHECK (posting_frequency IN ('hourly', 'twice_daily', 'daily', 'weekly', 'custom')),
    posting_times JSONB DEFAULT '{"hours": [9, 12, 18], "timezone": "America/New_York"}'::jsonb,
    custom_cron TEXT, -- For custom frequency
    
    -- Engagement Settings
    engagement_settings JSONB DEFAULT '{
        "auto_like": true,
        "auto_comment": true,
        "likes_per_day": 10,
        "comments_per_day": 5,
        "comment_on_types": ["win", "dream"],
        "engagement_style": "supportive"
    }'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_activity_at TIMESTAMPTZ,
    last_post_at TIMESTAMPTZ,
    last_engagement_at TIMESTAMPTZ,
    
    -- Stats
    total_posts_generated INTEGER DEFAULT 0,
    total_likes_given INTEGER DEFAULT 0,
    total_comments_given INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one NPC config per user
    UNIQUE(user_id)
);

-- =====================================================
-- NPC Post Queue - Scheduled/pending posts
-- =====================================================
CREATE TABLE IF NOT EXISTS npc_post_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npc_id UUID NOT NULL REFERENCES npc_profiles(id) ON DELETE CASCADE,
    
    -- Post Content
    content TEXT NOT NULL,
    post_type TEXT NOT NULL DEFAULT 'general' CHECK (post_type IN ('win', 'dream', 'ask', 'hangout', 'intro', 'general')),
    image_url TEXT,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed', 'cancelled')),
    published_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    error_message TEXT,
    
    -- Generation metadata
    generation_prompt TEXT,
    ai_model_used TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- =====================================================
-- NPC Engagement Log - Track likes/comments by NPCs
-- =====================================================
CREATE TABLE IF NOT EXISTS npc_engagement_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npc_id UUID NOT NULL REFERENCES npc_profiles(id) ON DELETE CASCADE,
    
    -- Action details
    action_type TEXT NOT NULL CHECK (action_type IN ('like', 'comment')),
    target_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    target_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    
    -- For comments, store the generated content
    comment_content TEXT,
    created_comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
    
    -- Status
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed')),
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- NPC Profiles indexes
CREATE INDEX IF NOT EXISTS idx_npc_profiles_user_id ON npc_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_npc_profiles_is_active ON npc_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_npc_profiles_last_activity ON npc_profiles(last_activity_at);

-- NPC Post Queue indexes
CREATE INDEX IF NOT EXISTS idx_npc_post_queue_npc_id ON npc_post_queue(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_post_queue_status ON npc_post_queue(status);
CREATE INDEX IF NOT EXISTS idx_npc_post_queue_scheduled ON npc_post_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_npc_post_queue_pending ON npc_post_queue(npc_id, status) WHERE status = 'pending';

-- NPC Engagement Log indexes
CREATE INDEX IF NOT EXISTS idx_npc_engagement_log_npc_id ON npc_engagement_log(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_engagement_log_created ON npc_engagement_log(created_at);

-- =====================================================
-- Updated_at trigger
-- =====================================================
CREATE OR REPLACE FUNCTION update_npc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_npc_profiles_updated_at
    BEFORE UPDATE ON npc_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_npc_updated_at();

-- =====================================================
-- RLS Policies (Admin access only via service role)
-- =====================================================

ALTER TABLE npc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_post_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_engagement_log ENABLE ROW LEVEL SECURITY;

-- Service role bypass for admin operations
CREATE POLICY "Service role full access on npc_profiles" ON npc_profiles
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on npc_post_queue" ON npc_post_queue
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on npc_engagement_log" ON npc_engagement_log
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- Helper function to get next scheduled post time
-- =====================================================
CREATE OR REPLACE FUNCTION get_next_post_time(
    p_frequency TEXT,
    p_posting_times JSONB,
    p_custom_cron TEXT DEFAULT NULL
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_hours INTEGER[];
    v_timezone TEXT;
    v_now TIMESTAMPTZ;
    v_next_time TIMESTAMPTZ;
    v_hour INTEGER;
BEGIN
    -- Get timezone from posting_times or default
    v_timezone := COALESCE(p_posting_times->>'timezone', 'America/New_York');
    v_now := NOW() AT TIME ZONE v_timezone;
    
    CASE p_frequency
        WHEN 'hourly' THEN
            v_next_time := (v_now + INTERVAL '1 hour')::TIMESTAMPTZ;
        WHEN 'twice_daily' THEN
            -- Default to 9am and 6pm
            v_hours := ARRAY[9, 18];
            v_next_time := NULL;
            FOREACH v_hour IN ARRAY v_hours LOOP
                IF EXTRACT(HOUR FROM v_now) < v_hour THEN
                    v_next_time := DATE_TRUNC('day', v_now) + (v_hour || ' hours')::INTERVAL;
                    EXIT;
                END IF;
            END LOOP;
            IF v_next_time IS NULL THEN
                v_next_time := DATE_TRUNC('day', v_now) + INTERVAL '1 day' + (v_hours[1] || ' hours')::INTERVAL;
            END IF;
        WHEN 'daily' THEN
            -- Use first hour from posting_times or default to 9am
            v_hour := COALESCE((p_posting_times->'hours'->>0)::INTEGER, 9);
            IF EXTRACT(HOUR FROM v_now) >= v_hour THEN
                v_next_time := DATE_TRUNC('day', v_now) + INTERVAL '1 day' + (v_hour || ' hours')::INTERVAL;
            ELSE
                v_next_time := DATE_TRUNC('day', v_now) + (v_hour || ' hours')::INTERVAL;
            END IF;
        WHEN 'weekly' THEN
            v_hour := COALESCE((p_posting_times->'hours'->>0)::INTEGER, 9);
            v_next_time := DATE_TRUNC('week', v_now) + INTERVAL '1 week' + (v_hour || ' hours')::INTERVAL;
        ELSE
            -- Default to next day at 9am
            v_next_time := DATE_TRUNC('day', v_now) + INTERVAL '1 day 9 hours';
    END CASE;
    
    RETURN v_next_time AT TIME ZONE v_timezone;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Mark profiles as bot when NPC is created
-- =====================================================
CREATE OR REPLACE FUNCTION mark_profile_as_bot()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles SET is_bot = true WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_profile_as_bot
    AFTER INSERT ON npc_profiles
    FOR EACH ROW
    EXECUTE FUNCTION mark_profile_as_bot();

