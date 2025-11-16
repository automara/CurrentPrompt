import fs from "fs/promises";
import path from "path";
import { createModule, createModuleVersion } from "./moduleService.js";
import { generateThumbnail } from "./thumbnailService.js";
import { syncModuleToWebflowV2 } from "./webflowV2Service.js";
import { generateContentMetadata, generateSummaryMarkdown } from "./mastraService.js";
import { uploadModuleFiles } from "./storageService.js";

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

    // Step 4: Generate summary markdown
    const summaryContent = await generateSummaryMarkdown(processed.content);

    // Step 5: Upload files to Supabase Storage
    const filePaths = await uploadModuleFiles(
      module.slug,
      1,
      processed.content,
      summaryContent
    );

    console.log(`✓ Files uploaded to Supabase Storage`);

    // Step 6: Create version record
    await createModuleVersion(module.id, 1, processed.changelog, filePaths);

    console.log(`✓ Version 1 created with files`);

    // Step 7: Generate thumbnail with fal.ai
    const thumbnailUrl = await generateThumbnail(
      processed.title,
      processed.category
    );

    if (thumbnailUrl) {
      console.log(`✓ Thumbnail generated: ${thumbnailUrl}`);
    }

    // Step 8: Sync to Webflow (if enabled)
    if (autoSync) {
      const synced = await syncModuleToWebflowV2(module);
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
 */
async function cleanAndExtractMetadata(
  content: string,
  filePath: string
): Promise<ProcessedModule> {
  const filename = path.basename(filePath, ".md");
  const lines = content.split("\n");

  // Extract initial title (first H1 or filename)
  let initialTitle = filename
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const firstH1 = lines.find((line) => line.startsWith("# "));
  if (firstH1) {
    initialTitle = firstH1.replace("# ", "").trim();
  }

  console.log(`🤖 Using Mastra to generate metadata for: ${initialTitle}`);

  // Use Mastra to generate all metadata
  const metadata = await generateContentMetadata(initialTitle, content);

  // Generate slug from final title
  const slug = metadata.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  console.log(`✓ Mastra generated: ${metadata.tags.length} tags, category: ${metadata.category}`);

  return {
    title: metadata.title,
    slug,
    category: metadata.category,
    tags: metadata.tags,
    summary: metadata.summary,
    metaDescription: metadata.metaDescription,
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

