/**
 * Bidirectional Sync Service
 *
 * Handles syncing data between Webflow CMS and Supabase database
 * - Supabase → Webflow (push modules to CMS)
 * - Webflow → Supabase (pull CMS changes back to database)
 * - Conflict resolution based on timestamps
 */

import { supabase, Module } from "../lib/supabase.js";
import * as webflowService from "./webflowService.js";
import * as webflowDataService from "./webflowDataService.js";
import * as moduleService from "./moduleService.js";

export interface SyncResult {
  direction: "push" | "pull";
  totalProcessed: number;
  successful: number;
  failed: number;
  conflicts: number;
  details: SyncItemResult[];
}

export interface SyncItemResult {
  slug: string;
  status: "synced" | "failed" | "conflict";
  message: string;
  source?: "supabase" | "webflow";
}

/**
 * Sync all modules from Supabase to Webflow (push)
 * Existing functionality - enhanced with logging
 */
export async function syncSupabaseToWebflow(): Promise<SyncResult> {
  console.log("🔄 Starting Supabase → Webflow sync...");

  try {
    const modules = await moduleService.getAllPublishedModules();
    const result: SyncResult = {
      direction: "push",
      totalProcessed: modules.length,
      successful: 0,
      failed: 0,
      conflicts: 0,
      details: [],
    };

    for (const module of modules) {
      try {
        const success = await webflowService.syncModuleToWebflow(module);

        if (success) {
          result.successful++;
          result.details.push({
            slug: module.slug,
            status: "synced",
            message: `✓ Synced to Webflow`,
            source: "supabase",
          });
        } else {
          result.failed++;
          result.details.push({
            slug: module.slug,
            status: "failed",
            message: "Failed to sync to Webflow",
            source: "supabase",
          });
        }
      } catch (error) {
        result.failed++;
        result.details.push({
          slug: module.slug,
          status: "failed",
          message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          source: "supabase",
        });
      }
    }

    console.log(
      `✓ Sync complete: ${result.successful}/${result.totalProcessed} successful`
    );
    return result;
  } catch (error) {
    console.error("Error syncing Supabase to Webflow:", error);
    return {
      direction: "push",
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      conflicts: 0,
      details: [],
    };
  }
}

/**
 * Sync all modules from Webflow to Supabase (pull)
 * Fetches latest data from Webflow CMS and updates Supabase
 */
export async function syncWebflowToSupabase(): Promise<SyncResult> {
  console.log("🔄 Starting Webflow → Supabase sync...");

  try {
    const webflowModules = await webflowDataService.getWebflowModules();
    const result: SyncResult = {
      direction: "pull",
      totalProcessed: webflowModules.length,
      successful: 0,
      failed: 0,
      conflicts: 0,
      details: [],
    };

    for (const webflowModule of webflowModules) {
      try {
        // Find existing module in Supabase
        const existingModule = await moduleService.getModuleBySlug(
          webflowModule.slug
        );

        if (existingModule) {
          // Check for conflicts - compare timestamps
          const webflowTime = new Date(webflowModule.updated_at);
          const supabaseTime = new Date(existingModule.updated_at);

          if (webflowTime > supabaseTime) {
            // Webflow is newer - update Supabase
            const updated = await updateModuleFromWebflow(
              existingModule.id,
              webflowModule
            );

            if (updated) {
              result.successful++;
              result.details.push({
                slug: webflowModule.slug,
                status: "synced",
                message: "✓ Updated from Webflow (newer)",
                source: "webflow",
              });
            } else {
              result.failed++;
              result.details.push({
                slug: webflowModule.slug,
                status: "failed",
                message: "Failed to update from Webflow",
                source: "webflow",
              });
            }
          } else if (webflowTime < supabaseTime) {
            // Supabase is newer - skip update but log conflict
            result.conflicts++;
            result.details.push({
              slug: webflowModule.slug,
              status: "conflict",
              message: "⚠️  Conflict: Supabase version is newer, skipped update",
              source: "webflow",
            });
          } else {
            // Same timestamp - no update needed
            result.successful++;
            result.details.push({
              slug: webflowModule.slug,
              status: "synced",
              message: "✓ Already synced",
              source: "webflow",
            });
          }
        } else {
          // New module from Webflow - create in Supabase
          const created = await createModuleFromWebflow(webflowModule);

          if (created) {
            result.successful++;
            result.details.push({
              slug: webflowModule.slug,
              status: "synced",
              message: "✓ Created from Webflow",
              source: "webflow",
            });
          } else {
            result.failed++;
            result.details.push({
              slug: webflowModule.slug,
              status: "failed",
              message: "Failed to create from Webflow",
              source: "webflow",
            });
          }
        }
      } catch (error) {
        result.failed++;
        result.details.push({
          slug: webflowModule.slug,
          status: "failed",
          message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          source: "webflow",
        });
      }
    }

    console.log(
      `✓ Sync complete: ${result.successful}/${result.totalProcessed} successful, ${result.conflicts} conflicts`
    );
    return result;
  } catch (error) {
    console.error("Error syncing Webflow to Supabase:", error);
    return {
      direction: "pull",
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      conflicts: 0,
      details: [],
    };
  }
}

/**
 * Bidirectional sync - determine direction based on timestamps
 */
export async function bidirectionalSync(): Promise<{
  push: SyncResult;
  pull: SyncResult;
}> {
  console.log("🔄 Starting bidirectional sync...");

  const pushResult = await syncSupabaseToWebflow();
  const pullResult = await syncWebflowToSupabase();

  return { push: pushResult, pull: pullResult };
}

/**
 * Update a Supabase module with data from Webflow
 */
async function updateModuleFromWebflow(
  moduleId: string,
  webflowModule: Module
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("modules")
      .update({
        title: webflowModule.title,
        summary: webflowModule.summary,
        category: webflowModule.category,
        tags: webflowModule.tags,
        latest_version: webflowModule.latest_version,
        status: webflowModule.status,
        source_url: webflowModule.source_url,
        source_label: webflowModule.source_label,
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId);

    if (error) {
      console.error("Error updating module from Webflow:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating module:", error);
    return false;
  }
}

/**
 * Create a new Supabase module from Webflow data
 */
async function createModuleFromWebflow(webflowModule: Module): Promise<boolean> {
  try {
    const { error } = await supabase.from("modules").insert([
      {
        title: webflowModule.title,
        slug: webflowModule.slug,
        category: webflowModule.category,
        tags: webflowModule.tags,
        summary: webflowModule.summary,
        latest_version: webflowModule.latest_version,
        status: webflowModule.status,
        source_url: webflowModule.source_url,
        source_label: webflowModule.source_label,
      },
    ]);

    if (error) {
      console.error("Error creating module from Webflow:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error creating module:", error);
    return false;
  }
}

/**
 * Get sync status for a specific module
 */
export async function getSyncStatus(slug: string): Promise<{
  slug: string;
  inSupabase: boolean;
  inWebflow: boolean;
  supabaseUpdated?: string;
  webflowUpdated?: string;
  needsSync: boolean;
  direction?: "push" | "pull";
}> {
  try {
    const supabaseModule = await moduleService.getModuleBySlug(slug);
    const webflowModule = await webflowDataService.getWebflowModule(slug);

    const result: {
      slug: string;
      inSupabase: boolean;
      inWebflow: boolean;
      supabaseUpdated?: string;
      webflowUpdated?: string;
      needsSync: boolean;
      direction?: "push" | "pull";
    } = {
      slug,
      inSupabase: !!supabaseModule,
      inWebflow: !!webflowModule,
      needsSync: false,
    };

    if (supabaseModule) {
      result.supabaseUpdated = supabaseModule.updated_at;
    }

    if (webflowModule) {
      result.webflowUpdated = webflowModule.updated_at;
    }

    // Determine if sync is needed
    if (supabaseModule && webflowModule) {
      const supabaseTime = new Date(supabaseModule.updated_at);
      const webflowTime = new Date(webflowModule.updated_at);

      if (supabaseTime > webflowTime) {
        result.needsSync = true;
        result.direction = "push";
      } else if (webflowTime > supabaseTime) {
        result.needsSync = true;
        result.direction = "pull";
      }
    } else if (supabaseModule && !webflowModule) {
      result.needsSync = true;
      result.direction = "push";
    } else if (!supabaseModule && webflowModule) {
      result.needsSync = true;
      result.direction = "pull";
    }

    return result;
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
