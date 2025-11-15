import { Router, Request, Response } from "express";
import * as moduleService from "../services/moduleService.js";
import * as webflowService from "../services/webflowService.js";

const router = Router();

/**
 * POST /api/webflow/sync/:moduleId
 * Sync a specific module to Webflow
 */
router.post("/sync/:moduleId", async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;

    const module = await moduleService.getModuleById(moduleId);

    if (!module) {
      return res
        .status(404)
        .json({ success: false, error: "Module not found" });
    }

    const success = await webflowService.syncModuleToWebflow(module);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Failed to sync module to Webflow",
      });
    }

    res.json({
      success: true,
      message: `Module '${module.title}' synced to Webflow`,
    });
  } catch (error) {
    console.error("Error syncing module to Webflow:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync module to Webflow",
    });
  }
});

/**
 * POST /api/webflow/sync-all
 * Sync all published modules to Webflow
 */
router.post("/sync-all", async (req: Request, res: Response) => {
  try {
    const modules = await moduleService.getAllPublishedModules();

    let syncedCount = 0;
    let failedCount = 0;

    for (const module of modules) {
      const success = await webflowService.syncModuleToWebflow(module);
      if (success) {
        syncedCount++;
      } else {
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedCount} modules to Webflow`,
      synced: syncedCount,
      failed: failedCount,
      total: modules.length,
    });
  } catch (error) {
    console.error("Error syncing modules to Webflow:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync modules to Webflow",
    });
  }
});

/**
 * DELETE /api/webflow/delete/:slug
 * Delete a module from Webflow by slug
 */
router.delete("/delete/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const success = await webflowService.deleteModuleFromWebflow(slug);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Failed to delete module from Webflow",
      });
    }

    res.json({
      success: true,
      message: `Module '${slug}' deleted from Webflow`,
    });
  } catch (error) {
    console.error("Error deleting module from Webflow:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete module from Webflow",
    });
  }
});

export default router;
