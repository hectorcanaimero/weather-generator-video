#!/usr/bin/env tsx
/**
 * Migrate existing videos from MinIO to SQLite database
 * This script reads all videos from MinIO bucket and populates the database
 */

import "dotenv/config";
import { minioClient, BUCKET_NAME, getPublicUrl } from "../server/config/minio.js";
import { initDatabase, saveVideo } from "../server/config/database.js";

async function migrateVideos() {
  console.log("🔄 Starting migration of videos from MinIO to database...\n");

  // Initialize database
  initDatabase();

  try {
    const videosList: Array<{
      name: string;
      lastModified: Date;
      size: number;
    }> = [];

    console.log(`📋 Listing all videos from MinIO bucket: ${BUCKET_NAME}...`);

    // Stream objects from bucket
    const stream = minioClient.listObjectsV2(BUCKET_NAME, "", true);

    for await (const obj of stream) {
      if (obj.name && obj.name.endsWith(".mp4")) {
        videosList.push({
          name: obj.name,
          lastModified: obj.lastModified || new Date(),
          size: obj.size || 0,
        });
      }
    }

    console.log(`✅ Found ${videosList.length} videos in MinIO\n`);

    if (videosList.length === 0) {
      console.log("No videos to migrate.");
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each video
    for (const video of videosList) {
      try {
        console.log(`\n📹 Processing: ${video.name}`);

        // Get public URL
        const url = await getPublicUrl(video.name);

        // Try to get object tags for metadata
        let metadata: any = {};
        let hasTags = false;

        try {
          const tagsList = await minioClient.getObjectTagging(BUCKET_NAME, video.name);

          if (tagsList && tagsList.length > 0) {
            // Convert tag array to object
            const tagsObj = tagsList.reduce((acc: Record<string, string>, tag) => {
              acc[tag.Key] = tag.Value;
              return acc;
            }, {});

            metadata = {
              city: tagsObj.city || "Unknown",
              temperature: parseFloat(tagsObj.temperature) || 25,
              condition: tagsObj.condition || "sunny",
              date: tagsObj.date || tagsObj.uploadDate || new Date().toISOString(),
            };
            hasTags = true;
            console.log(`   ✓ Found tags:`, metadata);
          }
        } catch (tagError) {
          console.log(`   ⚠️  No tags found, will extract from filename`);
        }

        // If no tags, try to extract city from filename
        if (!hasTags) {
          // Filename format: weather-{city}-{timestamp}.mp4
          const cityMatch = video.name.match(/weather-(.+?)-\d+\.mp4/);
          if (cityMatch) {
            metadata = {
              city: cityMatch[1],
              temperature: 25, // Default
              condition: "sunny", // Default
              date: video.lastModified.toISOString(),
            };
            console.log(`   ✓ Extracted from filename:`, metadata);
          } else {
            console.log(`   ⚠️  Could not extract city from filename, using defaults`);
            metadata = {
              city: "Unknown",
              temperature: 25,
              condition: "sunny",
              date: video.lastModified.toISOString(),
            };
          }
        }

        // Save to database
        saveVideo({
          filename: video.name,
          url,
          city: metadata.city,
          temperature: metadata.temperature,
          condition: metadata.condition,
          weather_date: metadata.date,
          file_size: video.size,
        });

        migratedCount++;
        console.log(`   ✅ Migrated successfully`);
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error migrating ${video.name}:`, error);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Migration Summary:");
    console.log("=".repeat(60));
    console.log(`Total videos found: ${videosList.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log("=".repeat(60));

    if (migratedCount > 0) {
      console.log("\n✅ Migration completed successfully!");
      console.log(`   ${migratedCount} videos are now in the database`);
    } else {
      console.log("\n⚠️  No videos were migrated");
    }
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateVideos();
