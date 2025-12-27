import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Extract client IP from request
function getClientIP(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (forwarded as string).split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

// Get end of day in UTC
function getEndOfDayUTC(): number {
  const now = new Date();
  const endOfDay = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
  return endOfDay.getTime();
}

// Cleanup expired entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}, 60 * 60 * 1000); // Every hour

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, max, message } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIP(req);
    const now = Date.now();
    let entry = rateLimitStore.get(ip);

    // If no entry or expired, create new one
    if (!entry || now >= entry.resetAt) {
      const resetAt = getEndOfDayUTC();
      entry = { count: 1, resetAt };
      rateLimitStore.set(ip, entry);

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", max.toString());
      res.setHeader("X-RateLimit-Remaining", (max - 1).toString());
      res.setHeader("X-RateLimit-Reset", Math.floor(resetAt / 1000).toString());

      return next();
    }

    // Check if limit exceeded
    if (entry.count >= max) {
      res.setHeader("X-RateLimit-Limit", max.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", Math.floor(entry.resetAt / 1000).toString());

      return res.status(429).json({
        error: "Rate limit exceeded",
        message:
          message ||
          "Has alcanzado el límite de generaciones por día. Intenta mañana.",
        limit: max,
        remaining: 0,
        resetAt: new Date(entry.resetAt).toISOString(),
      });
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(ip, entry);

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", max.toString());
    res.setHeader("X-RateLimit-Remaining", (max - entry.count).toString());
    res.setHeader("X-RateLimit-Reset", Math.floor(entry.resetAt / 1000).toString());

    next();
  };
}
