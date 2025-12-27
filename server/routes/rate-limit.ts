import express from "express";
import {
  checkDailyLimit,
  getCurrentDailyCount,
  getTimeUntilReset,
  resetDailyCounter,
} from "../lib/rate-limiter.js";

const router = express.Router();

/**
 * GET /api/rate-limit
 * Get current rate limit status
 */
router.get("/", async (_req, res) => {
  try {
    const limitCheck = await checkDailyLimit();
    const timeUntilReset = await getTimeUntilReset();

    return res.json({
      limit: limitCheck.limit,
      current: limitCheck.currentCount,
      remaining: limitCheck.limit - limitCheck.currentCount,
      isAllowed: limitCheck.isAllowed,
      resetsAt: limitCheck.resetsAt.toISOString(),
      resetsIn: {
        hours: timeUntilReset.hours,
        minutes: timeUntilReset.minutes,
        seconds: timeUntilReset.seconds,
      },
    });
  } catch (error) {
    console.error("❌ Failed to get rate limit status:", error);
    return res.status(500).json({
      error: "Failed to get rate limit status",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/rate-limit/current
 * Get current daily video count
 */
router.get("/current", async (_req, res) => {
  try {
    const count = await getCurrentDailyCount();
    return res.json({ count });
  } catch (error) {
    console.error("❌ Failed to get daily count:", error);
    return res.status(500).json({
      error: "Failed to get daily count",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/rate-limit/reset
 * Reset daily counter (admin only - should add authentication)
 */
router.post("/reset", async (_req, res) => {
  try {
    // TODO: Add admin authentication here
    // For now, this is open - YOU SHOULD PROTECT THIS ENDPOINT

    await resetDailyCounter();

    return res.json({
      success: true,
      message: "Daily counter has been reset",
    });
  } catch (error) {
    console.error("❌ Failed to reset daily counter:", error);
    return res.status(500).json({
      error: "Failed to reset daily counter",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
