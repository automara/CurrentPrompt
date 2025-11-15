-- Migration: 002_add_prd_fields.sql
-- Description: Add PRD v2.0 fields (meta_description, owner, webflow_id)

-- Add meta_description field for SEO
ALTER TABLE modules ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Add owner field (defaults to Keith Armstrong)
ALTER TABLE modules ADD COLUMN IF NOT EXISTS owner TEXT DEFAULT 'Keith Armstrong';

-- Add webflow_id field to track Webflow CMS item ID
ALTER TABLE modules ADD COLUMN IF NOT EXISTS webflow_id TEXT;

-- Add thumbnail field to file_paths in module_versions
-- Note: This is a JSONB field, so we update the default structure
ALTER TABLE module_versions
  ALTER COLUMN file_paths
  SET DEFAULT '{"full_md": "", "summary_md": "", "bundle_zip": "", "thumbnail": ""}'::JSONB;

-- Update search_text function to include meta_description
CREATE OR REPLACE FUNCTION update_modules_search_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.summary, '') || ' ' ||
    COALESCE(NEW.meta_description, '') || ' ' ||
    COALESCE(NEW.category, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON COLUMN modules.meta_description IS 'SEO meta description (150-160 chars)';
COMMENT ON COLUMN modules.owner IS 'Module owner/creator attribution';
COMMENT ON COLUMN modules.webflow_id IS 'Webflow CMS collection item ID for sync tracking';
