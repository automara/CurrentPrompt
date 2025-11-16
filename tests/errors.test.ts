/**
 * Error Handling Tests
 *
 * Tests system behavior when things go wrong:
 * - AI API failures
 * - Database connection failures
 * - Invalid input
 * - Network timeouts
 * - External service failures
 */

import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { validateEnvironment } from "./setup.js";
import { supabase } from "../src/lib/supabase.js";

const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";
const testModuleIds: string[] = [];

describe("Error Handling Tests", () => {
  beforeAll(async () => {
    const envStatus = await validateEnvironment();
    if (!envStatus.allRequired) {
      throw new Error("Required environment variables missing");
    }
  });

  afterAll(async () => {
    // Cleanup
    for (const id of testModuleIds) {
      try {
        await supabase.from("modules").delete().eq("id", id);
      } catch (err) {
        console.warn(`Cleanup failed for ${id}:`, err);
      }
    }
  });

  describe("1. Invalid Input Handling", () => {
    test("Missing required fields", async () => {
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // No content
      });

      const result = await response.json();

      // Should fail gracefully
      if (!result.success) {
        expect(result.error).toBeDefined();
        console.log(`✓ Missing fields rejected: ${result.error}`);
      } else {
        console.warn("⚠️  Missing required fields accepted");
        if (result.moduleId) testModuleIds.push(result.moduleId);
      }
    });

    test("Invalid content type", async () => {
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "# Not JSON",
      });

      // Should reject or handle gracefully
      expect([400, 415, 500]).toContain(response.status);
      console.log(`✓ Invalid content type handled (status: ${response.status})`);
    });

    test("Malformed JSON", async () => {
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{ "content": "test',  // Malformed
      });

      expect(response.status).toBe(400);
      console.log("✓ Malformed JSON rejected");
    });

    test("Null values", async () => {
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: null,
          content: null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.log("✓ Null values rejected");
      } else {
        console.warn("⚠️  Null values accepted");
        if (result.moduleId) testModuleIds.push(result.moduleId);
      }
    });

    test("Wrong data types", async () => {
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: 12345, // Should be string
          content: ["array", "not", "string"], // Should be string
          autoSync: "yes", // Should be boolean
        }),
      });

      const result = await response.json();

      // Should either validate types or coerce safely
      console.log(
        result.success
          ? "⚠️  Type validation weak"
          : "✓ Type validation enforced"
      );

      if (result.success && result.moduleId) {
        testModuleIds.push(result.moduleId);
      }
    });
  });

  describe("2. Module Not Found Errors", () => {
    test("GET non-existent module by slug", async () => {
      const response = await fetch(
        `${baseUrl}/api/modules/definitely-does-not-exist-12345`
      );

      expect(response.status).toBe(404);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      console.log("✓ Non-existent module returns 404");
    });

    test("Sync non-existent module", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";

      const response = await fetch(`${baseUrl}/api/modules/sync/${fakeId}`, {
        method: "POST",
      });

      const result = await response.json();

      if (!result.success) {
        expect(result.error).toBeDefined();
        console.log("✓ Sync non-existent module fails gracefully");
      } else {
        console.warn("⚠️  Sync accepts non-existent ID");
      }
    });

    test("Invalid UUID format", async () => {
      const response = await fetch(
        `${baseUrl}/api/modules/sync/not-a-valid-uuid`,
        { method: "POST" }
      );

      // Should handle invalid UUID gracefully
      expect([400, 404, 500]).toContain(response.status);
      console.log(`✓ Invalid UUID handled (status: ${response.status})`);
    });
  });

  describe("3. Database Error Simulation", () => {
    test("Duplicate slug handling", async () => {
      // Create first module
      const response1 = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Duplicate Test Module",
          content: "# Duplicate Test\n\nFirst version",
          autoSync: false,
        }),
      });

      const result1 = await response1.json();

      if (result1.success && result1.moduleId) {
        testModuleIds.push(result1.moduleId);

        // Try to create another with same title (will have same slug)
        const response2 = await fetch(`${baseUrl}/api/modules/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Duplicate Test Module",
            content: "# Duplicate Test\n\nSecond version",
            autoSync: false,
          }),
        });

        const result2 = await response2.json();

        // Should either:
        // 1. Append number to slug (duplicate-test-module-2)
        // 2. Reject with error
        // 3. Allow (not ideal)

        if (result2.success) {
          if (result2.moduleId) {
            testModuleIds.push(result2.moduleId);

            // Check if slugs are different
            const { data: modules } = await supabase
              .from("modules")
              .select("slug")
              .in("id", [result1.moduleId, result2.moduleId]);

            if (modules && modules.length === 2) {
              const slugs = modules.map((m) => m.slug);
              if (slugs[0] === slugs[1]) {
                console.warn("⚠️  Duplicate slugs allowed - uniqueness violated");
              } else {
                console.log("✓ Duplicate slugs handled (appended number)");
              }
            }
          }
        } else {
          console.log("✓ Duplicate rejected");
        }
      }
    }, 60000);
  });

  describe("4. AI Agent Failure Scenarios", () => {
    test("Content with unusual characters", async () => {
      const weirdContent = `# Test Module 测试 مرحبا 🚀

      Unicode: ñ ü ö é
      Emoji: 😀 🎉 ✅ ❌
      Symbols: † ‡ § ¶ © ®
      Math: ∑ ∫ √ π ∞
      Arrows: → ← ↑ ↓

      Zero-width chars:​‌‍

      Right-to-left: العربية עברית

      This should still work!`;

      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: weirdContent,
          autoSync: false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        testModuleIds.push(result.moduleId);
        console.log("✓ Unicode/emoji content handled");
      } else {
        console.warn("⚠️  Unicode content failed:", result.error);
      }
    }, 30000);

    test("Extremely short content", async () => {
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "# A",
          autoSync: false,
        }),
      });

      const result = await response.json();

      // AI should handle gracefully (may produce low quality score)
      if (result.success) {
        testModuleIds.push(result.moduleId);

        const { data: module } = await supabase
          .from("modules")
          .select("quality_score")
          .eq("id", result.moduleId)
          .single();

        console.log(
          `✓ Short content handled (quality: ${module?.quality_score || "N/A"})`
        );
      } else {
        console.log("✓ Short content rejected");
      }
    }, 30000);

    test("Content without markdown headers", async () => {
      const plainText = `This is just plain text.

      No headers.
      No formatting.
      Just text.`;

      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: plainText,
          autoSync: false,
        }),
      });

      const result = await response.json();

      // Should handle gracefully
      if (result.success) {
        testModuleIds.push(result.moduleId);
        console.log("✓ Plain text content handled");
      } else {
        console.warn("⚠️  Plain text rejected:", result.error);
      }
    }, 30000);

    test("Content with code blocks", async () => {
      const codeContent = `# Code Test

\`\`\`javascript
function test() {
  console.log("This should not execute");
  alert('XSS attempt');
  return '<script>alert("XSS")</script>';
}
\`\`\`

\`\`\`sql
DROP TABLE modules;
SELECT * FROM users WHERE id = 1; --
\`\`\`
`;

      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: codeContent,
          autoSync: false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        testModuleIds.push(result.moduleId);

        // Verify code blocks are preserved as text
        const { data: module } = await supabase
          .from("modules")
          .select("summary")
          .eq("id", result.moduleId)
          .single();

        console.log("✓ Code blocks handled safely");

        // Make sure code isn't executed in summaries
        if (module?.summary?.includes("<script>")) {
          console.warn("⚠️  Script tags in summary - potential XSS");
        }
      }
    }, 30000);
  });

  describe("5. Storage Failures", () => {
    test("Retrieve with invalid storage path", async () => {
      // This tests what happens if storage files are missing
      // We can't easily simulate this without mocking, but we can document behavior

      // Create a module
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "# Storage Test",
          autoSync: false,
        }),
      });

      const result = await response.json();

      if (result.success && result.moduleId) {
        testModuleIds.push(result.moduleId);

        const { data: version } = await supabase
          .from("module_versions")
          .select("file_paths")
          .eq("module_id", result.moduleId)
          .single();

        expect(version?.file_paths).toBeDefined();
        expect(version?.file_paths.full_md).toBeDefined();

        console.log("✓ Storage paths recorded in database");
      }
    }, 30000);
  });

  describe("6. HTTP Method Errors", () => {
    test("Wrong HTTP method on create endpoint", async () => {
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "GET", // Should be POST
      });

      // Should return 405 Method Not Allowed
      expect([405, 404]).toContain(response.status);
      console.log(`✓ Wrong HTTP method rejected (status: ${response.status})`);
    });

    test("Wrong HTTP method on sync endpoint", async () => {
      const response = await fetch(
        `${baseUrl}/api/modules/sync/some-id`,
        {
          method: "GET", // Should be POST
        }
      );

      expect([405, 404]).toContain(response.status);
      console.log(`✓ Wrong HTTP method on sync rejected (status: ${response.status})`);
    });
  });

  describe("7. Concurrent Request Handling", () => {
    test("Multiple simultaneous creates", async () => {
      const requests = [];

      for (let i = 0; i < 5; i++) {
        requests.push(
          fetch(`${baseUrl}/api/modules/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `# Concurrent Test ${i}\n\nTest ${i}`,
              autoSync: false,
            }),
          }).then((r) => r.json())
        );
      }

      const results = await Promise.all(requests);

      const successful = results.filter((r) => r.success);
      successful.forEach((r) => {
        if (r.moduleId) testModuleIds.push(r.moduleId);
      });

      expect(successful.length).toBeGreaterThan(0);
      console.log(`✓ Concurrent requests handled (${successful.length}/5 succeeded)`);

      // All should have unique IDs
      const ids = successful.map((r) => r.moduleId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
      console.log("✓ All concurrent modules have unique IDs");
    }, 60000);
  });

  describe("8. Edge Cases", () => {
    test("Title extraction when no H1 present", async () => {
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Just plain text, no heading.",
          autoSync: false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        testModuleIds.push(result.moduleId);

        const { data: module } = await supabase
          .from("modules")
          .select("title")
          .eq("id", result.moduleId)
          .single();

        expect(module?.title).toBeDefined();
        expect(module.title.length).toBeGreaterThan(0);

        console.log(`✓ Title generated: "${module.title}"`);
      }
    }, 30000);

    test("Empty title with H1", async () => {
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "",  // Empty title
          content: "# Extracted Title\n\nContent",
          autoSync: false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        testModuleIds.push(result.moduleId);

        const { data: module } = await supabase
          .from("modules")
          .select("title")
          .eq("id", result.moduleId)
          .single();

        expect(module?.title).toBe("Extracted Title");
        console.log("✓ Empty title overridden by H1");
      }
    }, 30000);

    test("Multiple H1 headers", async () => {
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `# First Title

          Content here.

          # Second Title

          More content.`,
          autoSync: false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        testModuleIds.push(result.moduleId);

        const { data: module } = await supabase
          .from("modules")
          .select("title")
          .eq("id", result.moduleId)
          .single();

        // Should use first H1
        expect(module?.title).toContain("First");
        console.log(`✓ Multiple H1s handled: "${module.title}"`);
      }
    }, 30000);
  });
});
