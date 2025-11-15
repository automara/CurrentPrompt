import express from "express";
import cors from "cors";
import multer from "multer";
import { config } from "dotenv";
import modulesRouter from "./routes/modules.js";

config();

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Routes
app.use("/api/modules", modulesRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "CurrentPrompt API",
    version: "2.0.0",
    description:
      "Automated markdown module publishing system with Webflow CMS integration",
    architecture: "Webflow-first",
    endpoints: {
      modules: "/api/modules",
      upload: "/api/modules/upload",
      sync: "/api/modules/sync/:id",
      health: "/health",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ CurrentPrompt API v2.0 running on http://localhost:${PORT}`);
  console.log(`✓ Architecture: Webflow-first automation pipeline`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
