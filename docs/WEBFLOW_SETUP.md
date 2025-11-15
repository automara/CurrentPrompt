# Webflow Integration Setup

This guide walks through setting up a Webflow site for CurrentPrompt with CMS collections and API integration.

## Step 1: Create Webflow Site

1. Go to [webflow.com](https://webflow.com)
2. Create a new project called "CurrentPrompt"
3. Choose a template or start blank
4. Design your homepage (basic structure is fine for now)

## Step 2: Create CMS Collections

For a proper relational structure, create **3 collections** (not just one):

1. **categories** - Reference data for categorizing modules
2. **tags** - Reference data for tagging modules
3. **modules** - Main collection with references to categories & tags

### Detailed Schema Setup

See **[WEBFLOW_CMS_SCHEMA.md](./WEBFLOW_CMS_SCHEMA.md)** for complete step-by-step instructions.

Quick summary:

| Collection | Purpose | Items |
|-----------|---------|-------|
| categories | Module categories (reference field) | 6 items (Prompting, Research, Writing, etc.) |
| tags | Module tags (multi-reference field) | 18 items (Templates, System, Framework, etc.) |
| modules | Main modules with references | 10+ items |

### Collection Fields for Modules

| Field Name | Type | Notes |
|-----------|------|-------|
| `Name` | Text | Module title (auto-created) |
| `Slug` | Slug | URL-friendly ID (auto-created) |
| `Summary` | Rich Text | One-line description |
| `Category` | **Reference** | Link to categories collection |
| `Tags` | **Multi-reference** | Link to tags collection |
| `Latest Version` | Number | Current version number |
| `Status` | Text | "draft", "published", or "archived" |
| `Source URL` | Link | Attribution link |
| `Source Label` | Text | Attribution name |
| `Download Link Full` | Link | Link to full.md file |
| `Download Link Summary` | Link | Link to summary.md file |
| `Download Link Bundle` | Link | Link to bundle.zip file |
| `Supabase ID` | Text | Module UUID from Supabase (for syncing) |

## Step 3: Create Module Page Template

1. Create a new page: `/modules/{modules}`
2. Add dynamic content binding to CMS collection
3. Display:
   - Module title
   - Summary
   - Category & tags
   - Version history
   - Download buttons

## Step 4: Get Webflow API Credentials

1. Go to **Account Settings** → **API Access**
2. Create a new token with:
   - **Scopes:** Collections, Items (read & write)
   - **Name:** CurrentPrompt Sync
3. Copy the **API Token** and **Site ID**

## Step 5: Configure CurrentPrompt API

Add to your `.env`:
```
WEBFLOW_API_TOKEN=your_token_here
WEBFLOW_SITE_ID=your_site_id_here
WEBFLOW_COLLECTION_ID=your_collection_id_here
```

To find `COLLECTION_ID`:
1. In Webflow editor, right-click collection → **Settings**
2. Look for "Collection ID" in URL or API docs

## Step 6: Test Sync

Once the webhook is configured, create a module via the API:

```bash
curl -X POST http://localhost:3000/api/modules \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Module",
    "slug": "test-module",
    "category": "testing",
    "tags": ["test"],
    "summary": "Testing the sync",
    "status": "published"
  }'
```

The module should automatically appear in your Webflow CMS!

## Manual Sync (if needed)

If webhook sync fails, manually sync all modules:

```bash
curl -X POST http://localhost:3000/api/webflow/sync \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

**Next:** Build the webhook handler and Webflow sync service
