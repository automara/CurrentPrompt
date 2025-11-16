-- Migration: Add fields for content generation agents
-- Date: 2025-11-16
-- Description: Adds schema.org markup, quality scores, validation reports, and enhanced metadata fields

-- Add new columns to modules table
ALTER TABLE modules
ADD COLUMN IF NOT EXISTS schema_json JSONB,
ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
ADD COLUMN IF NOT EXISTS validation_report TEXT,
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[],
ADD COLUMN IF NOT EXISTS summary_short TEXT,
ADD COLUMN IF NOT EXISTS summary_medium TEXT,
ADD COLUMN IF NOT EXISTS summary_long TEXT,
ADD COLUMN IF NOT EXISTS image_prompt TEXT;

-- Add comments for documentation
COMMENT ON COLUMN modules.schema_json IS 'Schema.org markup in JSON-LD format for AEO optimization';
COMMENT ON COLUMN modules.quality_score IS 'AI-generated quality score (0-100) from validator agent';
COMMENT ON COLUMN modules.validation_report IS 'Detailed validation report from validator agent';
COMMENT ON COLUMN modules.meta_title IS 'SEO-optimized meta title (50-60 characters)';
COMMENT ON COLUMN modules.seo_keywords IS 'Array of SEO keywords for search optimization';
COMMENT ON COLUMN modules.summary_short IS 'Short summary (150-200 characters) for previews';
COMMENT ON COLUMN modules.summary_medium IS 'Medium summary (~300 characters) for cards';
COMMENT ON COLUMN modules.summary_long IS 'Long summary (~500 characters) for detailed views';
COMMENT ON COLUMN modules.image_prompt IS 'AI-generated prompt for image generation services';

-- Create index on quality_score for filtering high-quality content
CREATE INDEX IF NOT EXISTS idx_modules_quality_score ON modules(quality_score DESC);

-- Create GIN index on schema_json for JSON queries
CREATE INDEX IF NOT EXISTS idx_modules_schema_json ON modules USING GIN (schema_json);

-- Create GIN index on seo_keywords for keyword searches
CREATE INDEX IF NOT EXISTS idx_modules_seo_keywords ON modules USING GIN (seo_keywords);
