import { Module } from "../lib/supabase.js";

/**
 * Webflow Service - Sync modules to Webflow CMS
 */

const WEBFLOW_API_URL = "https://api.webflow.com/v1";
const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
const WEBFLOW_SITE_ID = process.env.WEBFLOW_SITE_ID;
const WEBFLOW_COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID;

// NOTE: Webflow v1 API has limitations with modern CMS collections
// The collection IDs from the CMS UI don't work directly with v1 /collections/{id}/items endpoint
// This requires using Webflow v2 API or finding the correct database ID mapping
// For now, sync is disabled until we migrate to v2 API or find the correct ID format

if (!WEBFLOW_API_TOKEN || !WEBFLOW_SITE_ID || !WEBFLOW_COLLECTION_ID) {
  console.warn(
    "⚠️  Webflow credentials missing. CMS sync will be disabled. Set WEBFLOW_API_TOKEN, WEBFLOW_SITE_ID, and WEBFLOW_COLLECTION_ID in .env"
  );
} else {
  console.warn(
    "⚠️  Webflow v1 API sync: Currently disabled due to API limitations. Collection IDs need v2 API or database ID mapping."
  );
}

interface WebflowItem {
  fields: {
    name: string;
    slug: string;
    _archived: boolean;
    _draft: boolean;
    "summary": string;
    "category": string;
    "tags": string;
    "latest-version": number;
    "status": string;
    "source-url": string;
    "source-label": string;
    "supabase-id": string;
    "download-link-full": string;
    "download-link-summary": string;
    "download-link-bundle": string;
  };
}

/**
 * Create or update a module in Webflow CMS
 */
export async function syncModuleToWebflow(module: Module): Promise<boolean> {
  if (!WEBFLOW_API_TOKEN || !WEBFLOW_SITE_ID || !WEBFLOW_COLLECTION_ID) {
    console.warn("Webflow sync disabled: missing credentials");
    return false;
  }

  try {
    // Check if item already exists in Webflow
    const existingItem = await findWebflowItemBySlug(module.slug);

    const item: WebflowItem = {
      fields: {
        name: module.title,
        slug: module.slug,
        _archived: module.status === "archived",
        _draft: module.status === "draft",
        summary: module.summary || "",
        category: module.category,
        tags: module.tags.join(", "),
        "latest-version": module.latest_version,
        status: module.status,
        "source-url": module.source_url || "",
        "source-label": module.source_label || "",
        "supabase-id": module.id,
        "download-link-full": getFileUrl(module.slug, module.latest_version, "full.md"),
        "download-link-summary": getFileUrl(module.slug, module.latest_version, "summary.md"),
        "download-link-bundle": getFileUrl(module.slug, module.latest_version, "bundle.zip"),
      },
    };

    if (existingItem) {
      // Update existing item
      return await updateWebflowItem(existingItem.id, item);
    } else {
      // Create new item
      return await createWebflowItem(item);
    }
  } catch (error) {
    console.error("Error syncing module to Webflow:", error);
    return false;
  }
}

/**
 * Get collection database ID from site
 * Webflow v1 API requires database IDs, not CMS collection IDs
 */
async function getCollectionDatabaseId(
  collectionName: string
): Promise<string | null> {
  try {
    // Try to fetch collections from the site
    const response = await fetch(
      `${WEBFLOW_API_URL}/sites/${WEBFLOW_SITE_ID}/collections`,
      {
        headers: {
          Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch collections: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      collections: Array<{ _id: string; name: string }>;
    };

    const collection = data.collections.find(
      (c) => c.name.toLowerCase() === collectionName.toLowerCase()
    );

    if (collection) {
      console.log(
        `✓ Found collection database ID for "${collectionName}": ${collection._id}`
      );
      return collection._id;
    }

    return null;
  } catch (error) {
    console.error("Error getting collection database ID:", error);
    return null;
  }
}

/**
 * Create a new item in Webflow collection
 */
async function createWebflowItem(item: WebflowItem): Promise<boolean> {
  try {
    // For v1 API, we need the database ID, not the CMS collection ID
    // The provided WEBFLOW_COLLECTION_ID might be a CMS ID, not a database ID
    // Try using it directly first, if it fails, try to fetch the database ID

    const response = await fetch(
      `${WEBFLOW_API_URL}/collections/${WEBFLOW_COLLECTION_ID}/items`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: item.fields,
          isArchived: item.fields._archived || false,
          isDraft: item.fields._draft || false,
        }),
      }
    );

    if (!response.ok) {
      const statusCode = response.status;
      if (statusCode === 404) {
        console.warn(
          `Collection ID not found with v1 API. The provided ID might be a CMS ID rather than a database ID.`
        );
        console.warn(
          `Try using Webflow v2 API or provide the database collection ID instead.`
        );
      } else {
        const error = await response.json();
        console.error("Webflow API error creating item:", error);
      }
      return false;
    }

    console.log(`✓ Created module in Webflow: ${item.fields.name}`);
    return true;
  } catch (error) {
    console.error("Error creating Webflow item:", error);
    return false;
  }
}

/**
 * Update an existing item in Webflow collection
 */
async function updateWebflowItem(
  itemId: string,
  item: WebflowItem
): Promise<boolean> {
  try {
    const response = await fetch(
      `${WEBFLOW_API_URL}/collections/${WEBFLOW_COLLECTION_ID}/items/${itemId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: item.fields }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Webflow API error updating item:", error);
      return false;
    }

    console.log(`✓ Updated module in Webflow: ${item.fields.name}`);
    return true;
  } catch (error) {
    console.error("Error updating Webflow item:", error);
    return false;
  }
}

/**
 * Find a Webflow item by slug
 */
async function findWebflowItemBySlug(
  slug: string
): Promise<{ id: string; slug: string } | null> {
  try {
    const response = await fetch(
      `${WEBFLOW_API_URL}/collections/${WEBFLOW_COLLECTION_ID}/items`,
      {
        headers: {
          Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Error fetching Webflow items");
      return null;
    }

    const data = (await response.json()) as {
      items: Array<{ id: string; slug: string }>;
    };

    const item = data.items.find((item) => item.slug === slug);
    return item || null;
  } catch (error) {
    console.error("Error finding Webflow item:", error);
    return null;
  }
}

/**
 * Delete a module from Webflow CMS
 */
export async function deleteModuleFromWebflow(slug: string): Promise<boolean> {
  if (!WEBFLOW_API_TOKEN || !WEBFLOW_SITE_ID || !WEBFLOW_COLLECTION_ID) {
    return false;
  }

  try {
    const existingItem = await findWebflowItemBySlug(slug);

    if (!existingItem) {
      console.warn(`Module ${slug} not found in Webflow`);
      return false;
    }

    const response = await fetch(
      `${WEBFLOW_API_URL}/collections/${WEBFLOW_COLLECTION_ID}/items/${existingItem.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Error deleting Webflow item");
      return false;
    }

    console.log(`✓ Deleted module from Webflow: ${slug}`);
    return true;
  } catch (error) {
    console.error("Error deleting Webflow item:", error);
    return false;
  }
}

/**
 * Generate Supabase Storage file URL
 */
function getFileUrl(slug: string, version: number, filename: string): string {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  return `${supabaseUrl}/storage/v1/object/public/modules/${slug}/v${version}/${filename}`;
}

/**
 * Publish item to live site
 */
export async function publishWebflowItem(itemId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${WEBFLOW_API_URL}/collections/${WEBFLOW_COLLECTION_ID}/items/${itemId}/publish`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Error publishing Webflow item");
      return false;
    }

    console.log(`✓ Published item to Webflow live site: ${itemId}`);
    return true;
  } catch (error) {
    console.error("Error publishing Webflow item:", error);
    return false;
  }
}
