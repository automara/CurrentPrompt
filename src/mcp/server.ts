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
