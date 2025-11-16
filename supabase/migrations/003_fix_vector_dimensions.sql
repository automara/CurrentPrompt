-- Migration 003: Fix Vector Dimensions
-- Date: 2025-11-16
-- Purpose: Update vector column to support 3072 dimensions (text-embedding-3-large)
-- Currently: 1536 dimensions
-- Target: 3072 dimensions

-- The OpenAI text-embedding-3-large model produces 3072-dimensional embeddings,
-- but the schema was created for text-embedding-3-small (1536 dimensions).

BEGIN;

-- Drop existing embedding column and recreate with correct dimensions
ALTER TABLE module_embeddings
DROP COLUMN IF EXISTS embedding;

-- Add new embedding column with 3072 dimensions
ALTER TABLE module_embeddings
ADD COLUMN embedding vector(3072);

-- Recreate the IVFFlat index for vector similarity search
-- Lists parameter: sqrt(total_rows), typical starting point is 100
DROP INDEX IF EXISTS module_embeddings_embedding_idx;

CREATE INDEX module_embeddings_embedding_idx
ON module_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add comment
COMMENT ON COLUMN module_embeddings.embedding IS
'Vector embeddings from OpenAI text-embedding-3-large model (3072 dimensions)';

COMMIT;

-- Note: Existing embeddings will be lost during this migration.
-- Re-run embedding generation for all modules after applying this migration.
-- Command: POST /api/modules/regenerate-embeddings (if implemented)
