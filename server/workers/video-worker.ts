import { Worker, Job } from "bullmq";
import {
  QUEUE_NAME,
  defaultWorkerOptions,
  VideoRenderJobData,
  VideoRenderJobResult,
} from "../config/queue.js";
import { renderVideoFile } from "../lib/render-engine.js";
import { emitJobProgress, emitJobCompleted, emitJobFailed } from "../lib/job-events.js";

/**
 * Video rendering worker
 * Processes jobs from the queue and renders videos
 */
export function createVideoWorker(): Worker<VideoRenderJobData, VideoRenderJobResult> {
  const worker = new Worker<VideoRenderJobData, VideoRenderJobResult>(
    QUEUE_NAME,
    async (job: Job<VideoRenderJobData, VideoRenderJobResult>) => {
      console.log(`\n🎬 Processing job ${job.id} for ${job.data.city}...`);

      try {
        // Update job progress: started
        await job.updateProgress({ stage: "started", progress: 0 });
        emitJobProgress(job.id!, "active", 0, "Starting video render...");

        // Render video with progress tracking
        const result = await renderVideoFile(
          {
            city: job.data.city,
            weatherData: job.data.weatherData,
            imageFilename: job.data.imageFilename,
            language: job.data.language,
          },
          async (stage: string, progress: number) => {
            // Update job progress in Redis
            await job.updateProgress({ stage, progress });

            // Emit to Socket.io
            emitJobProgress(job.id!, "active", progress, `${stage}: ${Math.round(progress)}%`);
          }
        );

        console.log(`✅ Job ${job.id} completed successfully`);

        // Emit completion event
        emitJobCompleted(job.id!, result);

        return {
          ...result,
          completedAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error);

        const errorMessage = error instanceof Error ? error.message : String(error);

        // Emit failure event
        emitJobFailed(job.id!, errorMessage);

        throw error; // BullMQ will handle retry logic
      }
    },
    defaultWorkerOptions
  );

  // Worker event listeners
  worker.on("completed", (job) => {
    console.log(`✅ Worker: Job ${job.id} has completed`);
  });

  worker.on("failed", (job, err) => {
    if (job) {
      console.error(`❌ Worker: Job ${job.id} has failed with error:`, err.message);
    }
  });

  worker.on("error", (err) => {
    console.error("❌ Worker error:", err);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`⚠️  Worker: Job ${jobId} has stalled`);
  });

  console.log(`🔧 Video worker started (concurrency: ${defaultWorkerOptions.concurrency})`);

  return worker;
}
