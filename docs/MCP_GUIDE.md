# MCP Integration Guide

The CurrentPrompt API exposes module resources via MCP (Model Context Protocol) endpoints, allowing LLM agents like Claude to discover and load knowledge modules.

## Overview

The MCP endpoints provide agent-friendly access to:
- Module discovery and search
- Category and tag filtering
- Full module content retrieval
- Statistics and metadata

## Base URL

```
http://localhost:3000/api/mcp
```

## Endpoints

### List All Modules
```bash
GET /api/mcp/modules
```

Returns all published modules with metadata.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "System Prompt Template",
      "slug": "system-prompt-template",
      "category": "prompting",
      "tags": ["templates", "system", "beginner"],
      "summary": "A flexible template for creating effective system prompts...",
      "latest_version": 1,
      "status": "published",
      "created_at": "2025-11-15T...",
      "updated_at": "2025-11-15T..."
    }
  ],
  "count": 10
}
```

### Get Module Details
```bash
GET /api/mcp/modules/:slug
```

Get a specific module by slug.

**Example:**
```bash
curl http://localhost:3000/api/mcp/modules/system-prompt-template
```

### Get Module with Versions
```bash
GET /api/mcp/modules/:slug/full
```

Get a module with all its version history.

**Example:**
```bash
curl http://localhost:3000/api/mcp/modules/system-prompt-template/full
```

### Get Module Content
```bash
GET /api/mcp/modules/:slug/content?version=1&type=full
```

Retrieve the actual markdown content of a module.

**Query Parameters:**
- `version` (default: 1) - Version number to retrieve
- `type` (default: "full") - "full" or "summary"

**Example:**
```bash
curl "http://localhost:3000/api/mcp/modules/system-prompt-template/content?version=1&type=full"
```

### Search Modules
```bash
GET /api/mcp/search?q=query
```

Full-text search across all module content.

**Example:**
```bash
curl "http://localhost:3000/api/mcp/search?q=system+prompt"
```

### List Categories
```bash
GET /api/mcp/categories
```

Get all available categories.

**Response:**
```json
{
  "success": true,
  "data": ["prompting", "research", "writing", "development", "productivity"],
  "count": 5
}
```

### Get Modules by Category
```bash
GET /api/mcp/categories/:category
```

Get all modules in a specific category.

**Example:**
```bash
curl http://localhost:3000/api/mcp/categories/development
```

### List Tags
```bash
GET /api/mcp/tags
```

Get all available tags across modules.

### Get Modules by Tag
```bash
GET /api/mcp/tags/:tag
```

Get all modules with a specific tag.

**Example:**
```bash
curl "http://localhost:3000/api/mcp/tags/templates"
```

### Get Statistics
```bash
GET /api/mcp/stats
```

Get overall statistics about CurrentPrompt.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalModules": 15,
    "publishedModules": 12,
    "draftModules": 3,
    "categories": 5,
    "totalVersions": 18
  }
}
```

## Agent Integration

### Using with Claude

To use CurrentPrompt modules in a Claude conversation, you can:

1. **Query for relevant modules:**
   ```
   Search CurrentPrompt for modules about "system prompts"
   ```

2. **Load a specific module:**
   ```
   Load the "system-prompt-template" module from CurrentPrompt
   ```

3. **Get full content:**
   ```
   Retrieve the full content of the "system-prompt-template" module
   ```

### Example Agent Workflow

```
Agent: "I need a framework for writing system prompts"
↓
Agent queries: GET /api/mcp/search?q=system+prompt
↓
Agent receives: [List of relevant modules]
↓
Agent selects: system-prompt-template
↓
Agent fetches: GET /api/mcp/modules/system-prompt-template/content
↓
Agent uses: Module content in system context
↓
Agent: "Based on CurrentPrompt's system-prompt-template..."
```

## Rate Limiting

No rate limiting currently enforced. Add authentication if needed in production.

## Authentication

Currently all endpoints are public and read-only. Add `Authorization: Bearer token` header for private deployments.

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad request (missing query params, etc.)
- `404` - Resource not found
- `500` - Server error

## Testing MCP Endpoints

Test endpoints locally:

```bash
# List all modules
curl http://localhost:3000/api/mcp/modules

# Search
curl "http://localhost:3000/api/mcp/search?q=debugging"

# Get stats
curl http://localhost:3000/api/mcp/stats

# Get module content
curl "http://localhost:3000/api/mcp/modules/system-prompt-template/content"
```

---

**Next:** Deploy to production and integrate with agent platforms.
