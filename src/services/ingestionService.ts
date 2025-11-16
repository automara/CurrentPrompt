import fs from "fs/promises";
import path from "path";
import { createModule, createModuleVersion, createModuleEmbedding } from "./moduleService.js";
import { generateThumbnail } from "./thumbnailService.js";
import { syncModuleToWebflowV2 } from "./webflowV2Service.js";
import { uploadModuleFiles } from "./storageService.js";
import { executeAgentWorkflow } from "../agents/coordinator.js";

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
 * @deprecated Use processMarkdownContent instead for better Railway compatibility
 */
export async function processMarkdownFile(
  filePath: string,
  autoSync = true
): Promise<{ success: boolean; moduleId?: string; error?: string }> {
  try {
    console.log(`📝 Processing markdown file: ${filePath}`);

    // Read the file
    const content = await fs.readFile(filePath, "utf-8");

    // Extract title from filename
    const filename = path.basename(filePath, ".md");
    const title = filename
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Delegate to content-based processor
    return await processMarkdownContent(content, title, autoSync);
  } catch (error) {
    console.error("Error processing markdown file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process markdown content through the complete ingestion pipeline
 */
export async function processMarkdownContent(
  content: string,
  title?: string,
  autoSync = true
): Promise<{ success: boolean; moduleId?: string; error?: string }> {
  try {
    console.log(`📝 Processing markdown content: ${title || 'Untitled'}`);

    // Step 2: Clean and extract metadata with AI Agents
    const processed = await cleanAndExtractMetadata(content, title);
    const { agentResults } = processed;

    // Step 3: Create module in Supabase with all agent-generated fields
    const module = await createModule(
      processed.title,
      processed.slug,
      processed.category,
      processed.tags,
      processed.summary,
      undefined, // sourceUrl
      undefined, // sourceLabel
      "draft", // status - start as draft per requirements
      {
        // New agent-generated fields
        meta_title: agentResults.seo.metaTitle,
        meta_description: agentResults.seo.metaDescription,
        seo_keywords: agentResults.seo.seoKeywords,
        summary_short: agentResults.summary.summaryShort,
        summary_medium: agentResults.summary.summaryMedium,
        summary_long: agentResults.summary.summaryLong,
        image_prompt: agentResults.imagePrompt.imagePrompt,
        schema_json: agentResults.schema.schemaJson,
        quality_score: agentResults.validation.qualityScore,
        validation_report: agentResults.validation.validationReport
      }
    );

    if (!module) {
      throw new Error("Failed to create module in database");
    }

    console.log(`✓ Module created: ${module.id} (quality: ${agentResults.validation.qualityScore}/100)`);

    // Step 3b: Store embeddings if generated
    if (agentResults.embeddings.embedding.length > 0) {
      await createModuleEmbedding(module.id, agentResults.embeddings.embedding);
      console.log(`✓ Embeddings stored (${agentResults.embeddings.embedding.length} dimensions)`);
    }

    // Step 4: Use agent-generated summary markdown
    const summaryContent = agentResults.summary.summaryMarkdown;

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
 * Clean markdown and extract metadata using specialized agent workflow
 */
async function cleanAndExtractMetadata(
  content: string,
  providedTitle?: string
): Promise<ProcessedModule & { agentResults: any }> {
  const lines = content.split("\n");

  // Extract initial title (from parameter, first H1, or default)
  let initialTitle = providedTitle || "Untitled Module";

  if (!providedTitle) {
    const firstH1 = lines.find((line) => line.startsWith("# "));
    if (firstH1) {
      initialTitle = firstH1.replace("# ", "").trim();
    }
  }

  console.log(`🤖 Using AI Agent Workflow to process: ${initialTitle}`);

  // Execute complete agent workflow
  const agentResults = await executeAgentWorkflow({
    title: initialTitle,
    content
  });

  // Generate slug from final title (use initial title if no refinement)
  const slug = initialTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  console.log(`✓ Agent workflow complete: Quality score ${agentResults.validation.qualityScore}/100`);

  return {
    title: initialTitle,
    slug,
    category: agentResults.category.category,
    tags: agentResults.tags.tags,
    summary: agentResults.summary.summaryShort,
    metaDescription: agentResults.seo.metaDescription,
    changelog: "Initial version",
    content,
    agentResults
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

