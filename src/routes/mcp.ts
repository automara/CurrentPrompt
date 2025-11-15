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

export default router;
