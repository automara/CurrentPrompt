import { supabase, Module, ModuleVersion } from "../lib/supabase.js";

/**
 * Module Service - Handle all module-related database operations
 */

// Create a new module
export async function createModule(
  title: string,
  slug: string,
  category: string,
  tags: string[],
  summary?: string,
  sourceUrl?: string,
  sourceLabel?: string,
  status: "draft" | "published" | "archived" = "draft",
  agentFields?: {
    meta_title?: string;
    meta_description?: string;
    seo_keywords?: string[];
    summary_short?: string;
    summary_medium?: string;
    summary_long?: string;
    image_prompt?: string;
    schema_json?: object;
    quality_score?: number;
    validation_report?: string;
  },
  owner: string = "Keith Armstrong"
): Promise<Module | null> {
  try {
    const { data, error } = await supabase
      .from("modules")
      .insert([
        {
          title,
          slug,
          category,
          tags,
          summary,
          source_url: sourceUrl,
          source_label: sourceLabel,
          owner,
          latest_version: 1,
          status,
          // Agent-generated fields
          ...(agentFields || {})
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Module;
  } catch (error) {
    console.error("Error creating module:", error);
    return null;
  }
}

// Get module by slug
export async function getModuleBySlug(slug: string): Promise<Module | null> {
  try {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data as Module;
  } catch (error) {
    console.error("Error fetching module:", error);
    return null;
  }
}

// Get module by ID
export async function getModuleById(id: string): Promise<Module | null> {
  try {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Module;
  } catch (error) {
    console.error("Error fetching module:", error);
    return null;
  }
}

// Get all published modules
export async function getAllPublishedModules(): Promise<Module[]> {
  try {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as Module[]) || [];
  } catch (error) {
    console.error("Error fetching modules:", error);
    return [];
  }
}

// Get all modules (including drafts, for admin)
export async function getAllModules(): Promise<Module[]> {
  try {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as Module[]) || [];
  } catch (error) {
    console.error("Error fetching modules:", error);
    return [];
  }
}

// Update module
export async function updateModule(
  id: string,
  updates: Partial<Module>
): Promise<Module | null> {
  try {
    const { data, error } = await supabase
      .from("modules")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Module;
  } catch (error) {
    console.error("Error updating module:", error);
    return null;
  }
}

// Delete module
export async function deleteModule(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("modules").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting module:", error);
    return false;
  }
}

// Search modules by full-text search
export async function searchModules(query: string): Promise<Module[]> {
  try {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .textSearch("search_text", query, {
        type: "websearch",
      })
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as Module[]) || [];
  } catch (error) {
    console.error("Error searching modules:", error);
    return [];
  }
}

// Get modules by category
export async function getModulesByCategory(
  category: string
): Promise<Module[]> {
  try {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("category", category)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as Module[]) || [];
  } catch (error) {
    console.error("Error fetching modules by category:", error);
    return [];
  }
}

// Get module by tag
export async function getModulesByTag(tag: string): Promise<Module[]> {
  try {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .contains("tags", [tag])
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as Module[]) || [];
  } catch (error) {
    console.error("Error fetching modules by tag:", error);
    return [];
  }
}

// Create a new version of a module
export async function createModuleVersion(
  moduleId: string,
  version: number,
  changelog?: string,
  filePaths?: {
    full_md?: string;
    summary_md?: string;
    bundle_zip?: string;
    thumbnail?: string;
  }
): Promise<ModuleVersion | null> {
  try {
    const { data, error } = await supabase
      .from("module_versions")
      .insert([
        {
          module_id: moduleId,
          version,
          changelog,
          file_paths: filePaths || {
            full_md: "",
            summary_md: "",
            bundle_zip: "",
            thumbnail: "",
          },
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Update the module's latest_version
    await updateModule(moduleId, { latest_version: version });

    return data as ModuleVersion;
  } catch (error) {
    console.error("Error creating module version:", error);
    return null;
  }
}

// Get all versions of a module
export async function getModuleVersions(
  moduleId: string
): Promise<ModuleVersion[]> {
  try {
    const { data, error } = await supabase
      .from("module_versions")
      .select("*")
      .eq("module_id", moduleId)
      .order("version", { ascending: false });

    if (error) throw error;
    return (data as ModuleVersion[]) || [];
  } catch (error) {
    console.error("Error fetching module versions:", error);
    return [];
  }
}

// Get specific version of a module
export async function getModuleVersion(
  moduleId: string,
  version: number
): Promise<ModuleVersion | null> {
  try {
    const { data, error } = await supabase
      .from("module_versions")
      .select("*")
      .eq("module_id", moduleId)
      .eq("version", version)
      .single();

    if (error) throw error;
    return data as ModuleVersion;
  } catch (error) {
    console.error("Error fetching module version:", error);
    return null;
  }
}

// Get latest version of a module
export async function getLatestModuleVersion(
  moduleId: string
): Promise<ModuleVersion | null> {
  try {
    const { data, error } = await supabase
      .from("module_versions")
      .select("*")
      .eq("module_id", moduleId)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data as ModuleVersion;
  } catch (error) {
    console.error("Error fetching latest module version:", error);
    return null;
  }
}

// Create module embedding
export async function createModuleEmbedding(
  moduleId: string,
  embedding: number[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("module_embeddings")
      .insert([
        {
          module_id: moduleId,
          embedding
        }
      ]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error creating module embedding:", error);
    return false;
  }
}
