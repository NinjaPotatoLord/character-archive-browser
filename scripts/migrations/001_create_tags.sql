-- Migration: Create tags tables and extract tags from JSON fields
-- This migration creates normalized tag tables for easier searching

BEGIN;

-- Table for unique tags
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    count INTEGER DEFAULT 0
);

-- Junction table linking characters to tags
CREATE TABLE IF NOT EXISTS character_tags (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,          -- 'chub', 'booru', 'risuai', etc.
    character_id TEXT NOT NULL,    -- ID of the character (as text for uniformity)
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(source, character_id, tag_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_character_tags_source_char ON character_tags(source, character_id);
CREATE INDEX IF NOT EXISTS idx_character_tags_tag ON character_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_name_lower ON tags(LOWER(name));

-- Function to normalize tag names
CREATE OR REPLACE FUNCTION normalize_tag(tag TEXT) RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(TRIM(tag));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Extract tags from chub_character (data->'topics' is usually an array)
INSERT INTO tags (name)
SELECT DISTINCT normalize_tag(topic)
FROM chub_character, jsonb_array_elements_text(data->'topics') AS topic
WHERE data->'topics' IS NOT NULL
  AND jsonb_typeof(data->'topics') = 'array'
  AND normalize_tag(topic) != ''
ON CONFLICT (name) DO NOTHING;

-- Extract tags from chub_character (data->'tagline' as single tag if exists)
-- Skip this as tagline is usually a description, not a tag

-- Extract tags from booru_character_def (tags is _text array)
INSERT INTO tags (name)
SELECT DISTINCT normalize_tag(tag)
FROM booru_character_def, unnest(tags) AS tag
WHERE tag IS NOT NULL AND normalize_tag(tag) != ''
ON CONFLICT (name) DO NOTHING;

-- Extract tags from risuai_character (node->'tags' if exists)
INSERT INTO tags (name)
SELECT DISTINCT normalize_tag(tag)
FROM risuai_character, jsonb_array_elements_text(node->'tags') AS tag
WHERE node->'tags' IS NOT NULL
  AND jsonb_typeof(node->'tags') = 'array'
  AND normalize_tag(tag) != ''
ON CONFLICT (name) DO NOTHING;

-- Extract tags from nyaime_character (node->'tags' if exists)
INSERT INTO tags (name)
SELECT DISTINCT normalize_tag(tag)
FROM nyaime_character, jsonb_array_elements_text(node->'tags') AS tag
WHERE node->'tags' IS NOT NULL
  AND jsonb_typeof(node->'tags') = 'array'
  AND normalize_tag(tag) != ''
ON CONFLICT (name) DO NOTHING;

-- Now link characters to tags

-- Chub characters
INSERT INTO character_tags (source, character_id, tag_id)
SELECT DISTINCT 'chub', c.id::text, t.id
FROM chub_character c, jsonb_array_elements_text(c.data->'topics') AS topic
JOIN tags t ON t.name = normalize_tag(topic)
WHERE c.data->'topics' IS NOT NULL
  AND jsonb_typeof(c.data->'topics') = 'array'
ON CONFLICT (source, character_id, tag_id) DO NOTHING;

-- Booru characters
INSERT INTO character_tags (source, character_id, tag_id)
SELECT DISTINCT 'booru', b.id, t.id
FROM booru_character_def b, unnest(b.tags) AS tag
JOIN tags t ON t.name = normalize_tag(tag)
WHERE tag IS NOT NULL
ON CONFLICT (source, character_id, tag_id) DO NOTHING;

-- RisuAI characters
INSERT INTO character_tags (source, character_id, tag_id)
SELECT DISTINCT 'risuai', r.id, t.id
FROM risuai_character r, jsonb_array_elements_text(r.node->'tags') AS tag
JOIN tags t ON t.name = normalize_tag(tag)
WHERE r.node->'tags' IS NOT NULL
  AND jsonb_typeof(r.node->'tags') = 'array'
ON CONFLICT (source, character_id, tag_id) DO NOTHING;

-- Nyaime characters
INSERT INTO character_tags (source, character_id, tag_id)
SELECT DISTINCT 'nyaime', n.id::text, t.id
FROM nyaime_character n, jsonb_array_elements_text(n.node->'tags') AS tag
JOIN tags t ON t.name = normalize_tag(tag)
WHERE n.node->'tags' IS NOT NULL
  AND jsonb_typeof(n.node->'tags') = 'array'
ON CONFLICT (source, character_id, tag_id) DO NOTHING;

-- Update tag counts
UPDATE tags SET count = (
    SELECT COUNT(*) FROM character_tags WHERE tag_id = tags.id
);

-- Create a view for easy tag searching
CREATE OR REPLACE VIEW character_tags_view AS
SELECT
    ct.source,
    ct.character_id,
    t.name AS tag_name,
    t.count AS tag_popularity
FROM character_tags ct
JOIN tags t ON ct.tag_id = t.id;

COMMIT;

-- Summary
DO $$
DECLARE
    tag_count INTEGER;
    link_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tag_count FROM tags;
    SELECT COUNT(*) INTO link_count FROM character_tags;
    RAISE NOTICE 'Migration complete: % unique tags, % character-tag links', tag_count, link_count;
END $$;
