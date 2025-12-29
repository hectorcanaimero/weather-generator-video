import * as Minio from "minio";
import fs from "fs";
import { saveVideo, getRecentVideos as getRecentVideosFromDB } from "./database.js";

/**
 * Sanitize endpoint by removing protocol if present
 * MinIO client only accepts hostname, not full URLs
 */
function sanitizeEndpoint(endpoint: string): string {
  return endpoint.replace(/^https?:\/\//, "");
}

/**
 * Sanitize credentials by trimming whitespace
 * This prevents SignatureDoesNotMatch errors from spaces
 */
function sanitizeCredential(value: string): string {
  return value.trim();
}

// Log MinIO configuration (hide sensitive parts)
const minioConfig = {
  endPoint: sanitizeEndpoint(process.env.MINIO_ENDPOINT || "localhost"),
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: sanitizeCredential(process.env.MINIO_ACCESS_KEY || "minioadmin"),
  secretKey: sanitizeCredential(process.env.MINIO_SECRET_KEY || "minioadmin"),
};

console.log("🔧 MinIO Client Configuration:");
console.log(`   Endpoint: ${minioConfig.endPoint}`);
console.log(`   Port: ${minioConfig.port}`);
console.log(`   SSL: ${minioConfig.useSSL}`);
console.log(
  `   Access Key: ${minioConfig.accessKey.substring(0, 4)}${"*".repeat(Math.max(0, minioConfig.accessKey.length - 4))} (length: ${minioConfig.accessKey.length})`,
);
console.log(
  `   Secret Key: ${minioConfig.secretKey.substring(0, 4)}${"*".repeat(Math.max(0, minioConfig.secretKey.length - 4))} (length: ${minioConfig.secretKey.length})`,
);

// MinIO client configuration
const minioClient = new Minio.Client(minioConfig);

const BUCKET_NAME = process.env.MINIO_BUCKET || "weather";

/**
 * Initialize MinIO bucket
 */
export async function initBucket(): Promise<boolean> {
  try {
    const endpoint = sanitizeEndpoint(
      process.env.MINIO_ENDPOINT || "localhost",
    );
    const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
    console.log(
      `🔗 Connecting to MinIO at ${protocol}://${endpoint}:${process.env.MINIO_PORT}...`,
    );

    const exists = await minioClient.bucketExists(BUCKET_NAME);

    if (!exists) {
      console.log(`📦 Creating MinIO bucket: ${BUCKET_NAME}`);
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1");

      // Set bucket policy to allow public read access
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log(`✅ Bucket created and configured: ${BUCKET_NAME}`);
    } else {
      console.log(`✅ MinIO bucket already exists: ${BUCKET_NAME}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Error initializing MinIO bucket:`, error);
    console.warn(
      `⚠️ Server will start without MinIO. Video upload will fail until MinIO is available.`,
    );
    console.warn(`⚠️ Please check your MinIO configuration in .env file`);
    return false;
  }
}

/**
 * Upload video file to MinIO
 */
export async function uploadVideo(
  filePath: string,
  filename: string,
  _metadata?: {
    city: string;
    temperature: number;
    condition: string;
    date: string;
  },
): Promise<{ url: string; etag: string }> {
  try {
    console.log(`\n📤 ========== STARTING UPLOAD ==========`);
    console.log(`   File: ${filename}`);
    console.log(`   Path: ${filePath}`);
    console.log(`   Bucket: ${BUCKET_NAME}`);
    console.log(`   File size: ${fs.statSync(filePath).size} bytes`);
    console.log(`   Current MinIO Config:`);
    console.log(`      Endpoint: ${minioConfig.endPoint}:${minioConfig.port}`);
    console.log(`      SSL: ${minioConfig.useSSL}`);
    console.log(
      `      Access Key: ${minioConfig.accessKey.substring(0, 4)}***`,
    );
    console.log(
      `      Secret Key: ${minioConfig.secretKey.substring(0, 4)}***`,
    );

    // Prepare metadata - only Content-Type
    const metaData = {
      "Content-Type": "video/mp4",
    };

    console.log(`   Metadata:`, metaData);

    // Upload file using fPutObject (more reliable for large files)
    console.log(`   Calling minioClient.fPutObject() (file-based upload)...`);
    const uploadInfo = await minioClient.fPutObject(
      BUCKET_NAME,
      filename,
      filePath,
      metaData,
    );
    console.log(`   fPutObject() completed successfully`);

    // Generate public URL
    console.log(`   Generating public URL...`);
    const url = await getPublicUrl(filename);

    // Save metadata to database
    if (_metadata) {
      console.log(`   Saving video metadata to database...`);
      try {
        const fileStats = fs.statSync(filePath);
        saveVideo({
          filename,
          url,
          city: _metadata.city,
          temperature: _metadata.temperature,
          condition: _metadata.condition,
          weather_date: _metadata.date,
          file_size: fileStats.size,
          etag: uploadInfo.etag,
        });
        console.log(`   ✓ Metadata saved to database`);
      } catch (dbError) {
        console.warn(`   ⚠️ Failed to save metadata to database:`, dbError);
        // Don't fail the upload if database save fails
      }
    }

    console.log(`✅ ========== UPLOAD SUCCESS ==========`);
    console.log(`   Filename: ${filename}`);
    console.log(`   URL: ${url}`);
    console.log(`   ETag: ${uploadInfo.etag}`);
    console.log(`======================================\n`);

    return {
      url,
      etag: uploadInfo.etag,
    };
  } catch (error: any) {
    console.error(`\n❌ ========== UPLOAD FAILED ==========`);
    console.error(`   File: ${filename}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    console.error(`   Stack:`, error.stack);
    console.error(`   Used Config at time of error:`);
    console.error(
      `      Endpoint: ${minioConfig.endPoint}:${minioConfig.port}`,
    );
    console.error(`      SSL: ${minioConfig.useSSL}`);
    console.error(
      `      Access Key: ${minioConfig.accessKey.substring(0, 4)}*** (length: ${minioConfig.accessKey.length})`,
    );
    console.error(
      `      Secret Key: ${minioConfig.secretKey.substring(0, 4)}*** (length: ${minioConfig.secretKey.length})`,
    );
    console.error(`      Bucket: ${BUCKET_NAME}`);

    if (error.code === "SignatureDoesNotMatch") {
      console.error(`\n💡 SignatureDoesNotMatch Troubleshooting:`);
      console.error(`   This error ONLY occurs when credentials are wrong.`);
      console.error(
        `   1. Compare the Access/Secret keys above with your .env file`,
      );
      console.error(`   2. Check for spaces at start/end of keys in .env`);
      console.error(
        `   3. Verify endpoint is correct: ${minioConfig.endPoint}`,
      );
      console.error(`   4. Test with: npm run test:minio`);
      console.error(
        `   5. If test passes but this fails, keys changed between test and now`,
      );
    }
    console.error(`======================================\n`);
    throw error;
  }
}

/**
 * Get public URL for a file
 */
export async function getPublicUrl(filename: string): Promise<string> {
  // For public buckets, construct the direct URL
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const endpoint = sanitizeEndpoint(process.env.MINIO_ENDPOINT || "localhost");
  const port = process.env.MINIO_PORT || "9000";

  // If using standard ports (80/443), don't include port in URL
  const portSuffix =
    (protocol === "http" && port === "80") ||
    (protocol === "https" && port === "443")
      ? ""
      : `:${port}`;

  return `${protocol}://${endpoint}${portSuffix}/${BUCKET_NAME}/${filename}`;
}

/**
 * List recent videos (last N videos)
 */
export async function listRecentVideos(limit: number = 6): Promise<
  Array<{
    filename: string;
    url: string;
    size: number;
    uploadDate: Date;
    metadata: {
      city?: string;
      temperature?: string;
      condition?: string;
      date?: string;
    };
  }>
> {
  try {
    console.log(`📋 Listing recent ${limit} videos from database...`);

    // Get videos from database
    const dbVideos = getRecentVideosFromDB(limit);

    // Convert to expected format
    const videos = dbVideos.map((video) => ({
      filename: video.filename,
      url: video.url,
      size: video.file_size || 0,
      uploadDate: video.created_at ? new Date(video.created_at) : new Date(),
      metadata: {
        city: video.city,
        temperature: video.temperature.toString(),
        condition: video.condition,
        date: video.weather_date,
      },
    }));

    console.log(`✅ Found ${videos.length} recent videos`);
    return videos;
  } catch (error) {
    console.error(`❌ Error listing videos from database:`, error);
    return [];
  }
}

/**
 * Delete a video from MinIO
 */
export async function deleteVideo(filename: string): Promise<void> {
  try {
    await minioClient.removeObject(BUCKET_NAME, filename);
    console.log(`🗑️ Deleted video: ${filename}`);
  } catch (error) {
    console.error(`❌ Error deleting video:`, error);
    throw error;
  }
}

export { minioClient, BUCKET_NAME };
