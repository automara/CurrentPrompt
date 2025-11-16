import { Router, Request, Response } from "express";
import multer from "multer";
import * as moduleService from "../services/moduleService.js";
import { processMarkdownFile, processMarkdownContent } from "../services/ingestionService.js";
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
 * POST /api/modules/create
 * Create a module from JSON with markdown content (recommended)
 */
router.post("/create", async (req: Request, res: Response) => {
  try {
    const { title, content, description, tags, autoSync = true } = req.body;

    // Validation
    if (!content || typeof content !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing required field: content (markdown string)",
      });
    }

    // Process the markdown content
    const result = await processMarkdownContent(content, title, autoSync);

    if (result.success) {
      res.json({
        success: true,
        message: "Module created and processed successfully",
        moduleId: result.moduleId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || "Failed to process module",
      });
    }
  } catch (error) {
    console.error("Error creating module:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create module",
    });
  }
});

/**
 * POST /api/modules/upload
 * Upload a markdown file and process through the pipeline
 * @deprecated Use POST /api/modules/create with JSON body instead
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
          deprecated: true,
          migration: "Please use POST /api/modules/create with JSON body instead",
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
