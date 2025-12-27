import express from "express";
import { getVideoRenderQueue } from "../config/queue.js";

const router = express.Router();

/**
 * GET /api/jobs/:jobId
 * Get status of a specific job
 */
router.get("/:jobId", async (req, res) => {
  const { jobId } = req.params;

  try {
    const queue = getVideoRenderQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: "Job not found",
        jobId,
      });
    }

    const state = await job.getState();
    const progress = job.progress || 0;
    const data = job.data;

    // Get result if completed
    let result = null;
    if (state === "completed") {
      result = job.returnvalue;
    }

    // Get error if failed
    let error = null;
    if (state === "failed") {
      error = job.failedReason || "Unknown error";
    }

    return res.json({
      jobId: job.id,
      status: state,
      progress,
      data,
      result,
      error,
      createdAt: new Date(job.timestamp).toISOString(),
      processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
    });
  } catch (error) {
    console.error(`❌ Failed to get job status:`, error);
    return res.status(500).json({
      error: "Failed to get job status",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/jobs
 * List all jobs (optional: with status filter)
 */
router.get("/", async (req, res) => {
  const { status, limit = "10" } = req.query;

  try {
    const queue = getVideoRenderQueue();
    const limitNum = parseInt(limit as string, 10);

    let jobs;
    if (status === "active") {
      jobs = await queue.getActive(0, limitNum - 1);
    } else if (status === "completed") {
      jobs = await queue.getCompleted(0, limitNum - 1);
    } else if (status === "failed") {
      jobs = await queue.getFailed(0, limitNum - 1);
    } else if (status === "waiting") {
      jobs = await queue.getWaiting(0, limitNum - 1);
    } else {
      // Get all recent jobs
      const [active, waiting, completed, failed] = await Promise.all([
        queue.getActive(0, 2),
        queue.getWaiting(0, 2),
        queue.getCompleted(0, limitNum - 5),
        queue.getFailed(0, 2),
      ]);
      jobs = [...active, ...waiting, ...completed, ...failed];
    }

    const jobsWithStatus = await Promise.all(
      jobs.map(async (job) => {
        const state = await job.getState();
        return {
          jobId: job.id,
          status: state,
          progress: job.progress || 0,
          city: job.data.city,
          language: job.data.language,
          createdAt: new Date(job.timestamp).toISOString(),
        };
      })
    );

    return res.json({
      jobs: jobsWithStatus,
      count: jobsWithStatus.length,
    });
  } catch (error) {
    console.error(`❌ Failed to list jobs:`, error);
    return res.status(500).json({
      error: "Failed to list jobs",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
