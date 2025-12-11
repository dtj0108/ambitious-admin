-- Add image generation support to NPC profiles

-- Visual persona for character consistency in generated images
ALTER TABLE npc_profiles ADD COLUMN IF NOT EXISTS visual_persona JSONB DEFAULT NULL;

-- Optional reference image URL for better consistency
ALTER TABLE npc_profiles ADD COLUMN IF NOT EXISTS reference_image_url TEXT DEFAULT NULL;

-- Image generation settings
ALTER TABLE npc_profiles ADD COLUMN IF NOT EXISTS generate_images BOOLEAN DEFAULT FALSE;
ALTER TABLE npc_profiles ADD COLUMN IF NOT EXISTS image_frequency TEXT DEFAULT 'sometimes' CHECK (image_frequency IN ('always', 'sometimes', 'rarely'));
ALTER TABLE npc_profiles ADD COLUMN IF NOT EXISTS preferred_image_style TEXT DEFAULT 'photo' CHECK (preferred_image_style IN ('photo', 'illustration', 'mixed'));

-- Add image fields to post queue
ALTER TABLE npc_post_queue ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;
ALTER TABLE npc_post_queue ADD COLUMN IF NOT EXISTS image_prompt TEXT DEFAULT NULL;

-- Comment on new columns
COMMENT ON COLUMN npc_profiles.visual_persona IS 'JSON describing the NPC visual appearance for consistent image generation';
COMMENT ON COLUMN npc_profiles.reference_image_url IS 'Optional reference image URL for character consistency';
COMMENT ON COLUMN npc_profiles.generate_images IS 'Whether this NPC should generate images with posts';
COMMENT ON COLUMN npc_profiles.image_frequency IS 'How often to generate images: always, sometimes (50%), rarely (25%)';
COMMENT ON COLUMN npc_profiles.preferred_image_style IS 'Preferred style for generated images';
COMMENT ON COLUMN npc_post_queue.image_url IS 'URL of the generated image for this post';
COMMENT ON COLUMN npc_post_queue.image_prompt IS 'The prompt used to generate the image';

