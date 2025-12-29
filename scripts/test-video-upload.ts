#!/usr/bin/env tsx
/**
 * Test MinIO upload with REAL video file
 * This reproduces the exact upload that fails in production
 */

import "dotenv/config";
import { uploadVideo } from "../server/config/minio.js";
import fs from "fs";
import path from "path";

async function testRealVideoUpload() {
  console.log("🧪 Testing MinIO Upload with REAL Video File\n");

  const outDir = path.join(process.cwd(), "out");

  // Find MP4 files in out directory
  const files = fs.readdirSync(outDir).filter(f => f.endsWith('.mp4'));

  if (files.length === 0) {
    console.error("❌ No MP4 files found in /out/ directory");
    console.error("   Please render a video first or ensure the video file exists");
    process.exit(1);
  }

  // Use the first video found (or we could use the specific one)
  const videoFilename = files[0];
  const videoPath = path.join(outDir, videoFilename);

  // Get file stats
  const stats = fs.statSync(videoPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log("📹 Video file details:");
  console.log(`   Filename: ${videoFilename}`);
  console.log(`   Path: ${videoPath}`);
  console.log(`   Size: ${sizeMB} MB (${stats.size} bytes)`);
  console.log(`   Modified: ${stats.mtime}\n`);

  // Extract city name from filename if possible
  const cityMatch = videoFilename.match(/weather-(.+?)-\d+\.mp4/);
  const city = cityMatch ? cityMatch[1] : "Test City";

  console.log("🔧 Upload configuration:");
  console.log(`   City: ${city}`);
  console.log(`   Using EXACT same parameters as production\n`);

  try {
    console.log("📤 Starting upload (this reproduces production upload)...\n");
    console.log("=".repeat(60));

    const result = await uploadVideo(videoPath, videoFilename, {
      city: city,
      temperature: 25,
      condition: "partly cloudy",
      date: new Date().toISOString(),
    });

    console.log("=".repeat(60));
    console.log("\n✅ Upload successful!");
    console.log(`   URL: ${result.url}`);
    console.log(`   ETag: ${result.etag}`);
    console.log("\n🎉 The video uploaded successfully!");
    console.log("   This means MinIO is working correctly for video uploads.");
    console.log(`   You can access the video at: ${result.url}\n`);

  } catch (error: any) {
    console.log("=".repeat(60));
    console.error("\n❌ Upload failed! This is the error:\n");
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);

    if (error.stack) {
      console.error(`\n   Stack trace:`);
      console.error(error.stack.split('\n').map((line: string) => `   ${line}`).join('\n'));
    }

    if (error.code === "SignatureDoesNotMatch") {
      console.error("\n💡 SignatureDoesNotMatch Error:");
      console.error("   This means the credentials are incorrect or have been modified");
      console.error("   1. Check your .env file for correct MINIO_ACCESS_KEY and MINIO_SECRET_KEY");
      console.error("   2. Make sure there are no extra spaces or line breaks in the credentials");
      console.error("   3. Verify the credentials work with: npm run test:minio");
    } else if (error.code === "ENOENT") {
      console.error("\n💡 File Not Found Error:");
      console.error("   The video file doesn't exist at the expected path");
    } else if (error.message?.includes("timeout")) {
      console.error("\n💡 Timeout Error:");
      console.error("   The upload is taking too long - possible network issue");
    } else {
      console.error("\n💡 Unknown Error:");
      console.error("   This is an unexpected error. Please check:");
      console.error("   1. Network connectivity to s3.guria.lat:443");
      console.error("   2. MinIO server status");
      console.error("   3. Bucket permissions");
    }

    console.error("\n");
    process.exit(1);
  }
}

testRealVideoUpload();
