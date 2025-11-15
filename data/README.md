# Sample Data

This folder contains sample data files for testing and bootstrapping CurrentPrompt.

## Files

### `webflow_import.csv`
Ready-to-import CSV for Webflow CMS.

**Use:** Upload directly to Webflow CMS → modules collection → Import items

**Fields:**
- Name
- Slug
- Summary
- Category
- Tags
- Latest Version
- Status
- Source URL
- Source Label

### `modules_sample.csv`
Alternative format with all module data.

**Use:** Reference for creating modules programmatically

---

## How to Use

### Option 1: Direct Webflow Import
1. Download `webflow_import.csv`
2. Go to Webflow CMS → modules collection
3. Click "Import items"
4. Upload the CSV
5. Map columns to fields
6. Click Import

### Option 2: API Bulk Insert
See `/docs/TESTING_GUIDE.md` for instructions on importing via API.

---

## Customizing Sample Data

Edit the CSV files to change:
- Module titles and slugs
- Categories and tags
- Summaries
- Status (published/draft/archived)
- Source attribution

Then import as described above.

---

## Adding Real Content

Once testing is complete:
1. Replace sample data with real modules
2. Add actual markdown files to Supabase Storage
3. Create versions with file paths
4. Sync to Webflow

See Phase 3 (Ingestion Pipeline) in PROJECT.md for details.
