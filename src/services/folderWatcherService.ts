import chokidar from "chokidar";
import path from "path";
import { processMarkdownFile } from "./ingestionService.js";

/**
 * Folder Watcher Service - Monitor a folder for new markdown files
 *
 * When a new .md file is detected, automatically trigger the ingestion pipeline
 */

const WATCH_FOLDER = process.env.WATCH_FOLDER || "./uploads";

/**
 * Start watching the uploads folder for new markdown files
 */
export function startWatcher() {
  console.log(`👀 Watching folder for uploads: ${WATCH_FOLDER}`);

  const watcher = chokidar.watch(`${WATCH_FOLDER}/**/*.md`, {
    ignored: /(^|[\/\\])\../, // Ignore dotfiles
    persistent: true,
    ignoreInitial: false, // Process existing files on startup
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  });

  watcher
    .on("add", async (filePath) => {
      console.log(`\n📥 New markdown file detected: ${filePath}`);
      await handleNewFile(filePath);
    })
    .on("error", (error) => {
      console.error("Watcher error:", error);
    });

  return watcher;
}

/**
 * Handle a newly added markdown file
 */
async function handleNewFile(filePath: string) {
  try {
    const result = await processMarkdownFile(filePath, true);

    if (result.success) {
      console.log(`✅ Successfully processed: ${path.basename(filePath)}`);
      console.log(`   Module ID: ${result.moduleId}`);
    } else {
      console.error(`❌ Failed to process: ${path.basename(filePath)}`);
      console.error(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.error(`Error handling file ${filePath}:`, error);
  }
}

/**
 * Stop the watcher
 */
export async function stopWatcher(watcher: chokidar.FSWatcher) {
  await watcher.close();
  console.log("Folder watcher stopped");
}
