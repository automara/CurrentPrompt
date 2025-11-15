import { Module } from "../lib/supabase.js";

/**
 * Webflow V2 Service - Sync modules to Webflow using v2 Data API
 *
 * Note: Webflow v1 API is deprecated. This uses the v2 Data API.
 * Docs: https://developers.webflow.com/data/reference
 */

const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
const WEBFLOW_COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID;

if (!WEBFLOW_API_TOKEN || !WEBFLOW_COLLECTION_ID) {
  console.warn(
    "⚠️  Webflow credentials missing. CMS sync will be disabled. Set WEBFLOW_API_TOKEN and WEBFLOW_COLLECTION_ID in .env"
  );
}

/**
 * Sync a module to Webflow CMS using v2 Data API
 */
export async function syncModuleToWebflowV2(module: Module): Promise<boolean> {
  if (!WEBFLOW_API_TOKEN || !WEBFLOW_COLLECTION_ID) {
    console.warn("Webflow sync disabled: missing credentials");
    return false;
  }

  try {
    // Check if item already exists
    const existingItem = await findWebflowItemByFieldV2("supabase-id", module.id);

    const itemData = buildWebflowItemData(module);

    if (existingItem) {
      // Update existing item
      return await updateWebflowItemV2(existingItem.id, itemData);
    } else {
      // Create new item
      return await createWebflowItemV2(itemData);
    }
  } catch (error) {
    console.error("Error syncing module to Webflow v2:", error);
    return false;
  }
}

/**
 * Build Webflow item data from module
 * Note: category and tags are omitted for now - they can be added as semicolon-separated names
 * Example: category: "Dev Tool" or tags: "ai; claude; productivity"
 * status is mapped to Webflow option IDs
 */
function buildWebflowItemData(module: Module) {
  // Map status to Webflow option IDs
  const statusId = module.status === "published"
    ? "ee61f17366fc7f58f282042e1bf44125"
    : "e9c64fa914d619f54a019c8fb7463f83";

  return {
    fieldData: {
      name: module.title,
      slug: module.slug,
      summary: module.summary || "",
      // category: module.category, // TODO: Uncomment when ready - format: "Category Name"
      // tags: module.tags.join("; "), // TODO: Uncomment when ready - format: "tag1; tag2; tag3"
      "latest-version": module.latest_version,
      status: statusId,
      "source-url": module.source_url || "",
      "source-label": module.source_label || "",
      "supabase-id": module.id,
      // owner field doesn't exist in Webflow schema
      "download-link-full": getFileUrl(module.slug, module.latest_version, "full.md"),
      "download-link-summary": getFileUrl(module.slug, module.latest_version, "summary.md"),
      "download-link-bundle": getFileUrl(module.slug, module.latest_version, "bundle.zip"),
    },
  };
}

/**
 * Create a new item in Webflow collection (v2 API)
 */
async function createWebflowItemV2(itemData: any): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.webflow.com/v2/collections/${WEBFLOW_COLLECTION_ID}/items`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Webflow v2 API error creating item:", error);
      return false;
    }

    const result = await response.json();
    console.log(`✓ Created module in Webflow: ${itemData.fieldData.name}`);
    return true;
  } catch (error) {
    console.error("Error creating Webflow item (v2):", error);
    return false;
  }
}

/**
 * Update an existing item in Webflow collection (v2 API)
 */
async function updateWebflowItemV2(
  itemId: string,
  itemData: any
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.webflow.com/v2/collections/${WEBFLOW_COLLECTION_ID}/items/${itemId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Webflow v2 API error updating item:", error);
      return false;
    }

    console.log(`✓ Updated module in Webflow: ${itemData.fieldData.name}`);
    return true;
  } catch (error) {
    console.error("Error updating Webflow item (v2):", error);
    return false;
  }
}

/**
 * Find a Webflow item by a specific field value (v2 API)
 */
async function findWebflowItemByFieldV2(
  fieldName: string,
  fieldValue: string
): Promise<{ id: string } | null> {
  try {
    // v2 API doesn't support filtering in list, so we fetch all and filter client-side
    const response = await fetch(
      `https://api.webflow.com/v2/collections/${WEBFLOW_COLLECTION_ID}/items`,
      {
        headers: {
          Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Error fetching Webflow items (v2)");
      return null;
    }

    const data = (await response.json()) as { items?: any[] };
    const items = data.items || [];

    const item = items.find(
      (item: any) => item.fieldData?.[fieldName] === fieldValue
    );

    return item ? { id: item.id } : null;
  } catch (error) {
    console.error("Error finding Webflow item (v2):", error);
    return null;
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
 * Delete a module from Webflow CMS (v2 API)
 */
export async function deleteModuleFromWebflowV2(itemId: string): Promise<boolean> {
  if (!WEBFLOW_API_TOKEN || !WEBFLOW_COLLECTION_ID) {
    return false;
  }

  try {
    const response = await fetch(
      `https://api.webflow.com/v2/collections/${WEBFLOW_COLLECTION_ID}/items/${itemId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Error deleting Webflow item (v2)");
      return false;
    }

    console.log(`✓ Deleted module from Webflow: ${itemId}`);
    return true;
  } catch (error) {
    console.error("Error deleting Webflow item (v2):", error);
    return false;
  }
}
