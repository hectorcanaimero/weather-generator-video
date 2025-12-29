#!/usr/bin/env tsx
/**
 * Test MinIO upload with a real video file
 * This simulates what the worker does
 */

import "dotenv/config";
import { uploadVideo } from "../server/config/minio.js";
import fs from "fs";
import path from "path";

async function testUpload() {
  console.log("🧪 Testing MinIO Upload (simulating worker)\n");

  // Create a small test video file
  const testFilename = `test-upload-${Date.now()}.mp4`;
  const testPath = path.join(process.cwd(), "out", testFilename);

  // Ensure out directory exists
  const outDir = path.join(process.cwd(), "out");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Create a minimal MP4 file (just a few bytes to test)
  // This is a minimal valid MP4 header
  const minimalMp4 = Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp box
    0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
    0x6d, 0x70, 0x34, 0x31, 0x00, 0x00, 0x00, 0x08,
  ]);

  console.log(`📝 Creating test file: ${testPath}`);
  fs.writeFileSync(testPath, minimalMp4);
  console.log(`✓ Test file created (${minimalMp4.length} bytes)\n`);

  try {
    console.log("📤 Attempting upload (this is what the worker does)...\n");

    const result = await uploadVideo(testPath, testFilename, {
      city: "Test City",
      temperature: 25,
      condition: "sunny",
      date: new Date().toISOString(),
    });

    console.log("\n✅ Upload successful!");
    console.log(`   URL: ${result.url}`);
    console.log(`   ETag: ${result.etag}`);
  } catch (error: any) {
    console.error("\n❌ Upload failed!");
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);

    if (error.code === "SignatureDoesNotMatch") {
      console.error("\n💡 This is the same error you're seeing!");
      console.error("   The credentials used for upload don't match MinIO server");
    }

    // Clean up test file
    try {
      fs.unlinkSync(testPath);
    } catch (e) {
      // ignore
    }

    process.exit(1);
  }

  // Clean up test file
  console.log("\n🧹 Cleaning up test file...");
  try {
    fs.unlinkSync(testPath);
    console.log("✓ Test file deleted\n");
  } catch (error) {
    console.warn(`⚠️ Could not delete test file: ${error}`);
  }

  console.log("🎉 All tests passed! Upload works correctly.");
}

testUpload();
