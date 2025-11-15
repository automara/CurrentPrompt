import { Router, Request, Response } from "express";
import * as mcpServer from "../mcp/server.js";

const router = Router();

/**
 * MCP Endpoints for Agent Integration
 *
 * These endpoints follow MCP (Model Context Protocol) patterns
 * allowing agents to discover and load CurrentPrompt modules
 */

/**
 * GET /api/mcp/modules
 * List all published modules
 */
router.get("/modules", async (req: Request, res: Response) => {
  try {
    const modules = await mcpServer.listModules();
    res.json({
      success: true,
      data: modules,
      count: modules.length,
    });
  } catch (error) {
    console.error("Error listing modules:", error);
    res.status(500).json({ success: false, error: "Failed to list modules" });
  }
});

/**
 * GET /api/mcp/modules/:slug
 * Get module details
 */
router.get("/modules/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const module = await mcpServer.getModule(slug);

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
 * GET /api/mcp/modules/:slug/full
 * Get module with all versions
 */
router.get("/modules/:slug/full", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const module = await mcpServer.getModuleWithVersions(slug);

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
 * GET /api/mcp/modules/:slug/content
 * Get module markdown content
 */
router.get("/modules/:slug/content", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { version = 1, type = "full" } = req.query;

    const content = await mcpServer.getModuleContent(
      slug,
      parseInt(version as string),
      (type as "full" | "summary") || "full"
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        error: "Module content not found",
      });
    }

    res.json({
      success: true,
      data: {
        slug,
        version: parseInt(version as string),
        type,
        content,
      },
    });
  } catch (error) {
    console.error("Error fetching module content:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch module content" });
  }
});

/**
 * GET /api/mcp/search
 * Search modules
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        success: false,
        error: "Query parameter 'q' is required",
      });
    }

    const results = await mcpServer.searchModules(q);
    res.json({
      success: true,
      query: q,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error searching modules:", error);
    res.status(500).json({ success: false, error: "Failed to search modules" });
  }
});

/**
 * GET /api/mcp/categories
 * Get list of all categories
 */
router.get("/categories", async (req: Request, res: Response) => {
  try {
    const categories = await mcpServer.getCategories();
    res.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch categories" });
  }
});

/**
 * GET /api/mcp/categories/:category
 * Get modules by category
 */
router.get("/categories/:category", async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const modules = await mcpServer.getByCategory(category);

    res.json({
      success: true,
      category,
      data: modules,
      count: modules.length,
    });
  } catch (error) {
    console.error("Error fetching modules by category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch modules by category",
    });
  }
});

/**
 * GET /api/mcp/tags
 * Get list of all tags
 */
router.get("/tags", async (req: Request, res: Response) => {
  try {
    const tags = await mcpServer.getTags();
    res.json({
      success: true,
      data: tags,
      count: tags.length,
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ success: false, error: "Failed to fetch tags" });
  }
});

/**
 * GET /api/mcp/tags/:tag
 * Get modules by tag
 */
router.get("/tags/:tag", async (req: Request, res: Response) => {
  try {
    const { tag } = req.params;
    const modules = await mcpServer.getByTag(tag);

    res.json({
      success: true,
      tag,
      data: modules,
      count: modules.length,
    });
  } catch (error) {
    console.error("Error fetching modules by tag:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch modules by tag",
    });
  }
});

/**
 * GET /api/mcp/stats
 * Get CurrentPrompt statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = await mcpServer.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

/**
 * WEBFLOW ENDPOINTS
 * =================
 */

/**
 * GET /api/mcp/webflow/modules
 * List all modules from Webflow CMS
 */
router.get("/webflow/modules", async (req: Request, res: Response) => {
  try {
    const modules = await mcpServer.listWebflowModules();
    res.json({
      success: true,
      data: modules,
      count: modules.length,
      source: "webflow",
    });
  } catch (error) {
    console.error("Error listing Webflow modules:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to list Webflow modules" });
  }
});

/**
 * GET /api/mcp/webflow/modules/:slug
 * Get module from Webflow CMS by slug
 */
router.get("/webflow/modules/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const module = await mcpServer.getWebflowModule(slug);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: "Module not found in Webflow",
      });
    }

    res.json({ success: true, data: module, source: "webflow" });
  } catch (error) {
    console.error("Error fetching Webflow module:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch Webflow module",
    });
  }
});

/**
 * GET /api/mcp/webflow/search
 * Search modules in Webflow CMS
 */
router.get("/webflow/search", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        success: false,
        error: "Query parameter 'q' is required",
      });
    }

    const results = await mcpServer.searchWebflowModules(q);
    res.json({
      success: true,
      query: q,
      data: results,
      count: results.length,
      source: "webflow",
    });
  } catch (error) {
    console.error("Error searching Webflow modules:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search Webflow modules",
    });
  }
});

/**
 * GET /api/mcp/webflow/categories
 * Get categories from Webflow CMS
 */
router.get("/webflow/categories", async (req: Request, res: Response) => {
  try {
    const categories = await mcpServer.getWebflowCategories();
    res.json({
      success: true,
      data: categories,
      count: categories.length,
      source: "webflow",
    });
  } catch (error) {
    console.error("Error fetching Webflow categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch Webflow categories",
    });
  }
});

/**
 * GET /api/mcp/webflow/tags
 * Get tags from Webflow CMS
 */
router.get("/webflow/tags", async (req: Request, res: Response) => {
  try {
    const tags = await mcpServer.getWebflowTags();
    res.json({
      success: true,
      data: tags,
      count: tags.length,
      source: "webflow",
    });
  } catch (error) {
    console.error("Error fetching Webflow tags:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch Webflow tags",
    });
  }
});

/**
 * POST /api/mcp/webflow/sync/pull
 * Sync from Webflow → Supabase
 */
router.post("/webflow/sync/pull", async (req: Request, res: Response) => {
  try {
    const result = await mcpServer.syncWebflowToSupabase();
    res.json({
      success: result.success,
      data: result.result,
      direction: "pull",
    });
  } catch (error) {
    console.error("Error syncing from Webflow:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync from Webflow",
    });
  }
});

/**
 * POST /api/mcp/webflow/sync/push
 * Sync from Supabase → Webflow
 */
router.post("/webflow/sync/push", async (req: Request, res: Response) => {
  try {
    const result = await mcpServer.syncSupabaseToWebflow();
    res.json({
      success: result.success,
      data: result.result,
      direction: "push",
    });
  } catch (error) {
    console.error("Error syncing to Webflow:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync to Webflow",
    });
  }
});

/**
 * GET /api/mcp/webflow/sync-status/:slug
 * Get sync status for a specific module
 */
router.get(
  "/webflow/sync-status/:slug",
  async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const status = await mcpServer.getSyncStatus(slug);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error("Error getting sync status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get sync status",
      });
    }
  }
);

export default router;
