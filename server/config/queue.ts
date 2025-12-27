import { Queue, QueueOptions, WorkerOptions } from "bullmq";
import { getRedisConnection } from "./redis.js";

export const QUEUE_NAME = "video-render-queue";

// Job data interface
export interface VideoRenderJobData {
  city: string;
  weatherData: {
    city: string;
    temperature: number;
    condition: string;
    description: string;
    date: string;
  };
  imageFilename: string;
  language: string;
  requestedAt: string; // ISO timestamp
}

// Job result interface
export interface VideoRenderJobResult {
  videoUrl: string;
  filename: string;
  etag: string;
  completedAt: string;
}

// Queue configuration
const defaultQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 2, // 2 retries total (1 initial + 1 retry)
    backoff: {
      type: "exponential",
      delay: 30000, // 30 seconds initial delay
    },
    removeOnComplete: {
      age: 30 * 24 * 60 * 60, // Keep for 30 days (in seconds)
      count: 1000, // Keep at least 1000 completed jobs
    },
    removeOnFail: {
      age: 30 * 24 * 60 * 60, // Keep failed jobs for 30 days
      count: 500, // Keep at least 500 failed jobs
    },
  },
};

// Worker configuration
export const defaultWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 3, // Max 3 videos rendering simultaneously
  limiter: {
    max: 3, // Max 3 jobs per period
    duration: 1000, // Per second
  },
};

// Create queue instance (singleton)
let queueInstance: Queue<VideoRenderJobData, VideoRenderJobResult> | null = null;

export function getVideoRenderQueue(): Queue<VideoRenderJobData, VideoRenderJobResult> {
  if (!queueInstance) {
    queueInstance = new Queue<VideoRenderJobData, VideoRenderJobResult>(
      QUEUE_NAME,
      defaultQueueOptions
    );

    queueInstance.on("error", (error) => {
      console.error("❌ Queue error:", error);
    });
  }

  return queueInstance;
}

// Close queue gracefully
export async function closeQueue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
  }
}
