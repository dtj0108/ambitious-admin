-- Add temperature column to npc_profiles table
-- Controls AI creativity/randomness (0.0 = focused, 1.0 = creative)

-- Add the column with default value of 0.8
ALTER TABLE npc_profiles 
ADD COLUMN IF NOT EXISTS temperature DECIMAL(2,1) DEFAULT 0.8;

-- Add constraint to ensure temperature is between 0 and 1
ALTER TABLE npc_profiles
ADD CONSTRAINT temperature_range CHECK (temperature >= 0 AND temperature <= 1);

-- Add comment explaining the column
COMMENT ON COLUMN npc_profiles.temperature IS 'AI creativity/randomness setting. 0.0 = focused on prompt, 1.0 = more creative and varied. Default is 0.8.';

