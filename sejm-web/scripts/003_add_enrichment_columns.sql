-- Add enrichment columns to legislative_processes table

ALTER TABLE legislative_processes 
ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS extended_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'normal';

-- Add index for categories to speed up filtering
CREATE INDEX IF NOT EXISTS idx_processes_categories ON legislative_processes USING GIN (categories);

