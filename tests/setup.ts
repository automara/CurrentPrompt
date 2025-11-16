/**
 * Test Environment Setup & Validation
 *
 * This script validates that all required environment variables are present
 * and that external services are reachable before running tests.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config();

export interface EnvironmentCheck {
  name: string;
  required: boolean;
  present: boolean;
  valid?: boolean;
  error?: string;
}

export interface EnvironmentStatus {
  allRequired: boolean;
  checks: EnvironmentCheck[];
  errors: string[];
  warnings: string[];
}

/**
 * Validate environment configuration
 */
export async function validateEnvironment(): Promise<EnvironmentStatus> {
  const checks: EnvironmentCheck[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check Supabase (REQUIRED)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  checks.push({
    name: "SUPABASE_URL",
    required: true,
    present: !!supabaseUrl,
  });

  checks.push({
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    present: !!supabaseKey,
  });

  // Test Supabase connection
  if (supabaseUrl && supabaseKey) {
    try {
      const client = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await client.from('modules').select('count').limit(1);

      if (error) {
        checks.push({
          name: "Supabase Connection",
          required: true,
          present: true,
          valid: false,
          error: error.message,
        });
        errors.push(`Supabase connection failed: ${error.message}`);
      } else {
        checks.push({
          name: "Supabase Connection",
          required: true,
          present: true,
          valid: true,
        });
      }
    } catch (err: any) {
      checks.push({
        name: "Supabase Connection",
        required: true,
        present: true,
        valid: false,
        error: err.message,
      });
      errors.push(`Supabase connection error: ${err.message}`);
    }
  } else {
    errors.push("Supabase credentials missing - cannot start server");
  }

  // Check OpenRouter (REQUIRED for AI agents)
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  checks.push({
    name: "OPENROUTER_API_KEY",
    required: true,
    present: !!openrouterKey,
  });

  if (!openrouterKey) {
    errors.push("OpenRouter API key missing - AI agents will fail");
  }

  // Check OpenAI (REQUIRED for embeddings)
  const openaiKey = process.env.OPENAI_API_KEY;
  checks.push({
    name: "OPENAI_API_KEY",
    required: true,
    present: !!openaiKey,
  });

  if (!openaiKey) {
    errors.push("OpenAI API key missing - embeddings generation will fail");
  }

  // Check Webflow (OPTIONAL but needed for full test)
  const webflowToken = process.env.WEBFLOW_API_TOKEN;
  const webflowSiteId = process.env.WEBFLOW_SITE_ID;
  const webflowCollectionId = process.env.WEBFLOW_COLLECTION_ID;

  checks.push({
    name: "WEBFLOW_API_TOKEN",
    required: false,
    present: !!webflowToken,
  });

  checks.push({
    name: "WEBFLOW_SITE_ID",
    required: false,
    present: !!webflowSiteId,
  });

  checks.push({
    name: "WEBFLOW_COLLECTION_ID",
    required: false,
    present: !!webflowCollectionId,
  });

  if (!webflowToken || !webflowSiteId || !webflowCollectionId) {
    warnings.push("Webflow credentials incomplete - CMS sync will be skipped");
  }

  // Check fal.ai (OPTIONAL)
  const falKey = process.env.FAL_API_KEY;
  checks.push({
    name: "FAL_API_KEY",
    required: false,
    present: !!falKey,
  });

  if (!falKey) {
    warnings.push("fal.ai API key missing - thumbnail generation will be skipped");
  }

  // Determine if all required vars are present
  const allRequired = checks
    .filter(c => c.required)
    .every(c => c.present && c.valid !== false);

  return {
    allRequired,
    checks,
    errors,
    warnings,
  };
}

/**
 * Print environment status report
 */
export function printEnvironmentReport(status: EnvironmentStatus): void {
  console.log("\n" + "=".repeat(60));
  console.log("ENVIRONMENT VALIDATION REPORT");
  console.log("=".repeat(60) + "\n");

  // Print checks
  console.log("Configuration Checks:");
  console.log("-".repeat(60));

  for (const check of status.checks) {
    const icon = check.valid === false ? "✗" : (check.present ? "✓" : "✗");
    const label = check.required ? "[REQUIRED]" : "[OPTIONAL]";
    const statusText = check.valid === false ? "INVALID" : (check.present ? "OK" : "MISSING");

    console.log(`${icon} ${check.name.padEnd(30)} ${label.padEnd(12)} ${statusText}`);

    if (check.error) {
      console.log(`  └─ Error: ${check.error}`);
    }
  }

  console.log();

  // Print errors
  if (status.errors.length > 0) {
    console.log("❌ ERRORS:");
    status.errors.forEach(err => console.log(`   - ${err}`));
    console.log();
  }

  // Print warnings
  if (status.warnings.length > 0) {
    console.log("⚠️  WARNINGS:");
    status.warnings.forEach(warn => console.log(`   - ${warn}`));
    console.log();
  }

  // Print summary
  console.log("=".repeat(60));
  if (status.allRequired) {
    console.log("✅ All required environment variables are configured");
    console.log("✅ System is ready for testing");
  } else {
    console.log("❌ Missing required environment variables");
    console.log("❌ System cannot start - please configure missing variables");
  }
  console.log("=".repeat(60) + "\n");
}

/**
 * Run environment validation
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  validateEnvironment()
    .then(status => {
      printEnvironmentReport(status);
      process.exit(status.allRequired ? 0 : 1);
    })
    .catch(err => {
      console.error("Environment validation failed:", err);
      process.exit(1);
    });
}
