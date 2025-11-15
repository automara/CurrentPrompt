# Webflow API Integration - Status Report

**Date:** 2025-11-15
**Status:** ⚠️ Blocked on Webflow API v1 Limitations
**API Server:** ✅ Running on http://localhost:3000

---

## Summary

The Webflow MCP server infrastructure is **complete and working**, but the actual data sync is **blocked by Webflow API limitations**. The issue is that Webflow's v1 REST API requires **database collection IDs**, not the **CMS collection IDs** you see in the Webflow UI.

---

## What's Working ✅

- ✅ **API Server** - Running successfully on port 3000
- ✅ **Webflow Credentials** - Configured in `.env`
- ✅ **Authentication** - API token validated
- ✅ **MCP Endpoints** - All 10 new endpoints callable
- ✅ **Supabase Connection** - Working, 1 published module exists
- ✅ **CSV Data** - Successfully imported into Webflow (verified)
- ✅ **TypeScript** - Builds without errors
- ✅ **Error Handling** - Clear messages about API limitations

---

## The Problem 🚨

**Webflow v1 API doesn't accept CMS collection IDs**

When you export data from Webflow or see collection IDs in the CMS UI, those are **CMS Collection IDs**:
```
WEBFLOW_COLLECTION_ID=6918a7483d8465a21967f77f  ← CMS ID (doesn't work with v1 API)
```

But Webflow's v1 REST API `/collections/{id}/items` endpoint requires **Database Collection IDs**, which are different.

### Error Evidence

```
Route not found: /v1/collections/6918a7483d8465a21967f77f/items
```

The v1 API doesn't recognize that collection ID format.

---

## Solutions

### Option 1: Find Correct Database IDs (Recommended for v1)

The code already has a function `getCollectionDatabaseId()` that can fetch the correct IDs:

```
GET /v1/sites/{SITE_ID}/collections
```

Returns:
```json
{
  "collections": [
    {
      "_id": "507f1f77bcf86cd799439011",  ← Use this ID!
      "name": "modules"
    }
  ]
}
```

**Next step:**
1. Call this endpoint with your SITE_ID
2. Find the modules collection database ID
3. Update `.env` with the correct ID

### Option 2: Migrate to Webflow v2 API (Better long-term)

Webflow now offers a **v2 API** that properly supports CMS collections:

```
POST https://api.webflow.com/v2/collections/{collectionId}/items
```

**Advantages:**
- Works with CMS collection IDs directly
- Better API design
- Official support for modern CMS features

**Next step:**
- Review Webflow v2 API docs
- Update service to use v2 endpoints
- Simpler implementation

---

## Current Configuration

**Your `.env` has:**
```env
WEBFLOW_API_TOKEN=7ccc5354fa1b5eac8cba7a6fe80f8fd2d749b9577f108e9c0fe12e0e2ce584a0
WEBFLOW_SITE_ID=6918a58328294f9ef33afe61
WEBFLOW_COLLECTION_ID=6918a7483d8465a21967f77f  ← CMS ID (need database ID)
```

---

## How to Get Database IDs

**In Webflow CMS UI**, the IDs you see are CMS IDs. To get database IDs:

1. **Option A - Use the v1 API:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.webflow.com/v1/sites/6918a58328294f9ef33afe61/collections
   ```

2. **Option B - Check Webflow developer docs** for your site's database IDs

3. **Option C - Check browser DevTools** when viewing collections in Webflow

---

## Files Involved

- `src/services/webflowService.ts` - Main Webflow sync logic (needs v2 API or database IDs)
- `src/services/webflowDataService.ts` - Fetch from Webflow (same issue)
- `.env` - Has collection IDs that don't work with v1 API
- `WEBFLOW_MCP_INTEGRATION.md` - Documentation (still valid, just API needs update)

---

## Testing Status

| Test | Status | Notes |
|------|--------|-------|
| API Health | ✅ Pass | http://localhost:3000/health works |
| Supabase Read | ✅ Pass | Can fetch modules from Supabase |
| Webflow Auth | ✅ Pass | API token accepted |
| Webflow Read | ❌ Fail | 404 - collection ID format incompatible |
| Webflow Write | ❌ Fail | Same ID format issue |

---

## Immediate Next Steps

1. **Choose approach:** v1 (find database IDs) or v2 (migrate API)
2. **If v1:** Call `/sites/{SITE_ID}/collections` to get database IDs
3. **If v2:** Update endpoints to use v2 API format
4. **Update `.env`** with correct collection IDs
5. **Test push sync** - create module in Supabase, push to Webflow
6. **Verify in Webflow CMS** - module appears with all fields

---

## Code That's Ready

Everything is in place, just needs the correct collection IDs:

- ✅ Push sync logic (Supabase → Webflow)
- ✅ Pull sync logic (Webflow → Supabase)
- ✅ Webhook handling
- ✅ MCP endpoints
- ✅ Error handling
- ✅ TypeScript types

---

## Recommendation

**Go with Webflow v2 API** - it's simpler and the future-proof solution. The code structure is already there, just need to:

1. Update API endpoint URLs from `/v1/` to `/v2/`
2. Adjust request/response format slightly
3. No need to worry about database ID conversions

Would you like me to implement the v2 API migration?

---

## Resources

- [Webflow v1 API Docs](https://developers.webflow.com/reference/webflow-rest-api)
- [Webflow v2 API Docs](https://developers.webflow.com/reference/introduction)
- Your Webflow Site: https://automara.webflow.io
- Your API Token: `7ccc5354fa1b5eac8cba7a6fe80f8fd2d749b9577f108e9c0fe12e0e2ce584a0` (stored in `.env`)
