import express from "express";
import cors from "cors";
import { config } from "dotenv";
import modulesRouter from "./routes/modules.js";

config();

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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
    version: "0.1.0",
    description: "A curated library of structured markdown knowledge modules",
    endpoints: {
      modules: "/api/modules",
      search: "/api/modules/search?q=query",
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
  console.log(`✓ CurrentPrompt API running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
