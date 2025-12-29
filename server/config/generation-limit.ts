import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DailyStats {
  date: string;
  generatedCount: number;
  reusedCount: number;
}

const STATS_FILE = path.join(__dirname, "../../data/generation-stats.json");
const MAX_DAILY_GENERATIONS = 20;

/**
 * Ensure stats file exists
 */
function ensureStatsFile(): void {
  const dataDir = path.dirname(STATS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(STATS_FILE)) {
    const initialStats: DailyStats = {
      date: getCurrentDate(),
      generatedCount: 0,
      reusedCount: 0,
    };
    fs.writeFileSync(STATS_FILE, JSON.stringify(initialStats, null, 2));
  }
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Load daily stats
 */
function loadStats(): DailyStats {
  ensureStatsFile();
  const data = fs.readFileSync(STATS_FILE, "utf-8");
  return JSON.parse(data);
}

/**
 * Save daily stats
 */
function saveStats(stats: DailyStats): void {
  ensureStatsFile();
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

/**
 * Reset stats if it's a new day
 */
function resetIfNewDay(stats: DailyStats): DailyStats {
  const today = getCurrentDate();
  if (stats.date !== today) {
    console.log(`📅 New day detected, resetting generation counter`);
    console.log(`   Previous: ${stats.date} (${stats.generatedCount} generated, ${stats.reusedCount} reused)`);
    return {
      date: today,
      generatedCount: 0,
      reusedCount: 0,
    };
  }
  return stats;
}

/**
 * Check if we can generate a new image
 * Returns true if allowed, false if limit reached
 */
export function canGenerateImage(): boolean {
  let stats = loadStats();
  stats = resetIfNewDay(stats);
  saveStats(stats);

  return stats.generatedCount < MAX_DAILY_GENERATIONS;
}

/**
 * Get remaining generations for today
 */
export function getRemainingGenerations(): number {
  let stats = loadStats();
  stats = resetIfNewDay(stats);
  saveStats(stats);

  return Math.max(0, MAX_DAILY_GENERATIONS - stats.generatedCount);
}

/**
 * Increment generated images counter
 */
export function incrementGenerated(): void {
  let stats = loadStats();
  stats = resetIfNewDay(stats);
  stats.generatedCount++;
  saveStats(stats);

  console.log(`📊 Generation stats: ${stats.generatedCount}/${MAX_DAILY_GENERATIONS} used today`);
}

/**
 * Increment reused images counter
 */
export function incrementReused(): void {
  let stats = loadStats();
  stats = resetIfNewDay(stats);
  stats.reusedCount++;
  saveStats(stats);

  console.log(`♻️ Reuse stats: ${stats.reusedCount} images reused today`);
}

/**
 * Get current stats
 */
export function getStats(): DailyStats {
  let stats = loadStats();
  stats = resetIfNewDay(stats);
  saveStats(stats);
  return stats;
}

/**
 * Get limit info
 */
export function getLimitInfo() {
  const stats = getStats();
  return {
    maxDaily: MAX_DAILY_GENERATIONS,
    used: stats.generatedCount,
    remaining: Math.max(0, MAX_DAILY_GENERATIONS - stats.generatedCount),
    reused: stats.reusedCount,
    canGenerate: stats.generatedCount < MAX_DAILY_GENERATIONS,
  };
}
