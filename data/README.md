# Sample Data

This folder contains sample data files for testing and bootstrapping CurrentPrompt.

## CSV Files (Webflow CMS Import)

### `webflow_categories.csv`
**Purpose:** Master list of module categories

**Content:** 6 categories
- Prompting
- Research
- Writing
- Development
- Productivity
- Methodology

**Use:**
1. Create "categories" collection in Webflow CMS
2. Import this file to populate categories

### `webflow_tags.csv`
**Purpose:** Master list of module tags

**Content:** 18 tags
- Templates, System, Beginner, Advanced
- Framework, Best Practices, Tools, Strategy
- Troubleshooting, Case Study, API, Design
- Architecture, Testing, Customer, Organization
- Knowledge, Meetings

**Use:**
1. Create "tags" collection in Webflow CMS
2. Import this file to populate tags

### `webflow_modules_with_refs.csv`
**Purpose:** Module data with references to categories and tags

**Content:** 10 sample modules with:
- Name, Slug, Summary
- Category (single reference to categories collection)
- Tags (multi-reference to tags collection)
- Version, Status, Attribution
- File download links

**Use:**
1. Create "modules" collection with reference fields
2. Category field → Reference to categories
3. Tags field → Multi-reference to tags
4. Import this file

### `webflow_import.csv` (Legacy)
**Purpose:** Flat module data without references

**Use:** Alternative if you don't want to set up reference collections

### `modules_sample.csv`
**Purpose:** Alternative format for programmatic import

**Use:** Reference for creating modules via API

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
