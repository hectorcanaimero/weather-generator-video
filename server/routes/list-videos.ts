import express from "express";
import { listRecentVideos } from "../config/minio.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;
    console.log(`📋 Fetching last ${limit} videos...`);

    const videos = await listRecentVideos(limit);

    return res.json({
      videos,
      count: videos.length,
    });
  } catch (error) {
    console.error(`❌ Failed to list videos:`, error);
    return res.status(500).json({
      error: "Failed to list videos",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
