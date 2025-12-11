-- Add xAI as an allowed AI model option
-- Run this in your Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE npc_profiles DROP CONSTRAINT IF EXISTS npc_profiles_ai_model_check;

-- Add the new constraint with xai included
ALTER TABLE npc_profiles 
ADD CONSTRAINT npc_profiles_ai_model_check 
CHECK (ai_model IN ('openai', 'claude', 'xai'));

-- Add comment
COMMENT ON COLUMN npc_profiles.ai_model IS 'AI model provider: openai (GPT-4o), claude (Sonnet), or xai (Grok)';

