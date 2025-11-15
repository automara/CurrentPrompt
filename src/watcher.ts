#!/usr/bin/env node
/**
 * Standalone Folder Watcher
 *
 * Monitors the uploads folder for new markdown files and processes them automatically
 */

import { config } from "dotenv";
import { startWatcher } from "./services/folderWatcherService.js";

config();

console.log("🚀 CurrentPrompt Folder Watcher");
console.log("================================\n");

const watcher = startWatcher();

// Handle process termination
process.on("SIGINT", async () => {
  console.log("\n\n👋 Stopping folder watcher...");
  await watcher.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n\n👋 Stopping folder watcher...");
  await watcher.close();
  process.exit(0);
});
