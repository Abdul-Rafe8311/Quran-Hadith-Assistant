-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS islamic_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(384),
  source_type TEXT CHECK (source_type IN ('quran', 'hadith')),
  lang TEXT DEFAULT 'en',
  metadata JSONB
);

-- NOTE: We do NOT use an ivfflat index. At this dataset size (~8k rows) exact
-- search (a sequential scan in the match function) is fast (<100ms) and gives
-- PERFECT recall. An ivfflat index with default probes only scans ~1% of rows
-- and returned wrong results. If you previously created the index, drop it:
DROP INDEX IF EXISTS islamic_knowledge_embedding_idx;

CREATE TABLE IF NOT EXISTS saved_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT,
  answer TEXT,
  citations JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RPC function for vector similarity search (EXACT — no index, perfect recall)
CREATE OR REPLACE FUNCTION match_islamic_knowledge(
  query_embedding VECTOR(384),
  match_count INT DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source_type TEXT,
  lang TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    ik.id,
    ik.content,
    ik.source_type,
    ik.lang,
    ik.metadata,
    1 - (ik.embedding <=> query_embedding) AS similarity
  FROM islamic_knowledge ik
  ORDER BY ik.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
