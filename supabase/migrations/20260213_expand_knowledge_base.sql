-- Expand knowledge_items table for Digital Brain features
-- Add new columns for enhanced knowledge management

ALTER TABLE knowledge_items 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'note',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS key_takeaways TEXT[],
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_to_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_knowledge_items_user_type ON knowledge_items(user_id, type);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_user_favorite ON knowledge_items(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_user_archived ON knowledge_items(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_last_reviewed ON knowledge_items(user_id, last_reviewed_at);

-- Comment on columns
COMMENT ON COLUMN knowledge_items.type IS 'Type of knowledge: note, article, book, video, podcast, ai_insight, link';
COMMENT ON COLUMN knowledge_items.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN knowledge_items.progress IS 'Reading/completion progress 0-100';
COMMENT ON COLUMN knowledge_items.ai_summary IS 'AI-generated summary of the content';
COMMENT ON COLUMN knowledge_items.key_takeaways IS 'Key points extracted from content';
COMMENT ON COLUMN knowledge_items.is_favorite IS 'Marked as favorite';
COMMENT ON COLUMN knowledge_items.is_archived IS 'Archived item';
COMMENT ON COLUMN knowledge_items.is_to_read IS 'Marked for later reading';
COMMENT ON COLUMN knowledge_items.source_url IS 'Original source URL';
COMMENT ON COLUMN knowledge_items.last_reviewed_at IS 'Last time reviewed for spaced repetition';
