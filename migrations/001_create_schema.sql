-- CurrentPrompt Database Schema
-- Migration: 001_create_schema.sql
-- Description: Create core tables for modules, versions, and embeddings

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  summary TEXT,
  source_url TEXT,
  source_label TEXT,
  latest_version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  search_text TSVECTOR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on modules
CREATE INDEX idx_modules_slug ON modules(slug);
CREATE INDEX idx_modules_category ON modules(category);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_modules_search_text ON modules USING GIN(search_text);
CREATE INDEX idx_modules_created_at ON modules(created_at DESC);
CREATE INDEX idx_modules_tags ON modules USING GIN(tags);

-- Create module_versions table
CREATE TABLE IF NOT EXISTS module_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  changelog TEXT,
  file_paths JSONB DEFAULT '{"full_md": "", "summary_md": "", "bundle_zip": ""}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(module_id, version)
);

-- Create indexes on module_versions
CREATE INDEX idx_module_versions_module_id ON module_versions(module_id);
CREATE INDEX idx_module_versions_version ON module_versions(module_id, version);

-- Create module_embeddings table (for semantic search)
CREATE TABLE IF NOT EXISTS module_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(module_id)
);

-- Create index on embeddings for vector search
CREATE INDEX idx_module_embeddings_vector ON module_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to update search_text when modules are created/updated
CREATE OR REPLACE FUNCTION update_modules_search_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.summary, '') || ' ' ||
    COALESCE(NEW.category, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search_text
CREATE TRIGGER trg_update_modules_search_text
BEFORE INSERT OR UPDATE ON modules
FOR EACH ROW
EXECUTE FUNCTION update_modules_search_text();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trg_update_modules_updated_at
BEFORE UPDATE ON modules
FOR EACH ROW
EXECUTE FUNCTION update_modules_updated_at();

-- Insert sample data (optional - for testing)
INSERT INTO modules (title, slug, category, tags, summary, status)
VALUES (
  'System Prompt Template',
  'system-prompt-template',
  'prompting',
  ARRAY['templates', 'system', 'beginner'],
  'A flexible template for creating effective system prompts for AI assistants',
  'published'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO module_versions (module_id, version, changelog)
SELECT id, 1, 'Initial version'
FROM modules
WHERE slug = 'system-prompt-template'
AND NOT EXISTS (SELECT 1 FROM module_versions WHERE module_id = modules.id)
ON CONFLICT DO NOTHING;
