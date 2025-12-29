import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Database path
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "videos.db");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma("journal_mode = WAL");

/**
 * Initialize database schema
 */
export function initDatabase(): void {
  console.log("🗄️  Initializing SQLite database...");

  // Create videos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      city TEXT NOT NULL,
      temperature REAL NOT NULL,
      condition TEXT NOT NULL,
      weather_description TEXT,
      weather_date TEXT NOT NULL,
      language TEXT DEFAULT 'es',
      file_size INTEGER,
      etag TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create index on filename for faster lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_videos_filename ON videos(filename);
  `);

  // Create index on created_at for sorting
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
  `);

  console.log("✅ Database initialized successfully");
  console.log(`   Location: ${DB_PATH}`);
}

/**
 * Video metadata interface
 */
export interface VideoRecord {
  id?: number;
  filename: string;
  url: string;
  city: string;
  temperature: number;
  condition: string;
  weather_description?: string;
  weather_date: string;
  language?: string;
  file_size?: number;
  etag?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Insert or update video record
 */
export function saveVideo(video: VideoRecord): void {
  const stmt = db.prepare(`
    INSERT INTO videos (
      filename, url, city, temperature, condition,
      weather_description, weather_date, language, file_size, etag
    ) VALUES (
      @filename, @url, @city, @temperature, @condition,
      @weather_description, @weather_date, @language, @file_size, @etag
    )
    ON CONFLICT(filename) DO UPDATE SET
      url = @url,
      city = @city,
      temperature = @temperature,
      condition = @condition,
      weather_description = @weather_description,
      weather_date = @weather_date,
      language = @language,
      file_size = @file_size,
      etag = @etag,
      updated_at = datetime('now')
  `);

  stmt.run({
    filename: video.filename,
    url: video.url,
    city: video.city,
    temperature: video.temperature,
    condition: video.condition,
    weather_description: video.weather_description || null,
    weather_date: video.weather_date,
    language: video.language || "es",
    file_size: video.file_size || null,
    etag: video.etag || null,
  });

  console.log(`💾 Video saved to database: ${video.filename}`);
}

/**
 * Get recent videos
 */
export function getRecentVideos(limit: number = 6): VideoRecord[] {
  const stmt = db.prepare(`
    SELECT * FROM videos
    ORDER BY created_at DESC
    LIMIT ?
  `);

  return stmt.all(limit) as VideoRecord[];
}

/**
 * Get video by filename
 */
export function getVideoByFilename(filename: string): VideoRecord | undefined {
  const stmt = db.prepare(`
    SELECT * FROM videos
    WHERE filename = ?
  `);

  return stmt.get(filename) as VideoRecord | undefined;
}

/**
 * Delete video record
 */
export function deleteVideo(filename: string): void {
  const stmt = db.prepare(`
    DELETE FROM videos
    WHERE filename = ?
  `);

  stmt.run(filename);
  console.log(`🗑️ Video deleted from database: ${filename}`);
}

/**
 * Get total video count
 */
export function getVideoCount(): number {
  const result = db.prepare("SELECT COUNT(*) as count FROM videos").get() as {
    count: number;
  };
  return result.count;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  db.close();
}

export default db;
