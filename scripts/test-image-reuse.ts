#!/usr/bin/env tsx
/**
 * Test image reuse logic without calling the API
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function testImageReuse() {
  console.log("🧪 Testing Image Reuse Logic\n");

  const outputDir = path.join(__dirname, "..", "public", "weather-bg");
  const manifestPath = path.join(outputDir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    console.error("❌ Manifest not found!");
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  console.log(`📋 Loaded manifest with ${Object.keys(manifest).length} entries\n`);

  // Test cases
  const testCases = [
    {
      city: "Chicago",
      condition: "sunny",
      description: "Should REUSE existing image",
    },
    {
      city: "Chicago",
      condition: "rain",
      description: "Should GENERATE new image (different condition)",
    },
    {
      city: "Paris",
      condition: "sunny",
      description: "Should REUSE existing image",
    },
    {
      city: "Curitiba",
      condition: "rain",
      description: "Should GENERATE new image (new city)",
    },
    {
      city: "Rondonópolis",
      condition: "cloudy",
      description: "Should REUSE existing image",
    },
  ];

  console.log("=".repeat(70));
  console.log("Test Cases:");
  console.log("=".repeat(70));

  testCases.forEach((test, index) => {
    const cityKey = test.city.toLowerCase().replace(/\s+/g, "-");
    const filename = `${cityKey}-${test.condition}.png`;
    const filepath = path.join(outputDir, filename);
    const exists = fs.existsSync(filepath);

    console.log(`\n${index + 1}. ${test.city} - ${test.condition}`);
    console.log(`   Expected: ${test.description}`);
    console.log(`   Filename: ${filename}`);
    console.log(`   Exists: ${exists ? "✅ YES" : "❌ NO"}`);
    console.log(`   Result: ${exists ? "♻️ REUSE" : "✨ GENERATE"}`);
  });

  console.log("\n" + "=".repeat(70));
  console.log("Current Images by Condition:");
  console.log("=".repeat(70));

  const conditionCounts: Record<string, string[]> = {
    sunny: [],
    cloudy: [],
    rain: [],
    storm: [],
  };

  Object.entries(manifest).forEach(([cityKey, data]: [string, any]) => {
    const condition = data.condition.toLowerCase();
    if (conditionCounts[condition]) {
      conditionCounts[condition].push(cityKey);
    }
  });

  Object.entries(conditionCounts).forEach(([condition, cities]) => {
    console.log(`\n${condition.toUpperCase()} (${cities.length} images):`);
    if (cities.length > 0) {
      cities.forEach((city) => {
        console.log(`  - ${city}`);
      });
    } else {
      console.log(`  (none)`);
    }
  });

  console.log("\n" + "=".repeat(70));
  console.log("Summary:");
  console.log("=".repeat(70));
  console.log(`Total cities: ${Object.keys(manifest).length}`);
  console.log(`Total images: ${Object.keys(manifest).length}`);
  console.log(`Max possible images: ${Object.keys(manifest).length} × 4 = ${Object.keys(manifest).length * 4}`);
  console.log(
    `Current coverage: ${Object.keys(manifest).length} / ${Object.keys(manifest).length * 4} (${((Object.keys(manifest).length / (Object.keys(manifest).length * 4)) * 100).toFixed(1)}%)`
  );

  console.log("\n✅ Test completed!");
}

testImageReuse();
