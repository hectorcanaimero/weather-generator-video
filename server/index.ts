import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initBucket } from "./config/minio.js";
import weatherRouter from "./routes/weather.js";
import imageRouter from "./routes/generate-image.js";
import renderRouter from "./routes/render-video.js";
import listVideosRouter from "./routes/list-videos.js";
import geocodeRouter from "./routes/geocode.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// API routes
app.use("/api/weather", weatherRouter);
app.use("/api/generate-image", imageRouter);
app.use("/api/render-video", renderRouter);
app.use("/api/videos", listVideosRouter);
app.use("/api/geocode", geocodeRouter);

// Serve videos
app.use("/videos", express.static(path.join(__dirname, "../out")));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Initialize MinIO and start server
async function startServer() {
  try {
    // Try to initialize MinIO, but don't fail if it's not available
    const minioConnected = await initBucket();

    if (minioConnected) {
      console.log(`✅ MinIO initialized successfully`);
    } else {
      console.warn(`⚠️ Starting server without MinIO connection`);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📁 Serving static files from: ${path.join(__dirname, "../public")}`);

      if (!minioConnected) {
        console.log(`\n⚠️  WARNING: MinIO is not connected!`);
        console.log(`   Video uploads will fail until MinIO is available.`);
        console.log(`   Check your MINIO_ENDPOINT in .env: ${process.env.MINIO_ENDPOINT}\n`);
      }
    });
  } catch (error) {
    console.error(`❌ Failed to start server:`, error);
    process.exit(1);
  }
}

startServer();
