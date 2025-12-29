import { Server as SocketIOServer } from "socket.io";

// Singleton Socket.io instance
let io: SocketIOServer | null = null;

export function setSocketIOInstance(socketServer: SocketIOServer): void {
  io = socketServer;
  console.log("✅ Socket.io instance registered for job events");
}

export function getSocketIOInstance(): SocketIOServer | null {
  return io;
}

// Event types
export type JobStatus = "pending" | "active" | "completed" | "failed";

export interface JobProgressEvent {
  jobId: string;
  status: JobStatus;
  progress: number;
  message: string;
  timestamp: string;
}

export interface JobCompletedEvent {
  jobId: string;
  status: "completed";
  result: {
    videoUrl: string;
    filename: string;
    etag: string;
  };
  timestamp: string;
}

export interface JobFailedEvent {
  jobId: string;
  status: "failed";
  error: string;
  timestamp: string;
}

/**
 * Emit job progress update
 */
export function emitJobProgress(
  jobId: string,
  status: JobStatus,
  progress: number,
  message: string
): void {
  if (!io) {
    console.warn("⚠️  Socket.io not initialized, skipping event emission");
    return;
  }

  const event: JobProgressEvent = {
    jobId,
    status,
    progress,
    message,
    timestamp: new Date().toISOString(),
  };

  // Emit to room specific to this job
  io.to(`job:${jobId}`).emit("job:progress", event);
  console.log(`📡 Emitted job:progress for ${jobId}: ${Math.round(progress)}%`);
}

/**
 * Emit job completed event
 */
export function emitJobCompleted(
  jobId: string,
  result: { videoUrl: string; filename: string; etag: string }
): void {
  if (!io) {
    console.warn("⚠️  Socket.io not initialized, skipping event emission");
    return;
  }

  const event: JobCompletedEvent = {
    jobId,
    status: "completed",
    result,
    timestamp: new Date().toISOString(),
  };

  io.to(`job:${jobId}`).emit("job:completed", event);
  console.log(`📡 Emitted job:completed for ${jobId}`);
  console.log(`   Event data:`, JSON.stringify(event, null, 2));
}

/**
 * Emit job failed event
 */
export function emitJobFailed(jobId: string, error: string): void {
  if (!io) {
    console.warn("⚠️  Socket.io not initialized, skipping event emission");
    return;
  }

  const event: JobFailedEvent = {
    jobId,
    status: "failed",
    error,
    timestamp: new Date().toISOString(),
  };

  io.to(`job:${jobId}`).emit("job:failed", event);
  console.log(`📡 Emitted job:failed for ${jobId}`);
}
