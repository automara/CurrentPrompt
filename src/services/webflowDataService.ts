/**
 * Webflow Data Service - Fetch and parse data from Webflow CMS
 *
 * Allows reading modules, categories, and tags directly from Webflow
 */

import { Module } from "../lib/supabase.js";

const WEBFLOW_API_URL = "https://api.webflow.com/v1";
const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
const WEBFLOW_SITE_ID = process.env.WEBFLOW_SITE_ID;
const WEBFLOW_COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID;

// Collection IDs can be optionally specified for categories and tags
const WEBFLOW_CATEGORIES_COLLECTION_ID = process.env.WEBFLOW_CATEGORIES_COLLECTION_ID;
const WEBFLOW_TAGS_COLLECTION_ID = process.env.WEBFLOW_TAGS_COLLECTION_ID;

interface WebflowField {
  [key: string]: string | number | boolean | string[];
}

interface WebflowItem {
  id: string;
  slug: string;
  name: string;
  fields: WebflowField;
  _archived: boolean;
  _draft: boolean;
  createdOn: string;
  updatedOn: string;
}

interface WebflowCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

interface WebflowTag {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

/**
 * Fetch all modules from Webflow CMS
 */
export async function getWebflowModules(
  onlyPublished = true
): Promise<Module[]> {
  if (!WEBFLOW_API_TOKEN || !WEBFLOW_SITE_ID || !WEBFLOW_COLLECTION_ID) {
    console.warn("Webflow credentials missing - cannot fetch modules");
    return [];
  }

  try {
    const items = await fetchWebflowItems(WEBFLOW_COLLECTION_ID);

    return items
      .filter((item) => !onlyPublished || (!item._archived && !item._draft))
      .map((item) => parseWebflowItemToModule(item));
  } catch (error) {
    console.error("Error fetching Webflow modules:", error);
    return [];
  }
}

/**
 * Fetch a single module from Webflow by slug
 */
export async function getWebflowModule(slug: string): Promise<Module | null> {
  if (!WEBFLOW_API_TOKEN || !WEBFLOW_SITE_ID || !WEBFLOW_COLLECTION_ID) {
    return null;
  }

  try {
    const items = await fetchWebflowItems(WEBFLOW_COLLECTION_ID);
    const item = items.find((i) => i.slug === slug);

    if (!item) return null;

    return parseWebflowItemToModule(item);
  } catch (error) {
    console.error("Error fetching Webflow module:", error);
    return null;
  }
}

/**
 * Search modules in Webflow
 */
export async function searchWebflowModules(query: string): Promise<Module[]> {
  if (!WEBFLOW_API_TOKEN || !WEBFLOW_SITE_ID || !WEBFLOW_COLLECTION_ID) {
    return [];
  }

  try {
    const items = await fetchWebflowItems(WEBFLOW_COLLECTION_ID);
    const queryLower = query.toLowerCase();

    return items
      .filter((item) => {
        const fields = item.fields as Record<string, unknown>;
        const name = (fields.name || "").toString().toLowerCase();
        const summary = (fields.summary || "").toString().toLowerCase();
        const tags = ((fields.tags || "").toString()).toLowerCase();

        return (
          name.includes(queryLower) ||
          summary.includes(queryLower) ||
          tags.includes(queryLower)
        );
      })
      .map((item) => parseWebflowItemToModule(item));
  } catch (error) {
    console.error("Error searching Webflow modules:", error);
    return [];
  }
}

/**
 * Get all categories from Webflow
 */
export async function getWebflowCategories(): Promise<WebflowCategory[]> {
  if (
    !WEBFLOW_API_TOKEN ||
    !WEBFLOW_SITE_ID ||
    !WEBFLOW_CATEGORIES_COLLECTION_ID
  ) {
    return [];
  }

  try {
    const items = await fetchWebflowItems(WEBFLOW_CATEGORIES_COLLECTION_ID);
    return items.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: (item.fields.description as string) || undefined,
    }));
  } catch (error) {
    console.error("Error fetching Webflow categories:", error);
    return [];
  }
}

/**
 * Get all tags from Webflow
 */
export async function getWebflowTags(): Promise<WebflowTag[]> {
  if (
    !WEBFLOW_API_TOKEN ||
    !WEBFLOW_SITE_ID ||
    !WEBFLOW_TAGS_COLLECTION_ID
  ) {
    return [];
  }

  try {
    const items = await fetchWebflowItems(WEBFLOW_TAGS_COLLECTION_ID);
    return items.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: (item.fields.description as string) || undefined,
    }));
  } catch (error) {
    console.error("Error fetching Webflow tags:", error);
    return [];
  }
}

/**
 * Fetch items from a Webflow collection
 */
async function fetchWebflowItems(collectionId: string): Promise<WebflowItem[]> {
  if (!WEBFLOW_API_TOKEN) {
    throw new Error("Webflow API token not configured");
  }

  try {
    const response = await fetch(
      `${WEBFLOW_API_URL}/collections/${collectionId}/items?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Webflow API error:", error);
      throw new Error(`Webflow API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      items: WebflowItem[];
    };

    return data.items || [];
  } catch (error) {
    console.error("Error fetching from Webflow:", error);
    throw error;
  }
}

/**
 * Convert Webflow item to our Module format
 */
function parseWebflowItemToModule(item: WebflowItem): Module {
  const fields = item.fields as Record<string, unknown>;

  // Parse tags - could be comma-separated string or array
  let tags: string[] = [];
  const tagsField = fields.tags;
  if (typeof tagsField === "string") {
    tags = tagsField
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
  } else if (Array.isArray(tagsField)) {
    tags = tagsField.map((t) => String(t).trim()).filter((t) => t);
  }

  const sourceUrl = String(fields["source-url"] || "").trim();
  const sourceLabel = String(fields["source-label"] || "").trim();

  const module: Module = {
    id: item.id,
    title: item.name,
    slug: item.slug,
    category: String(fields.category || "Uncategorized"),
    tags,
    latest_version: Number(fields["latest-version"] || 1),
    status: item._draft ? "draft" : item._archived ? "archived" : "published",
    created_at: item.createdOn,
    updated_at: item.updatedOn,
  };

  if (String(fields.summary || "").trim()) {
    module.summary = String(fields.summary).trim();
  }

  if (sourceUrl) {
    module.source_url = sourceUrl;
  }

  if (sourceLabel) {
    module.source_label = sourceLabel;
  }

  return module;
}

/**
 * Get sync metadata - when this item was last synced
 */
export interface SyncMetadata {
  itemId: string;
  slug: string;
  source: "supabase" | "webflow";
  lastSyncedAt: string;
  lastModifiedAt: string;
}

/**
 * Compare versions and determine which is newer
 */
export function isWebflowNewer(
  webflowUpdated: string,
  supabaseUpdated: string
): boolean {
  return new Date(webflowUpdated) > new Date(supabaseUpdated);
}
