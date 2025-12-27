import "dotenv/config";
import { createVideoWorker } from "./workers/video-worker.js";
import { createCleanupWorker } from "./workers/cleanup-worker.js";
import { closeQueue } from "./config/queue.js";
import { closeRedisConnection } from "./config/redis.js";

console.log("🚀 Starting video worker process...");

// Create workers
const videoWorker = createVideoWorker();
const cleanupWorker = createCleanupWorker();

// Graceful shutdown
async function shutdown() {
  console.log("\n🛑 Shutting down workers...");

  await videoWorker.close();
  await cleanupWorker.close();
  await closeQueue();
  await closeRedisConnection();

  console.log("✅ Workers shut down gracefully");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("✅ Worker process started successfully");
