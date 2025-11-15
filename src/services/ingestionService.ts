import fs from "fs/promises";
import path from "path";
import { createModule, createModuleVersion } from "./moduleService.js";
import { generateThumbnail } from "./thumbnailService.js";
import { syncModuleToWebflow } from "./webflowService.js";

/**
 * Ingestion Service - Process uploaded markdown files through the pipeline
 *
 * Pipeline: MD Upload → Mastra Cleaning → Supabase → fal.ai Thumbnail → Webflow
 */

interface ProcessedModule {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  summary: string;
  metaDescription: string;
  changelog: string;
  content: string;
}

/**
 * Process a markdown file through the complete ingestion pipeline
 */
export async function processMarkdownFile(
  filePath: string,
  autoSync = true
): Promise<{ success: boolean; moduleId?: string; error?: string }> {
  try {
    console.log(`📝 Processing markdown file: ${filePath}`);

    // Step 1: Read the file
    const content = await fs.readFile(filePath, "utf-8");

    // Step 2: Clean and extract metadata with Mastra
    const processed = await cleanAndExtractMetadata(content, filePath);

    // Step 3: Create module in Supabase
    const module = await createModule(
      processed.title,
      processed.slug,
      processed.category,
      processed.tags,
      processed.summary,
      undefined, // sourceUrl
      undefined, // sourceLabel
      "published" // status
    );

    if (!module) {
      throw new Error("Failed to create module in database");
    }

    console.log(`✓ Module created: ${module.id}`);

    // Step 4: Upload files to Supabase Storage
    const filePaths = await uploadFilesToStorage(
      module.slug,
      1,
      processed.content
    );

    // Step 5: Create version record
    await createModuleVersion(module.id, 1, processed.changelog, filePaths);

    console.log(`✓ Version 1 created with files`);

    // Step 6: Generate thumbnail with fal.ai
    const thumbnailUrl = await generateThumbnail(
      processed.title,
      processed.category
    );

    if (thumbnailUrl) {
      console.log(`✓ Thumbnail generated: ${thumbnailUrl}`);
    }

    // Step 7: Sync to Webflow (if enabled)
    if (autoSync) {
      const synced = await syncModuleToWebflow(module);
      if (synced) {
        console.log(`✓ Module synced to Webflow`);
      } else {
        console.warn(`⚠️  Webflow sync failed (check credentials)`);
      }
    }

    console.log(`✅ Successfully processed module: ${module.title}`);

    return { success: true, moduleId: module.id };
  } catch (error) {
    console.error("Error processing markdown file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Clean markdown and extract metadata using Mastra agent
 * TODO: Integrate with actual Mastra workflow
 */
async function cleanAndExtractMetadata(
  content: string,
  filePath: string
): Promise<ProcessedModule> {
  // For now, use simple extraction logic
  // This will be replaced with Mastra agent in Phase 3

  const filename = path.basename(filePath, ".md");
  const lines = content.split("\n");

  // Extract title (first H1 or filename)
  let title = filename
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const firstH1 = lines.find((line) => line.startsWith("# "));
  if (firstH1) {
    title = firstH1.replace("# ", "").trim();
  }

  // Generate slug
  const slug = filename.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  // Extract summary (first paragraph after title)
  const firstParagraph = lines.find(
    (line) => line.trim().length > 50 && !line.startsWith("#")
  );
  const summary =
    firstParagraph?.substring(0, 200) ||
    "A curated knowledge module from CurrentPrompt";

  // Auto-categorize based on content
  const category = inferCategory(content, filename);

  // Extract tags
  const tags = extractTags(content);

  // Generate meta description
  const metaDescription = summary.substring(0, 160);

  return {
    title,
    slug,
    category,
    tags,
    summary,
    metaDescription,
    changelog: "Initial version",
    content,
  };
}

/**
 * Infer category from content and filename
 */
function inferCategory(content: string, filename: string): string {
  const lower = content.toLowerCase() + " " + filename.toLowerCase();

  if (lower.includes("skill") || lower.includes("claude")) {
    return "Claude Skills";
  }
  if (lower.includes("prd") || lower.includes("product requirement")) {
    return "PRDs";
  }
  if (lower.includes("research") || lower.includes("paper")) {
    return "Research";
  }
  if (lower.includes("guide") || lower.includes("tutorial")) {
    return "Guides";
  }

  return "General";
}

/**
 * Extract relevant tags from content
 */
function extractTags(content: string): string[] {
  const tags: string[] = [];
  const lower = content.toLowerCase();

  // Common technology tags
  const techTerms = [
    "ai",
    "claude",
    "ux",
    "design",
    "development",
    "automation",
    "productivity",
    "debugging",
    "testing",
    "api",
    "webflow",
    "typescript",
    "javascript",
  ];

  for (const term of techTerms) {
    if (lower.includes(term)) {
      tags.push(term);
    }
  }

  return tags.slice(0, 5); // Limit to 5 tags
}

/**
 * Upload files to Supabase Storage
 * TODO: Implement actual Supabase Storage upload
 */
async function uploadFilesToStorage(
  slug: string,
  version: number,
  content: string
): Promise<{
  full_md?: string;
  summary_md?: string;
  bundle_zip?: string;
  thumbnail?: string;
}> {
  // For now, return placeholder paths
  // This will be implemented with actual Supabase Storage in Phase 3

  const basePath = `${slug}/v${version}`;

  return {
    full_md: `${basePath}/full.md`,
    summary_md: `${basePath}/summary.md`,
    bundle_zip: `${basePath}/bundle.zip`,
  };
}

/**
 * Generate a summary version of the markdown
 */
function generateSummary(content: string): string {
  const lines = content.split("\n");
  const summaryLines: string[] = [];

  // Keep title and first few sections
  let sectionCount = 0;
  for (const line of lines) {
    if (line.startsWith("# ")) {
      summaryLines.push(line);
    } else if (line.startsWith("## ")) {
      if (sectionCount < 3) {
        summaryLines.push(line);
        sectionCount++;
      } else {
        break;
      }
    } else if (sectionCount > 0) {
      summaryLines.push(line);
    }
  }

  return summaryLines.join("\n");
}
