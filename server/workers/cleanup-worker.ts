import { Worker, Job, Queue } from "bullmq";
import { getRedisConnection } from "../config/redis.js";
import { getVideoRenderQueue } from "../config/queue.js";
import { listRecentVideos, deleteVideo } from "../config/minio.js";

const CLEANUP_QUEUE_NAME = "cleanup-queue";
const RETENTION_DAYS = 30;

interface CleanupJobData {
  type: "jobs" | "videos";
}

/**
 * Cleanup worker for removing old jobs and videos
 */
export function createCleanupWorker(): Worker<CleanupJobData, void> {
  const worker = new Worker<CleanupJobData, void>(
    CLEANUP_QUEUE_NAME,
    async (job: Job<CleanupJobData, void>) => {
      console.log(`🧹 Starting cleanup: ${job.data.type}`);

      if (job.data.type === "videos") {
        await cleanupOldVideos();
      } else if (job.data.type === "jobs") {
        await cleanupOldJobs();
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 1, // Run cleanup jobs sequentially
    }
  );

  worker.on("completed", (job) => {
    console.log(`✅ Cleanup completed: ${job.data.type}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Cleanup failed:`, err);
  });

  // Schedule cleanup to run daily at 2 AM
  scheduleCleanupJobs();

  console.log(`🧹 Cleanup worker started`);

  return worker;
}

/**
 * Remove videos older than 30 days from MinIO
 */
async function cleanupOldVideos(): Promise<void> {
  try {
    console.log("🗑️  Checking for old videos to delete...");

    // Get all videos (high limit to get all)
    const videos = await listRecentVideos(10000);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    let deletedCount = 0;

    for (const video of videos) {
      if (video.uploadDate < cutoffDate) {
        try {
          await deleteVideo(video.filename);
          deletedCount++;
          console.log(`🗑️  Deleted old video: ${video.filename}`);
        } catch (error) {
          console.error(`❌ Failed to delete ${video.filename}:`, error);
        }
      }
    }

    console.log(`✅ Cleanup complete: ${deletedCount} videos deleted`);
  } catch (error) {
    console.error("❌ Error during video cleanup:", error);
    throw error;
  }
}

/**
 * Clean old jobs from Redis (BullMQ handles this automatically via removeOnComplete/removeOnFail)
 * This is just a safety check
 */
async function cleanupOldJobs(): Promise<void> {
  try {
    console.log("🗑️  Checking for old jobs to clean...");

    const queue = getVideoRenderQueue();

    // Clean completed jobs older than 30 days
    await queue.clean(RETENTION_DAYS * 24 * 60 * 60 * 1000, 100, "completed");

    // Clean failed jobs older than 30 days
    await queue.clean(RETENTION_DAYS * 24 * 60 * 60 * 1000, 100, "failed");

    console.log(`✅ Job cleanup complete`);
  } catch (error) {
    console.error("❌ Error during job cleanup:", error);
    throw error;
  }
}

/**
 * Schedule cleanup jobs to run daily at 2 AM
 */
function scheduleCleanupJobs(): void {
  const cleanupQueue = new Queue(CLEANUP_QUEUE_NAME, {
    connection: getRedisConnection(),
  });

  // Add repeatable job for video cleanup
  cleanupQueue.add(
    "cleanup-videos",
    { type: "videos" },
    {
      repeat: {
        pattern: "0 2 * * *", // Cron: 2 AM daily
      },
    }
  );

  // Add repeatable job for jobs cleanup
  cleanupQueue.add(
    "cleanup-jobs",
    { type: "jobs" },
    {
      repeat: {
        pattern: "0 3 * * *", // Cron: 3 AM daily
      },
    }
  );

  console.log("📅 Cleanup jobs scheduled (daily at 2 AM and 3 AM)");
}
