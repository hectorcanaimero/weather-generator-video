#!/usr/bin/env tsx
/**
 * Migrate existing weather images from old naming format to new format
 * Old: city-timestamp.png
 * New: city-condition.png
 *
 * This allows image reuse based on weather conditions
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrateImages() {
  console.log("🔄 Starting migration of weather images to new naming format...\n");

  const outputDir = path.join(__dirname, "..", "public", "weather-bg");
  const manifestPath = path.join(outputDir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    console.error("❌ Manifest file not found!");
    console.error(`   Expected: ${manifestPath}`);
    return;
  }

  // Load manifest
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  console.log(`📋 Loaded manifest with ${Object.keys(manifest).length} entries\n`);

  let renamedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  const newManifest: Record<string, any> = {};

  // Process each entry
  for (const [cityKey, data] of Object.entries(manifest)) {
    try {
      const oldFilename = (data as any).filename;
      const condition = ((data as any).condition || "sunny").toLowerCase();
      const newFilename = `${cityKey}-${condition}.png`;

      const oldPath = path.join(outputDir, oldFilename);
      const newPath = path.join(outputDir, newFilename);

      console.log(`\n📸 Processing: ${cityKey}`);
      console.log(`   Old: ${oldFilename}`);
      console.log(`   New: ${newFilename}`);
      console.log(`   Condition: ${condition}`);

      // Check if old file exists
      if (!fs.existsSync(oldPath)) {
        console.log(`   ⚠️  Old file not found, skipping`);
        skippedCount++;
        continue;
      }

      // If new filename is same as old, no need to rename
      if (oldFilename === newFilename) {
        console.log(`   ✓ Already using new format, keeping as is`);
        newManifest[cityKey] = {
          ...(data as any),
          filename: newFilename,
        };
        skippedCount++;
        continue;
      }

      // If new file already exists, delete old one
      if (fs.existsSync(newPath)) {
        console.log(`   ♻️ New file already exists, deleting old one`);
        fs.unlinkSync(oldPath);
        newManifest[cityKey] = {
          ...(data as any),
          filename: newFilename,
        };
        renamedCount++;
        continue;
      }

      // Rename file
      fs.renameSync(oldPath, newPath);
      console.log(`   ✅ Renamed successfully`);

      // Update manifest entry
      newManifest[cityKey] = {
        ...(data as any),
        filename: newFilename,
      };

      renamedCount++;
    } catch (error) {
      errorCount++;
      console.error(`   ❌ Error processing ${cityKey}:`, error);
    }
  }

  // Save updated manifest
  fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2));
  console.log("\n✅ Manifest updated with new filenames");

  console.log("\n" + "=".repeat(60));
  console.log("📊 Migration Summary:");
  console.log("=".repeat(60));
  console.log(`Total entries: ${Object.keys(manifest).length}`);
  console.log(`Renamed: ${renamedCount}`);
  console.log(`Skipped (already new format): ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log("=".repeat(60));

  if (renamedCount > 0) {
    console.log("\n✅ Migration completed successfully!");
    console.log(`   ${renamedCount} images renamed to new format`);
    console.log(`   Images are now named: {city}-{condition}.png`);
  } else {
    console.log("\n⚠️  No images were renamed");
  }
}

// Run migration
migrateImages();
