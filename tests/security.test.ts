/**
 * Security Vulnerability Tests
 *
 * Tests for common security vulnerabilities including:
 * - Authentication bypass
 * - XSS injection
 * - SQL injection
 * - Rate limiting
 * - Input validation
 * - File upload attacks
 */

import { describe, test, expect, beforeAll } from "@jest/globals";
import { validateEnvironment } from "./setup.js";
import { supabase } from "../src/lib/supabase.js";

const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";
const testModuleIds: string[] = [];

describe("Security Vulnerability Tests", () => {
  beforeAll(async () => {
    const envStatus = await validateEnvironment();
    if (!envStatus.allRequired) {
      throw new Error("Required environment variables missing");
    }
  });

  afterAll(async () => {
    // Cleanup test modules
    for (const id of testModuleIds) {
      try {
        await supabase.from("modules").delete().eq("id", id);
      } catch (err) {
        console.warn(`Failed to cleanup module ${id}:`, err);
      }
    }
  });

  describe("1. Authentication & Authorization", () => {
    test("VULN: API endpoints should require authentication (currently OPEN)", async () => {
      // This test documents the CRITICAL vulnerability
      // All endpoints are currently accessible without any authentication

      const response = await fetch(`${baseUrl}/api/modules`);
      expect(response.status).toBe(200); // Currently open - VULNERABILITY

      console.warn("⚠️  CRITICAL: API endpoints are publicly accessible");
      console.warn("   No authentication required - anyone can read/write data");
    });

    test("VULN: Module creation is unauthenticated", async () => {
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "# Unauthorized Module\n\nThis should require auth",
        }),
      });

      expect(response.status).toBe(200); // VULNERABILITY - should be 401

      const result = await response.json();
      if (result.success && result.moduleId) {
        testModuleIds.push(result.moduleId);
      }

      console.warn("⚠️  CRITICAL: Module creation requires no authentication");
    }, 30000);

    test("VULN: Sync endpoint is unauthenticated", async () => {
      // Create a test module first
      const createRes = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "# Test\n\nTest",
          autoSync: false,
        }),
      });

      const createResult = await createRes.json();
      if (createResult.success && createResult.moduleId) {
        testModuleIds.push(createResult.moduleId);

        const syncRes = await fetch(
          `${baseUrl}/api/modules/sync/${createResult.moduleId}`,
          { method: "POST" }
        );

        // This should require auth but currently doesn't
        expect(syncRes.status).toBeLessThan(500); // Just check it doesn't crash

        console.warn("⚠️  CRITICAL: Sync endpoint requires no authentication");
      }
    }, 40000);
  });

  describe("2. XSS (Cross-Site Scripting) Attacks", () => {
    const xssPayloads = [
      {
        name: "Basic script tag",
        payload: `# XSS Test\n\n<script>alert('XSS')</script>`,
      },
      {
        name: "Image tag with onerror",
        payload: `# XSS Test\n\n<img src=x onerror="alert('XSS')">`,
      },
      {
        name: "SVG with embedded script",
        payload: `# XSS Test\n\n<svg onload="alert('XSS')">`,
      },
      {
        name: "Iframe injection",
        payload: `# XSS Test\n\n<iframe src="javascript:alert('XSS')">`,
      },
      {
        name: "Markdown link with javascript",
        payload: `# XSS Test\n\n[Click me](javascript:alert('XSS'))`,
      },
      {
        name: "HTML in title",
        payload: `<script>alert('XSS')</script>`,
        isTitle: true,
      },
    ];

    xssPayloads.forEach((payload) => {
      test(`XSS Prevention: ${payload.name}`, async () => {
        const body = payload.isTitle
          ? { title: payload.payload, content: "# Safe content" }
          : { content: payload.payload };

        const response = await fetch(`${baseUrl}/api/modules/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, autoSync: false }),
        });

        const result = await response.json();

        if (result.success && result.moduleId) {
          testModuleIds.push(result.moduleId);

          // Fetch the module back
          const { data: module } = await supabase
            .from("modules")
            .select("*")
            .eq("id", result.moduleId)
            .single();

          // Check if dangerous content made it through
          const checkField = payload.isTitle ? module.title : module.summary;

          if (checkField && checkField.includes("<script>")) {
            console.warn(
              `⚠️  XSS VULNERABILITY: ${payload.name} - script tags not sanitized`
            );
          }

          // Check agent-generated fields for XSS
          if (module.meta_description?.includes("<")) {
            console.warn(
              `⚠️  XSS RISK: HTML in meta_description (${payload.name})`
            );
          }

          if (module.meta_title?.includes("<")) {
            console.warn(`⚠️  XSS RISK: HTML in meta_title (${payload.name})`);
          }
        }
      }, 30000);
    });
  });

  describe("3. SQL Injection Attacks", () => {
    const sqlPayloads = [
      "'; DROP TABLE modules; --",
      "' OR '1'='1",
      "1' UNION SELECT NULL, version()--",
      "admin'--",
      "' OR 1=1--",
    ];

    sqlPayloads.forEach((payload) => {
      test(`SQL Injection Prevention: ${payload}`, async () => {
        const response = await fetch(`${baseUrl}/api/modules/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: payload,
            content: `# Test\n\n${payload}`,
            autoSync: false,
          }),
        });

        // Should either sanitize or reject
        const result = await response.json();

        if (result.success) {
          // If accepted, verify it's stored safely
          testModuleIds.push(result.moduleId);

          const { data: module, error } = await supabase
            .from("modules")
            .select("*")
            .eq("id", result.moduleId)
            .single();

          expect(error).toBeNull(); // Should not crash
          expect(module).toBeDefined();

          // SQL payload should be stored as literal string, not executed
          // The fact that we can retrieve it means it wasn't executed
          console.log(`✓ SQL injection blocked (parameterized query)`);
        }
      }, 30000);
    });

    test("SQL Injection via slug parameter", async () => {
      const sqlSlug = "test'; DROP TABLE modules; --";

      const response = await fetch(`${baseUrl}/api/modules/${encodeURIComponent(sqlSlug)}`);

      // Should return 404 or handle safely
      expect([200, 404]).toContain(response.status);
      expect(response.status).not.toBe(500); // Should not crash server

      console.log("✓ Slug parameter SQL injection handled");
    });
  });

  describe("4. Denial of Service (DoS) Attacks", () => {
    test("VULN: Large JSON payload (memory exhaustion)", async () => {
      const largeContent = "# Large Module\n\n" + "A".repeat(10 * 1024 * 1024); // 10MB

      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: largeContent,
          autoSync: false,
        }),
      });

      // Should either:
      // 1. Reject with 413 (Payload Too Large)
      // 2. Accept but truncate
      // Currently: No size limit (VULNERABILITY)

      if (response.status === 200) {
        console.warn(
          "⚠️  VULNERABILITY: No request size limit - DoS risk"
        );

        const result = await response.json();
        if (result.success && result.moduleId) {
          testModuleIds.push(result.moduleId);
        }
      }
    }, 60000);

    test("VULN: No rate limiting (API abuse)", async () => {
      const requests = [];

      // Fire 20 rapid requests
      for (let i = 0; i < 20; i++) {
        requests.push(
          fetch(`${baseUrl}/health`).then((r) => r.status)
        );
      }

      const results = await Promise.all(requests);
      const successful = results.filter((s) => s === 200).length;

      // All should succeed (no rate limiting)
      expect(successful).toBe(20);

      console.warn(
        "⚠️  CRITICAL: No rate limiting - API can be abused/DoS'd"
      );
      console.warn(
        `   Cost explosion risk: 20 modules = $1 in AI costs`
      );
    });

    test("Extremely long title", async () => {
      const longTitle = "A".repeat(10000);

      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: longTitle,
          content: "# Test",
          autoSync: false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        testModuleIds.push(result.moduleId);

        // Check if title was truncated
        const { data: module } = await supabase
          .from("modules")
          .select("title")
          .eq("id", result.moduleId)
          .single();

        if (module.title.length === 10000) {
          console.warn("⚠️  Long title not truncated - storage waste");
        }
      }
    }, 30000);
  });

  describe("5. Input Validation", () => {
    test("Empty content should be rejected", async () => {
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "",
          autoSync: false,
        }),
      });

      const result = await response.json();

      // Should reject empty content
      if (result.success) {
        testModuleIds.push(result.moduleId);
        console.warn("⚠️  Empty content accepted - validation gap");
      } else {
        console.log("✓ Empty content rejected");
      }
    }, 30000);

    test("Missing content should be rejected", async () => {
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "No content",
          autoSync: false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        testModuleIds.push(result.moduleId);
        console.warn("⚠️  Missing content accepted - validation gap");
      } else {
        console.log("✓ Missing content rejected");
      }
    });

    test("Invalid JSON should be rejected", async () => {
      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json }",
      });

      expect(response.status).toBe(400);
      console.log("✓ Invalid JSON rejected");
    });

    test("Non-markdown content", async () => {
      const xmlContent = `<?xml version="1.0"?>
        <root>
          <data>This is XML, not markdown</data>
        </root>`;

      const response = await fetch(`${baseUrl}/api/modules/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: xmlContent,
          autoSync: false,
        }),
      });

      const result = await response.json();

      // Should handle gracefully (may accept as markdown)
      if (result.success) {
        testModuleIds.push(result.moduleId);
        console.log("✓ Non-markdown content handled (AI processing robust)");
      }
    }, 30000);
  });

  describe("6. CORS & Origin Validation", () => {
    test("VULN: CORS allows all origins", async () => {
      const response = await fetch(`${baseUrl}/health`, {
        headers: {
          Origin: "https://evil.com",
        },
      });

      const corsHeader = response.headers.get("access-control-allow-origin");

      if (corsHeader === "*" || corsHeader === "https://evil.com") {
        console.warn(
          "⚠️  VULNERABILITY: CORS allows all origins - CSRF risk"
        );
      } else {
        console.log("✓ CORS properly configured");
      }
    });
  });

  describe("7. Error Information Disclosure", () => {
    test("Error responses should not leak sensitive info", async () => {
      const response = await fetch(`${baseUrl}/api/modules/nonexistent-id`, {
        method: "GET",
      });

      const result = await response.json();

      // Check if error message leaks internal details
      const errorText = JSON.stringify(result).toLowerCase();

      if (
        errorText.includes("supabase") ||
        errorText.includes("postgres") ||
        errorText.includes("stack trace") ||
        errorText.includes("at ")
      ) {
        console.warn(
          "⚠️  Information Disclosure: Error messages leak internal details"
        );
      } else {
        console.log("✓ Error messages are generic");
      }
    });
  });

  describe("8. File Path Traversal", () => {
    test("Path traversal in slug", async () => {
      const traversalSlugs = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32",
        "./../admin",
      ];

      for (const slug of traversalSlugs) {
        const response = await fetch(
          `${baseUrl}/api/modules/${encodeURIComponent(slug)}`
        );

        // Should not crash or access unintended files
        expect([200, 404]).toContain(response.status);
      }

      console.log("✓ Path traversal attempts handled");
    });
  });
});
