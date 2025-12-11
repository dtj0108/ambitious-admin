-- Add persona_prompt column to npc_profiles table
-- This is the full character prompt used for AI content generation

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'npc_profiles' AND column_name = 'persona_prompt'
    ) THEN
        ALTER TABLE npc_profiles ADD COLUMN persona_prompt TEXT;
    END IF;
END $$;

-- Add comment explaining the column
COMMENT ON COLUMN npc_profiles.persona_prompt IS 'Full character prompt for AI content generation. Replaces persona_description and topics.';
COMMENT ON COLUMN npc_profiles.persona_description IS 'DEPRECATED: Use persona_prompt instead. Kept for backwards compatibility.';
COMMENT ON COLUMN npc_profiles.topics IS 'DEPRECATED: Use persona_prompt instead. Kept for backwards compatibility.';


