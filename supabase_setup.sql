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

CREATE INDEX IF NOT EXISTS islamic_knowledge_embedding_idx
ON islamic_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE IF NOT EXISTS saved_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT,
  answer TEXT,
  citations JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RPC function for vector similarity search
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
