/**
 * End-to-End Integration Tests
 *
 * Tests the complete flow from content creation through Supabase storage to Webflow sync.
 * This validates all 7 AI agents, database operations, file storage, and CMS integration.
 */

import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { validateEnvironment } from "./setup.js";
import { supabase } from "../src/lib/supabase.js";
import type { Module } from "../src/lib/supabase.js";

// Test data
const TEST_MODULE_CONTENT = `# Test Module: AI-Powered Testing

This is a comprehensive test module to validate the entire content pipeline.

## Features

- Content generation via 7 AI agents
- Automatic metadata extraction
- Vector embeddings for semantic search
- Webflow CMS integration

## Technical Details

This module tests:
1. Summary generation (short, medium, long)
2. SEO optimization (meta title, description, keywords)
3. Category classification
4. Tag extraction
5. Schema.org JSON-LD generation
6. Image prompt creation
7. Vector embeddings (3072 dimensions)
8. Quality validation

## Security Testing

This content also helps verify:
- Input sanitization
- XSS prevention
- SQL injection protection
- Rate limiting
- Authentication requirements

## Expected Outcome

If this test passes, all systems are working correctly and securely.
`;

let testModuleId: string | null = null;
let testModuleSlug: string | null = null;
const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("End-to-End Integration Tests", () => {
  beforeAll(async () => {
    // Validate environment before running tests
    const envStatus = await validateEnvironment();
    if (!envStatus.allRequired) {
      throw new Error(
        "Required environment variables missing. Run: npm run test:env"
      );
    }
  });

  afterAll(async () => {
    // Cleanup: Delete test module if created
    if (testModuleId) {
      try {
        await supabase.from("modules").delete().eq("id", testModuleId);
        console.log(`✓ Cleaned up test module: ${testModuleId}`);
      } catch (err) {
        console.warn(`Failed to cleanup test module:`, err);
      }
    }
  });

  describe("1. Module Creation via JSON API", () => {
    test("POST /api/modules/create should create module with AI processing", async () => {
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Module: AI-Powered Testing",
          content: TEST_MODULE_CONTENT,
          autoSync: false, // Don't sync to Webflow in test
        }),
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.moduleId).toBeDefined();

      testModuleId = result.moduleId;
    }, 30000); // 30s timeout for AI processing

    test("Module should exist in database with all agent-generated fields", async () => {
      expect(testModuleId).toBeDefined();

      const { data: module, error } = await supabase
        .from("modules")
        .select("*")
        .eq("id", testModuleId)
        .single();

      expect(error).toBeNull();
      expect(module).toBeDefined();

      // Core fields
      expect(module.title).toBe("Test Module: AI-Powered Testing");
      expect(module.slug).toBeDefined();
      expect(module.status).toBe("draft");
      expect(module.latest_version).toBe(1);

      testModuleSlug = module.slug;

      // Agent-generated fields
      expect(module.summary_short).toBeDefined();
      expect(module.summary_short.length).toBeGreaterThan(100);
      expect(module.summary_short.length).toBeLessThan(250);

      expect(module.summary_medium).toBeDefined();
      expect(module.summary_medium.length).toBeGreaterThan(200);
      expect(module.summary_medium.length).toBeLessThan(400);

      expect(module.summary_long).toBeDefined();
      expect(module.summary_long.length).toBeGreaterThan(400);

      expect(module.meta_title).toBeDefined();
      expect(module.meta_title.length).toBeGreaterThanOrEqual(50);
      expect(module.meta_title.length).toBeLessThanOrEqual(60);

      expect(module.meta_description).toBeDefined();
      expect(module.meta_description.length).toBeGreaterThanOrEqual(150);
      expect(module.meta_description.length).toBeLessThanOrEqual(160);

      expect(module.seo_keywords).toBeDefined();
      expect(Array.isArray(module.seo_keywords)).toBe(true);
      expect(module.seo_keywords.length).toBeGreaterThanOrEqual(5);
      expect(module.seo_keywords.length).toBeLessThanOrEqual(10);

      expect(module.category).toBeDefined();
      expect(["Claude Skills", "PRDs", "Research", "Guides", "Tools", "General"]).toContain(module.category);

      expect(module.tags).toBeDefined();
      expect(Array.isArray(module.tags)).toBe(true);
      expect(module.tags.length).toBeGreaterThanOrEqual(3);

      expect(module.schema_json).toBeDefined();
      expect(typeof module.schema_json).toBe("object");
      expect(module.schema_json["@context"]).toBe("https://schema.org");

      expect(module.image_prompt).toBeDefined();
      expect(module.image_prompt.length).toBeGreaterThan(100);

      expect(module.quality_score).toBeDefined();
      expect(module.quality_score).toBeGreaterThanOrEqual(0);
      expect(module.quality_score).toBeLessThanOrEqual(100);

      console.log(`✓ Module created with quality score: ${module.quality_score}/100`);
    });

    test("Module version should be created", async () => {
      expect(testModuleId).toBeDefined();

      const { data: version, error } = await supabase
        .from("module_versions")
        .select("*")
        .eq("module_id", testModuleId)
        .eq("version", 1)
        .single();

      expect(error).toBeNull();
      expect(version).toBeDefined();
      expect(version.file_paths).toBeDefined();
      expect(version.file_paths.full_md).toBeDefined();
      expect(version.file_paths.summary_md).toBeDefined();
    });

    test("Module embeddings should be created", async () => {
      expect(testModuleId).toBeDefined();

      const { data: embedding, error } = await supabase
        .from("module_embeddings")
        .select("*")
        .eq("module_id", testModuleId)
        .single();

      expect(error).toBeNull();
      expect(embedding).toBeDefined();
      expect(embedding.embedding).toBeDefined();
      expect(Array.isArray(embedding.embedding)).toBe(true);

      // Check vector dimensions (should be 3072 for text-embedding-3-large)
      const dimensions = embedding.embedding.length;
      expect([1536, 3072]).toContain(dimensions); // Allow both models
      console.log(`✓ Embeddings created with ${dimensions} dimensions`);
    });
  });

  describe("2. Supabase Storage Verification", () => {
    test("full.md should be uploaded to storage", async () => {
      expect(testModuleSlug).toBeDefined();

      const path = `${testModuleSlug}/v1/full.md`;
      const { data, error } = await supabase.storage
        .from("modules")
        .download(path);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const content = await data.text();
      expect(content).toContain("# Test Module: AI-Powered Testing");
      expect(content).toBe(TEST_MODULE_CONTENT);
    });

    test("summary.md should be uploaded to storage", async () => {
      expect(testModuleSlug).toBeDefined();

      const path = `${testModuleSlug}/v1/summary.md`;
      const { data, error } = await supabase.storage
        .from("modules")
        .download(path);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const content = await data.text();
      expect(content.length).toBeGreaterThan(0);
      expect(content.length).toBeLessThan(TEST_MODULE_CONTENT.length); // Summary should be shorter
    });

    test("bundle.zip should exist in storage", async () => {
      expect(testModuleSlug).toBeDefined();

      const path = `${testModuleSlug}/v1/bundle.zip`;
      const { data, error } = await supabase.storage
        .from("modules")
        .download(path);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test("Public URLs should be accessible", async () => {
      expect(testModuleSlug).toBeDefined();

      const { data } = supabase.storage
        .from("modules")
        .getPublicUrl(`${testModuleSlug}/v1/full.md`);

      expect(data.publicUrl).toBeDefined();
      expect(data.publicUrl).toContain("supabase.co");

      // Try to fetch the public URL
      const response = await fetch(data.publicUrl);
      expect(response.status).toBe(200);

      const content = await response.text();
      expect(content).toContain("# Test Module: AI-Powered Testing");
    });
  });

  describe("3. Module Retrieval via API", () => {
    test("GET /api/modules/:slug should return module", async () => {
      expect(testModuleSlug).toBeDefined();

      const response = await fetch(`${baseUrl}/api/modules/${testModuleSlug}`);
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.slug).toBe(testModuleSlug);
      expect(result.data.title).toBe("Test Module: AI-Powered Testing");
    });

    test("GET /api/modules should include test module (if published)", async () => {
      // First publish the module
      expect(testModuleId).toBeDefined();

      await supabase
        .from("modules")
        .update({ status: "published" })
        .eq("id", testModuleId);

      const response = await fetch(`${baseUrl}/api/modules`);
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);

      const testModule = result.data.find((m: Module) => m.id === testModuleId);
      expect(testModule).toBeDefined();
    });
  });

  describe("4. Webflow Sync (Optional)", () => {
    test("POST /api/modules/sync/:id should sync to Webflow", async () => {
      // Skip if Webflow not configured
      if (
        !process.env.WEBFLOW_API_TOKEN ||
        !process.env.WEBFLOW_SITE_ID ||
        !process.env.WEBFLOW_COLLECTION_ID
      ) {
        console.log("⊘ Skipping Webflow sync test (credentials not configured)");
        return;
      }

      expect(testModuleId).toBeDefined();

      const response = await fetch(
        `${baseUrl}/api/modules/sync/${testModuleId}`,
        {
          method: "POST",
        }
      );

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);

      // Verify webflow_id was set
      const { data: module } = await supabase
        .from("modules")
        .select("webflow_id")
        .eq("id", testModuleId)
        .single();

      expect(module.webflow_id).toBeDefined();
      console.log(`✓ Synced to Webflow with ID: ${module.webflow_id}`);
    }, 10000); // 10s timeout for API call
  });

  describe("5. Agent Health Check", () => {
    test("GET /api/test-agents/health should return ready status", async () => {
      const response = await fetch(`${baseUrl}/api/test-agents/health`);
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.status).toBe("ok");
      expect(result.agents).toBe("ready");
      expect(result.ready).toBe(true);
      expect(result.environment.supabase).toBe(true);
      expect(result.environment.openrouter).toBe(true);
      expect(result.environment.openai).toBe(true);
    });
  });

  describe("6. System Health Check", () => {
    test("GET /health should return ok status", async () => {
      const response = await fetch(`${baseUrl}/health`);
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.status).toBe("ok");
      expect(result.timestamp).toBeDefined();
    });
  });
});
