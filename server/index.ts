import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { initBucket } from "./config/minio.js";
import { checkRedisHealth } from "./config/redis.js";
import { setSocketIOInstance } from "./lib/job-events.js";
import { initializeBullBoard } from "./config/bull-board.js";
import { createVideoWorker } from "./workers/video-worker.js";
import { createCleanupWorker } from "./workers/cleanup-worker.js";
import weatherRouter from "./routes/weather.js";
import imageRouter from "./routes/generate-image.js";
import renderRouter from "./routes/render-video.js";
import jobStatusRouter from "./routes/job-status.js";
import listVideosRouter from "./routes/list-videos.js";
import geocodeRouter from "./routes/geocode.js";
import rateLimitRouter from "./routes/rate-limit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Initialize Socket.io
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*", // Configure this properly in production
    methods: ["GET", "POST"],
  },
});

// Register Socket.io instance for job events
setSocketIOInstance(io);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join room for specific job
  socket.on("subscribe:job", (jobId: string) => {
    socket.join(`job:${jobId}`);
    console.log(`📥 Client ${socket.id} subscribed to job:${jobId}`);
  });

  // Leave room
  socket.on("unsubscribe:job", (jobId: string) => {
    socket.leave(`job:${jobId}`);
    console.log(`📤 Client ${socket.id} unsubscribed from job:${jobId}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// Bull Board - Dashboard de colas
const bullBoardAdapter = initializeBullBoard();
app.use("/admin/queues", bullBoardAdapter.getRouter());

// API routes
app.use("/api/weather", weatherRouter);
app.use("/api/generate-image", imageRouter);
app.use("/api/render-video", renderRouter);
app.use("/api/jobs", jobStatusRouter);
app.use("/api/videos", listVideosRouter);
app.use("/api/geocode", geocodeRouter);
app.use("/api/rate-limit", rateLimitRouter);

// Serve videos
app.use("/videos", express.static(path.join(__dirname, "../out")));

// Health check (enhanced with Redis)
app.get("/api/health", async (_req, res) => {
  const minioHealthy = true; // MinIO check already done in startup
  const redisHealthy = await checkRedisHealth();

  res.json({
    status: redisHealthy ? "ok" : "degraded",
    services: {
      minio: minioHealthy,
      redis: redisHealthy,
    },
  });
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialize MinIO
    const minioConnected = await initBucket();
    if (minioConnected) {
      console.log(`✅ MinIO initialized successfully`);
    } else {
      console.warn(`⚠️  Starting server without MinIO connection`);
    }

    // Check Redis connection
    const redisHealthy = await checkRedisHealth();
    if (redisHealthy) {
      console.log(`✅ Redis connection verified`);
    } else {
      console.error(`❌ Redis is not available!`);
      console.error(`   Video queue will not work until Redis is available.`);
      console.error(`   Check your REDIS_URL in .env: ${process.env.REDIS_URL || "redis://localhost:6379"}\n`);
    }

    // Start HTTP server (not just Express)
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📁 Serving static files from: ${path.join(__dirname, "../public")}`);
      console.log(`🔌 Socket.io enabled for real-time updates`);
      console.log(`📊 Bull Board dashboard: http://localhost:${PORT}/admin/queues`);

      if (!minioConnected) {
        console.log(`\n⚠️  WARNING: MinIO is not connected!`);
        console.log(`   Video uploads will fail until MinIO is available.\n`);
      }
    });

    // Start workers (after Socket.io is initialized)
    if (redisHealthy) {
      console.log(`🔧 Starting video worker (concurrency: 3)...`);
      const videoWorker = createVideoWorker();

      console.log(`🧹 Starting cleanup worker...`);
      const cleanupWorker = createCleanupWorker();

      // Handle graceful shutdown for workers
      const shutdownWorkers = async () => {
        console.log("🛑 Shutting down workers...");
        await videoWorker.close();
        await cleanupWorker.close();
        console.log("✅ Workers closed");
      };

      process.on("SIGTERM", shutdownWorkers);
      process.on("SIGINT", shutdownWorkers);

      console.log(`✅ Workers started successfully`);
    } else {
      console.warn(`⚠️  Workers not started (Redis unavailable)`);
    }
  } catch (error) {
    console.error(`❌ Failed to start server:`, error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  httpServer.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});
