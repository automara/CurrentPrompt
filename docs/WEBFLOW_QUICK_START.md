# Webflow CMS Quick Start

Fast-track guide to getting your Webflow site with reference fields set up.

## What You'll Create

3 Webflow CMS collections with proper relationships:

```
Categories (6)
    ↓ referenced by
Modules (10+) ← linked to → Tags (18)
```

## Files You'll Use

- `data/webflow_categories.csv` – 6 categories ready to import
- `data/webflow_tags.csv` – 18 tags ready to import
- `data/webflow_modules_with_refs.csv` – 10 sample modules with references

## 5-Minute Setup

### 1. Create Categories Collection (1 min)
```
CMS → Create Collection → Name: categories
Add fields: Name (auto), Slug (auto), Description (Rich Text)
Import: data/webflow_categories.csv
```

### 2. Create Tags Collection (1 min)
```
CMS → Create Collection → Name: tags
Add fields: Name (auto), Slug (auto), Description (Rich Text)
Import: data/webflow_tags.csv
```

### 3. Create Modules Collection (2 min)
```
CMS → Create Collection → Name: modules
Add fields:
  - Name (auto)
  - Slug (auto)
  - Summary (Rich Text)
  - Category (Reference → categories) [single]
  - Tags (Reference → tags) [multiple]
  - Latest Version (Number)
  - Status (Text)
  - Source URL (Link)
  - Source Label (Text)
  - Download Link Full (Link)
  - Download Link Summary (Link)
  - Download Link Bundle (Link)
  - Supabase ID (Text)

Import: data/webflow_modules_with_refs.csv
```

### 4. Verify & Publish (1 min)
- Check that categories linked correctly
- Check that tags linked correctly
- Publish collections

✅ Done!

---

## More Details?

See **[WEBFLOW_CMS_SCHEMA.md](./WEBFLOW_CMS_SCHEMA.md)** for step-by-step with screenshots.

---

## CSV Contents at a Glance

### Categories
```
Prompting, Research, Writing, Development, Productivity, Methodology
```

### Tags
```
Templates, System, Beginner, Advanced, Framework, Best Practices,
Tools, Strategy, Troubleshooting, Case Study, API, Design,
Architecture, Testing, Customer, Organization, Knowledge, Meetings
```

### Modules (Sample 10)
```
system-prompt-template (prompting) [templates, system, beginner]
research-framework (research) [methodology, structure, framework]
content-strategy-guide (writing) [strategy, planning, framework]
debugging-best-practices (development) [debugging, troubleshooting, best-practices]
meeting-notes-template (productivity) [templates, organization, meetings]
api-design-principles (development) [api, design, architecture, best-practices]
decision-making-framework (methodology) [decision-making, framework, strategy]
knowledge-management-system (productivity) [organization, knowledge, system, best-practices]
testing-strategy-template (development) [testing, qa, templates, framework]
customer-research-methods (research) [research, customer, methodology, best-practices]
```

---

## Next Steps

1. Follow the 5-minute setup above
2. Verify all data imported correctly
3. Go to **Webflow API Settings** and get credentials
4. Add credentials to your `.env` file
5. See **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** for sync testing

---

## Key Difference: Reference Fields vs Text Fields

❌ **Old way (flat):**
```
Category: "prompting" (text field)
Tags: "templates, system, beginner" (text field)
```
→ Hard to organize, query, or validate

✅ **New way (relational):**
```
Category: → [prompting] (reference to categories collection)
Tags: → [templates], [system], [beginner] (multi-references to tags collection)
```
→ Clean, queryable, organized, maintains data integrity

---

**Ready?** Start with the 5-minute setup above!
