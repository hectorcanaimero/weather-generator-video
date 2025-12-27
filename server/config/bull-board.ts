import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { getVideoRenderQueue } from "./queue.js";

// Create Express adapter for Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

// Initialize Bull Board with our queue
export function initializeBullBoard() {
  const videoQueue = getVideoRenderQueue();

  createBullBoard({
    queues: [new BullMQAdapter(videoQueue)],
    serverAdapter: serverAdapter,
  });

  console.log("✅ Bull Board initialized at /admin/queues");

  return serverAdapter;
}

export { serverAdapter };
