import { Router, Request, Response } from "express";
import multer from "multer";
import * as moduleService from "../services/moduleService.js";
import { processMarkdownFile } from "../services/ingestionService.js";
import { syncModuleToWebflow } from "../services/webflowService.js";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/markdown" || file.originalname.endsWith(".md")) {
      cb(null, true);
    } else {
      cb(new Error("Only markdown files are allowed"));
    }
  },
});

/**
 * POST /api/modules/upload
 * Upload a markdown file and process through the pipeline
 */
router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded. Please upload a markdown (.md) file.",
        });
      }

      const result = await processMarkdownFile(req.file.path, true);

      if (result.success) {
        res.json({
          success: true,
          message: "Module processed and synced to Webflow",
          moduleId: result.moduleId,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || "Failed to process markdown file",
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload file",
      });
    }
  }
);

/**
 * POST /api/modules/sync/:id
 * Manually sync a specific module to Webflow
 */
router.post("/sync/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const module = await moduleService.getModuleById(id);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: "Module not found",
      });
    }

    const synced = await syncModuleToWebflow(module);

    if (synced) {
      res.json({
        success: true,
        message: `Module '${module.title}' synced to Webflow`,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to sync module to Webflow",
      });
    }
  } catch (error) {
    console.error("Error syncing module:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync module",
    });
  }
});

/**
 * POST /api/modules/sync-all
 * Sync all published modules to Webflow
 */
router.post("/sync-all", async (req: Request, res: Response) => {
  try {
    const modules = await moduleService.getAllPublishedModules();

    let syncedCount = 0;
    let failedCount = 0;

    for (const module of modules) {
      const success = await syncModuleToWebflow(module);
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
    console.error("Error syncing modules:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync modules",
    });
  }
});

/**
 * GET /api/modules
 * Get all published modules
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const modules = await moduleService.getAllPublishedModules();
    res.json({ success: true, data: modules });
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({ success: false, error: "Failed to fetch modules" });
  }
});

/**
 * GET /api/modules/:slug
 * Get a specific module by slug
 */
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const module = await moduleService.getModuleBySlug(slug);

    if (!module) {
      return res
        .status(404)
        .json({ success: false, error: "Module not found" });
    }

    res.json({ success: true, data: module });
  } catch (error) {
    console.error("Error fetching module:", error);
    res.status(500).json({ success: false, error: "Failed to fetch module" });
  }
});

export default router;
