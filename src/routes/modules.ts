import { Router, Request, Response } from "express";
import * as moduleService from "../services/moduleService.js";

const router = Router();

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
 * GET /api/modules/search
 * Search modules by query
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "Query parameter 'q' is required" });
    }

    const modules = await moduleService.searchModules(q);
    res.json({ success: true, data: modules });
  } catch (error) {
    console.error("Error searching modules:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to search modules" });
  }
});

/**
 * GET /api/modules/category/:category
 * Get modules by category
 */
router.get("/category/:category", async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const modules = await moduleService.getModulesByCategory(category);
    res.json({ success: true, data: modules });
  } catch (error) {
    console.error("Error fetching modules by category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch modules by category",
    });
  }
});

/**
 * GET /api/modules/tag/:tag
 * Get modules by tag
 */
router.get("/tag/:tag", async (req: Request, res: Response) => {
  try {
    const { tag } = req.params;
    const modules = await moduleService.getModulesByTag(tag);
    res.json({ success: true, data: modules });
  } catch (error) {
    console.error("Error fetching modules by tag:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch modules by tag",
    });
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

/**
 * GET /api/modules/:slug/versions
 * Get all versions of a module
 */
router.get("/:slug/versions", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const module = await moduleService.getModuleBySlug(slug);

    if (!module) {
      return res
        .status(404)
        .json({ success: false, error: "Module not found" });
    }

    const versions = await moduleService.getModuleVersions(module.id);
    res.json({ success: true, data: versions });
  } catch (error) {
    console.error("Error fetching module versions:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch module versions" });
  }
});

/**
 * GET /api/modules/:slug/v/:version
 * Get a specific version of a module
 */
router.get("/:slug/v/:version", async (req: Request, res: Response) => {
  try {
    const { slug, version } = req.params;
    const module = await moduleService.getModuleBySlug(slug);

    if (!module) {
      return res
        .status(404)
        .json({ success: false, error: "Module not found" });
    }

    const moduleVersion = await moduleService.getModuleVersion(
      module.id,
      parseInt(version)
    );

    if (!moduleVersion) {
      return res
        .status(404)
        .json({ success: false, error: "Version not found" });
    }

    res.json({ success: true, data: moduleVersion });
  } catch (error) {
    console.error("Error fetching module version:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch module version" });
  }
});

/**
 * POST /api/modules
 * Create a new module (admin only)
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      title,
      slug,
      category,
      tags,
      summary,
      sourceUrl,
      sourceLabel,
      status,
    } = req.body;

    if (!title || !slug || !category) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, slug, category",
      });
    }

    const module = await moduleService.createModule(
      title,
      slug,
      category,
      tags || [],
      summary,
      sourceUrl,
      sourceLabel,
      status || "draft"
    );

    if (!module) {
      return res
        .status(500)
        .json({ success: false, error: "Failed to create module" });
    }

    res.status(201).json({ success: true, data: module });
  } catch (error) {
    console.error("Error creating module:", error);
    res.status(500).json({ success: false, error: "Failed to create module" });
  }
});

/**
 * PUT /api/modules/:id
 * Update a module (admin only)
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const module = await moduleService.updateModule(id, updates);

    if (!module) {
      return res
        .status(404)
        .json({ success: false, error: "Module not found" });
    }

    res.json({ success: true, data: module });
  } catch (error) {
    console.error("Error updating module:", error);
    res.status(500).json({ success: false, error: "Failed to update module" });
  }
});

/**
 * DELETE /api/modules/:id
 * Delete a module (admin only)
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await moduleService.deleteModule(id);

    if (!success) {
      return res
        .status(500)
        .json({ success: false, error: "Failed to delete module" });
    }

    res.json({ success: true, message: "Module deleted successfully" });
  } catch (error) {
    console.error("Error deleting module:", error);
    res.status(500).json({ success: false, error: "Failed to delete module" });
  }
});

/**
 * POST /api/modules/:id/versions
 * Create a new version of a module
 */
router.post("/:id/versions", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { version, changelog, filePaths } = req.body;

    if (!version) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: version",
      });
    }

    const moduleVersion = await moduleService.createModuleVersion(
      id,
      version,
      changelog,
      filePaths
    );

    if (!moduleVersion) {
      return res
        .status(500)
        .json({ success: false, error: "Failed to create module version" });
    }

    res.status(201).json({ success: true, data: moduleVersion });
  } catch (error) {
    console.error("Error creating module version:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create module version",
    });
  }
});

export default router;
