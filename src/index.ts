import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import modulesRouter from "./routes/modules.js";
import testAgentsRouter from "./routes/test-agents.js";
import { initializeStorageBucket } from "./services/storageService.js";
import { apiLimiter } from "./middleware/rateLimit.js";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Helmet - Sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173"]; // Default for development

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parsing with size limits
app.use(express.json({ limit: "2mb" })); // 2MB limit for JSON payloads
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Rate limiting - Apply to all routes
app.use(apiLimiter);

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Routes
app.use("/api/modules", modulesRouter);
app.use("/api", testAgentsRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static files from frontend build in production
const frontendDistPath = path.join(__dirname, "../frontend/dist");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(frontendDistPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  // Development mode - show API documentation
  app.get("/", (req, res) => {
    res.json({
      name: "CurrentPrompt API",
      version: "2.0.0",
      description:
        "Automated markdown module publishing system with Webflow CMS integration",
      architecture: "Webflow-first",
      endpoints: {
        modules: "/api/modules",
        create: "/api/modules/create (POST JSON - recommended)",
        upload: "/api/modules/upload (POST file - deprecated)",
        sync: "/api/modules/sync/:id",
        testAgents: "/api/test-agents",
        agentHealth: "/api/test-agents/health",
        health: "/health",
      },
      usage: {
        createModule: {
          method: "POST",
          endpoint: "/api/modules/create",
          body: {
            title: "Optional - extracted from H1 if not provided",
            content: "Required - markdown string",
            autoSync: "Optional - default true",
          },
        },
      },
      frontend: {
        development: "Run 'npm run dev' in frontend/ directory",
        url: "http://localhost:5173"
      }
    });
  });

  // 404 handler for development
  app.use((req, res) => {
    res.status(404).json({ success: false, error: "Endpoint not found" });
  });
}

// Initialize storage and start server
async function startServer() {
  try {
    // Initialize Supabase Storage bucket
    await initializeStorageBucket();
    console.log('✓ Supabase Storage initialized');

    app.listen(PORT, () => {
      console.log(`✓ CurrentPrompt API v2.0 running on http://localhost:${PORT}`);
      console.log(`✓ Architecture: Webflow-first automation pipeline`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
