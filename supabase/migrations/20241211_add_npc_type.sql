-- Add NPC type column to support object/brand NPCs (not just people)
-- person: NPC represents a human character
-- object: NPC represents an object, product, brand, or thing (e.g., sushi account)

ALTER TABLE npc_profiles 
ADD COLUMN IF NOT EXISTS npc_type TEXT DEFAULT 'person' 
CHECK (npc_type IN ('person', 'object'));

-- Add comment for documentation
COMMENT ON COLUMN npc_profiles.npc_type IS 'Type of NPC: person (human character) or object (product/brand/thing)';

