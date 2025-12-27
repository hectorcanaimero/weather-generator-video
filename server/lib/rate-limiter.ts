import { getRedisConnection } from "../config/redis.js";

/**
 * Daily video generation rate limiter using Redis
 */

const DAILY_LIMIT_KEY = "rate-limit:videos:daily";

export interface RateLimitConfig {
  maxVideosPerDay: number;
}

// Default: 500 videos per day (adjustable via environment variable)
const DEFAULT_MAX_VIDEOS_PER_DAY = parseInt(
  process.env.MAX_VIDEOS_PER_DAY || "50",
  10,
);

/**
 * Check if daily video generation limit has been reached
 * @returns Object with isAllowed flag and current count
 */
export async function checkDailyLimit(): Promise<{
  isAllowed: boolean;
  currentCount: number;
  limit: number;
  resetsAt: Date;
}> {
  const redis = getRedisConnection();

  // Get current count
  const countStr = await redis.get(DAILY_LIMIT_KEY);
  const currentCount = countStr ? parseInt(countStr, 10) : 0;

  // Check if limit reached
  const isAllowed = currentCount < DEFAULT_MAX_VIDEOS_PER_DAY;

  // Calculate when the limit resets (midnight UTC)
  const now = new Date();
  const resetsAt = new Date(now);
  resetsAt.setUTCHours(24, 0, 0, 0); // Next midnight UTC

  return {
    isAllowed,
    currentCount,
    limit: DEFAULT_MAX_VIDEOS_PER_DAY,
    resetsAt,
  };
}

/**
 * Increment daily video counter
 * Sets expiration to midnight UTC if this is the first video of the day
 */
export async function incrementDailyCounter(): Promise<number> {
  const redis = getRedisConnection();

  // Increment counter
  const newCount = await redis.incr(DAILY_LIMIT_KEY);

  // If this is the first video of the day, set expiration to midnight UTC
  if (newCount === 1) {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCHours(24, 0, 0, 0);
    const secondsUntilMidnight = Math.floor(
      (midnight.getTime() - now.getTime()) / 1000,
    );

    await redis.expire(DAILY_LIMIT_KEY, secondsUntilMidnight);
    console.log(
      `📊 Daily counter initialized. Resets in ${Math.floor(secondsUntilMidnight / 3600)}h ${Math.floor((secondsUntilMidnight % 3600) / 60)}m`,
    );
  }

  return newCount;
}

/**
 * Get current daily video count
 */
export async function getCurrentDailyCount(): Promise<number> {
  const redis = getRedisConnection();
  const countStr = await redis.get(DAILY_LIMIT_KEY);
  return countStr ? parseInt(countStr, 10) : 0;
}

/**
 * Reset daily counter (admin use only)
 */
export async function resetDailyCounter(): Promise<void> {
  const redis = getRedisConnection();
  await redis.del(DAILY_LIMIT_KEY);
  console.log("🔄 Daily video counter has been reset");
}

/**
 * Get time remaining until limit resets
 */
export async function getTimeUntilReset(): Promise<{
  hours: number;
  minutes: number;
  seconds: number;
}> {
  const redis = getRedisConnection();
  const ttl = await redis.ttl(DAILY_LIMIT_KEY);

  if (ttl <= 0) {
    // No expiration set or key doesn't exist
    return { hours: 0, minutes: 0, seconds: 0 };
  }

  const hours = Math.floor(ttl / 3600);
  const minutes = Math.floor((ttl % 3600) / 60);
  const seconds = ttl % 60;

  return { hours, minutes, seconds };
}
