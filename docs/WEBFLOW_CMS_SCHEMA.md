# Webflow CMS Schema Setup

This guide walks through creating the proper Webflow CMS collections with reference fields for categories and tags.

## Overview

You'll create 3 collections:
1. **categories** - Reference data for categorizing modules
2. **tags** - Reference data for tagging modules
3. **modules** - Main collection with references to categories and tags

This creates a clean relational structure that mirrors your Supabase database.

---

## Step 1: Create Categories Collection

### In Webflow Editor:
1. Go to **CMS** (left sidebar)
2. Click **Create Collection**
3. Name: `categories`
4. Click **Create**

### Add Fields:

| Field Name | Type | Notes |
|-----------|------|-------|
| Name | Text (auto-created) | |
| Slug | Slug (auto-created) | |
| Description | Rich Text | Brief description of the category |

### Import Data:
1. With categories collection open, click **Import items**
2. Upload `data/webflow_categories.csv`
3. Map columns:
   - `Name` → `Name`
   - `Slug` → `Slug`
   - `Description` → `Description`
4. Click **Import**

✅ You now have 6 categories in Webflow!

---

## Step 2: Create Tags Collection

### In Webflow Editor:
1. Go to **CMS** → **Create Collection**
2. Name: `tags`
3. Click **Create**

### Add Fields:

| Field Name | Type | Notes |
|-----------|------|-------|
| Name | Text (auto-created) | |
| Slug | Slug (auto-created) | |
| Description | Rich Text | What this tag represents |

### Import Data:
1. Click **Import items**
2. Upload `data/webflow_tags.csv`
3. Map columns:
   - `Name` → `Name`
   - `Slug` → `Slug`
   - `Description` → `Description`
4. Click **Import**

✅ You now have 18 tags in Webflow!

---

## Step 3: Create Modules Collection

### In Webflow Editor:
1. Go to **CMS** → **Create Collection**
2. Name: `modules`
3. Click **Create**

### Add Fields:

| Field Name | Type | Notes |
|-----------|------|-------|
| Name | Text (auto-created) | Module title |
| Slug | Slug (auto-created) | URL-friendly ID |
| Summary | Rich Text | One-line description |
| **Category** | **Reference** | **Link to categories collection** |
| **Tags** | **Multi-reference** | **Link to tags collection** |
| Latest Version | Number | Current version number |
| Status | Text | published, draft, archived |
| Source URL | Link | Attribution link |
| Source Label | Text | Attribution name |
| Download Link Full | Link | Full markdown file |
| Download Link Summary | Link | Summary markdown file |
| Download Link Bundle | Link | ZIP bundle file |
| Supabase ID | Text | Module UUID for syncing |

### Important: Reference Fields

When creating the Category and Tags fields:

**Category Field:**
1. Click **Add field**
2. Name: `Category`
3. Type: **Reference**
4. Reference Collection: `categories`
5. Allow multiple: **No** (one category per module)
6. Click **Create**

**Tags Field:**
1. Click **Add field**
2. Name: `Tags`
3. Type: **Reference**
4. Reference Collection: `tags`
5. Allow multiple: **Yes** (multiple tags per module)
6. Click **Create**

### Import Data:
1. Click **Import items**
2. Upload `data/webflow_modules_with_refs.csv`
3. Map columns:
   - `Name` → `Name`
   - `Slug` → `Slug`
   - `Summary` → `Summary`
   - `Category` → `Category` (will auto-link to categories)
   - `Tags` → `Tags` (will auto-link to tags)
   - `Latest Version` → `Latest Version`
   - `Status` → `Status`
   - `Source URL` → `Source URL`
   - `Source Label` → `Source Label`
4. Click **Import**

✅ Modules now in Webflow with proper references!

---

## Step 4: Update References (If Needed)

If the import didn't auto-link categories/tags:

1. Open a module in CMS
2. Scroll to **Category** field
3. Click dropdown and select the matching category
4. Scroll to **Tags** field
5. Click and multi-select matching tags
6. Publish

Repeat for each module if needed.

---

## Step 5: Verify in Webflow UI

1. Go to **CMS** → **modules**
2. View a module item
3. Confirm:
   - ✅ Category field shows the linked category
   - ✅ Tags field shows all linked tags
   - ✅ All other fields populated correctly

---

## CSV Files Reference

### `webflow_categories.csv`
```
6 categories ready to import:
- Prompting
- Research
- Writing
- Development
- Productivity
- Methodology
```

### `webflow_tags.csv`
```
18 tags ready to import:
- Templates, System, Beginner, Advanced
- Framework, Best Practices, Tools, Strategy
- Troubleshooting, Case Study, API, Design
- Architecture, Testing, Customer, Organization
- Knowledge, Meetings
```

### `webflow_modules_with_refs.csv`
```
10 sample modules with:
- References to categories (single value)
- References to tags (comma-separated values)
- All module metadata
```

---

## Webflow Collection Relationships

After setup, your CMS structure looks like:

```
categories (6 items)
├── prompting
├── research
├── writing
├── development
├── productivity
└── methodology

tags (18 items)
├── templates
├── system
├── beginner
├── advanced
├── framework
├── best-practices
├── tools
├── strategy
├── troubleshooting
├── case-study
├── api
├── design
├── architecture
├── testing
├── customer
├── organization
├── knowledge
└── meetings

modules (10 items)
├── system-prompt-template (→ prompting, [templates, system, beginner])
├── research-framework (→ research, [methodology, structure, framework])
├── content-strategy-guide (→ writing, [strategy, planning, framework])
├── debugging-best-practices (→ development, [debugging, troubleshooting, best-practices])
├── meeting-notes-template (→ productivity, [templates, organization, meetings])
├── api-design-principles (→ development, [api, design, architecture, best-practices])
├── decision-making-framework (→ methodology, [decision-making, framework, strategy])
├── knowledge-management-system (→ productivity, [organization, knowledge, system, best-practices])
├── testing-strategy-template (→ development, [testing, qa, templates, framework])
└── customer-research-methods (→ research, [research, customer, methodology, best-practices])
```

---

## Next: Sync to Supabase

Once your Webflow CMS is set up:

1. Configure Webflow API credentials in `.env`
2. Test sync endpoints:
   ```bash
   curl -X POST http://localhost:3000/api/webflow/sync-all
   ```
3. Modules sync from Webflow → Supabase
4. Both databases stay in sync!

---

## Troubleshooting

### CSV Import Shows Warnings
- Make sure collection names match exactly
- Check for extra spaces in field names
- Verify slugs are unique within each collection

### Reference Fields Not Linking
- Ensure category/tag slugs match between modules CSV and their collections
- You may need to manually link after import
- Try removing and re-importing

### Fields Not Appearing in Import
- Make sure all fields are created in CMS first
- Try importing without reference fields first
- Add references manually after

---

## Complete Setup Checklist

- [ ] Categories collection created with 6 items
- [ ] Tags collection created with 18 items
- [ ] Modules collection created with all fields
- [ ] Category and Tags fields are reference types
- [ ] Sample data imported to all collections
- [ ] References linking correctly
- [ ] Webflow API credentials obtained
- [ ] Webflow credentials added to `.env`
- [ ] Ready to test sync!

---

**Next:** See TESTING_GUIDE.md to test the full sync workflow.
