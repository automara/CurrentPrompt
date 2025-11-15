/**
 * CurrentPrompt MCP Server
 *
 * This MCP server exposes CurrentPrompt modules as resources that LLM agents can access.
 *
 * Features:
 * - List all published modules
 * - Search modules by keyword
 * - Retrieve full module content
 * - Filter by category or tags
 */

import { supabase, Module, ModuleVersion } from "../lib/supabase.js";
import * as moduleService from "../services/moduleService.js";
import * as webflowDataService from "../services/webflowDataService.js";
import * as syncService from "../services/syncService.js";

/**
 * Get list of all published modules for MCP
 */
export async function listModules(): Promise<Module[]> {
  try {
    return await moduleService.getAllPublishedModules();
  } catch (error) {
    console.error("Error listing modules:", error);
    return [];
  }
}

/**
 * Get module details with all metadata
 */
export async function getModule(slug: string): Promise<Module | null> {
  try {
    return await moduleService.getModuleBySlug(slug);
  } catch (error) {
    console.error("Error fetching module:", error);
    return null;
  }
}

/**
 * Get module with all versions
 */
export async function getModuleWithVersions(
  slug: string
): Promise<(Module & { versions: ModuleVersion[] }) | null> {
  try {
    const module = await moduleService.getModuleBySlug(slug);
    if (!module) return null;

    const versions = await moduleService.getModuleVersions(module.id);

    return {
      ...module,
      versions,
    };
  } catch (error) {
    console.error("Error fetching module with versions:", error);
    return null;
  }
}

/**
 * Search modules by query
 */
export async function searchModules(query: string): Promise<Module[]> {
  try {
    return await moduleService.searchModules(query);
  } catch (error) {
    console.error("Error searching modules:", error);
    return [];
  }
}

/**
 * Get modules by category
 */
export async function getByCategory(category: string): Promise<Module[]> {
  try {
    return await moduleService.getModulesByCategory(category);
  } catch (error) {
    console.error("Error fetching modules by category:", error);
    return [];
  }
}

/**
 * Get modules by tag
 */
export async function getByTag(tag: string): Promise<Module[]> {
  try {
    return await moduleService.getModulesByTag(tag);
  } catch (error) {
    console.error("Error fetching modules by tag:", error);
    return [];
  }
}

/**
 * Get file content from Supabase Storage
 */
export async function getModuleContent(
  slug: string,
  version: number,
  fileType: "full" | "summary" = "full"
): Promise<string | null> {
  try {
    const fileName = fileType === "full" ? "full.md" : "summary.md";
    const filePath = `modules/${slug}/v${version}/${fileName}`;

    const { data, error } = await supabase.storage
      .from("modules")
      .download(`${slug}/v${version}/${fileName}`);

    if (error) {
      console.error("Error downloading file:", error);
      return null;
    }

    return await data.text();
  } catch (error) {
    console.error("Error fetching module content:", error);
    return null;
  }
}

/**
 * Get categories list for filtering
 */
export async function getCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("modules")
      .select("category")
      .eq("status", "published")
      .order("category");

    if (error) throw error;

    const categories = new Set(
      (data as Array<{ category: string }>).map((m) => m.category)
    );
    return Array.from(categories).sort();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Get all tags used in published modules
 */
export async function getTags(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("modules")
      .select("tags")
      .eq("status", "published");

    if (error) throw error;

    const allTags = new Set<string>();
    (data as Array<{ tags: string[] }>).forEach((m) => {
      m.tags.forEach((tag) => allTags.add(tag));
    });

    return Array.from(allTags).sort();
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}

/**
 * Get module statistics
 */
export async function getStats(): Promise<{
  totalModules: number;
  publishedModules: number;
  draftModules: number;
  categories: number;
  totalVersions: number;
}> {
  try {
    const allModules = await moduleService.getAllModules();
    const published = await moduleService.getAllPublishedModules();

    const { data: versions, error: versionError } = await supabase
      .from("module_versions")
      .select("id", { count: "exact" });

    if (versionError) throw versionError;

    const categories = new Set(
      allModules.map((m) => m.category)
    );

    return {
      totalModules: allModules.length,
      publishedModules: published.length,
      draftModules: allModules.length - published.length,
      categories: categories.size,
      totalVersions: versions?.length || 0,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      totalModules: 0,
      publishedModules: 0,
      draftModules: 0,
      categories: 0,
      totalVersions: 0,
    };
  }
}

/**
 * WEBFLOW INTEGRATION FUNCTIONS
 * ==============================
 */

/**
 * Get list of all modules from Webflow CMS
 */
export async function listWebflowModules(): Promise<Module[]> {
  try {
    return await webflowDataService.getWebflowModules();
  } catch (error) {
    console.error("Error listing Webflow modules:", error);
    return [];
  }
}

/**
 * Get module from Webflow CMS by slug
 */
export async function getWebflowModule(slug: string): Promise<Module | null> {
  try {
    return await webflowDataService.getWebflowModule(slug);
  } catch (error) {
    console.error("Error fetching Webflow module:", error);
    return null;
  }
}

/**
 * Search modules in Webflow CMS
 */
export async function searchWebflowModules(query: string): Promise<Module[]> {
  try {
    return await webflowDataService.searchWebflowModules(query);
  } catch (error) {
    console.error("Error searching Webflow modules:", error);
    return [];
  }
}

/**
 * Get categories from Webflow
 */
export async function getWebflowCategories(): Promise<string[]> {
  try {
    const categories = await webflowDataService.getWebflowCategories();
    return categories.map((c) => c.name).sort();
  } catch (error) {
    console.error("Error fetching Webflow categories:", error);
    return [];
  }
}

/**
 * Get tags from Webflow
 */
export async function getWebflowTags(): Promise<string[]> {
  try {
    const tags = await webflowDataService.getWebflowTags();
    return tags.map((t) => t.name).sort();
  } catch (error) {
    console.error("Error fetching Webflow tags:", error);
    return [];
  }
}

/**
 * Trigger Webflow → Supabase sync (pull)
 */
export async function syncWebflowToSupabase(): Promise<{
  success: boolean;
  result: any;
}> {
  try {
    const result = await syncService.syncWebflowToSupabase();
    return { success: true, result };
  } catch (error) {
    console.error("Error syncing from Webflow:", error);
    return { success: false, result: null };
  }
}

/**
 * Trigger Supabase → Webflow sync (push)
 */
export async function syncSupabaseToWebflow(): Promise<{
  success: boolean;
  result: any;
}> {
  try {
    const result = await syncService.syncSupabaseToWebflow();
    return { success: true, result };
  } catch (error) {
    console.error("Error syncing to Webflow:", error);
    return { success: false, result: null };
  }
}

/**
 * Get sync status for a module
 */
export async function getSyncStatus(slug: string): Promise<{
  slug: string;
  inSupabase: boolean;
  inWebflow: boolean;
  needsSync: boolean;
  direction?: string;
}> {
  try {
    const status = await syncService.getSyncStatus(slug);
    return status;
  } catch (error) {
    console.error("Error getting sync status:", error);
    return {
      slug,
      inSupabase: false,
      inWebflow: false,
      needsSync: false,
    };
  }
}
