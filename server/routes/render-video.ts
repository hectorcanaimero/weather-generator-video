import express from "express";
import { getVideoRenderQueue, VideoRenderJobData } from "../config/queue.js";
import { emitJobProgress } from "../lib/job-events.js";
import {
  checkDailyLimit,
  incrementDailyCounter,
  getTimeUntilReset,
} from "../lib/rate-limiter.js";

const router = express.Router();

interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  description: string;
  date: string;
}

interface RenderRequest {
  city: string;
  weatherData: WeatherData;
  imageFilename: string;
  language?: string;
}

router.post("/", async (req, res) => {
  const {
    city,
    weatherData,
    imageFilename,
    language = "en",
  } = req.body as RenderRequest;

  if (!city || !weatherData || !imageFilename) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // Check daily rate limit
    const limitCheck = await checkDailyLimit();

    if (!limitCheck.isAllowed) {
      const timeUntilReset = await getTimeUntilReset();
      console.warn(
        `⚠️  Daily limit reached: ${limitCheck.currentCount}/${limitCheck.limit}`
      );

      return res.status(429).json({
        error: "Daily video generation limit reached",
        message: `You have reached the daily limit of ${limitCheck.limit} videos. Please try again later.`,
        limit: limitCheck.limit,
        currentCount: limitCheck.currentCount,
        resetsAt: limitCheck.resetsAt.toISOString(),
        resetsIn: {
          hours: timeUntilReset.hours,
          minutes: timeUntilReset.minutes,
        },
      });
    }

    console.log(`📋 Adding video render job to queue for ${city} (${language})...`);
    console.log(
      `📊 Daily usage: ${limitCheck.currentCount + 1}/${limitCheck.limit} videos`
    );

    // Get queue instance
    const queue = getVideoRenderQueue();

    // Prepare job data
    const jobData: VideoRenderJobData = {
      city,
      weatherData,
      imageFilename,
      language,
      requestedAt: new Date().toISOString(),
    };

    // Add job to queue
    const job = await queue.add("render-video", jobData, {
      jobId: `video-${city.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    });

    console.log(`✅ Job added to queue: ${job.id}`);

    // Increment daily counter
    const newCount = await incrementDailyCounter();
    console.log(`📈 Daily counter incremented: ${newCount}/${limitCheck.limit}`);

    // Emit initial "pending" status
    emitJobProgress(job.id!, "pending", 0, "Job queued and waiting to start");

    // Return job ID immediately
    return res.status(202).json({
      jobId: job.id,
      status: "pending",
      message: "Video render job has been queued",
      estimatedTime: "2-5 minutes",
      dailyUsage: {
        current: newCount,
        limit: limitCheck.limit,
        remaining: limitCheck.limit - newCount,
      },
    });
  } catch (error) {
    console.error(`❌ Failed to queue video render:`, error);
    return res.status(500).json({
      error: "Failed to queue video render",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
