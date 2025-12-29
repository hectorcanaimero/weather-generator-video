#!/usr/bin/env tsx
/**
 * Test the daily generation limit system
 */

import {
  canGenerateImage,
  incrementGenerated,
  incrementReused,
  getLimitInfo,
  getStats,
} from "../server/config/generation-limit.js";

console.log("🧪 Testing Generation Limit System\n");

// Show current stats
console.log("📊 Current Stats:");
const initialStats = getStats();
console.log(`   Date: ${initialStats.date}`);
console.log(`   Generated today: ${initialStats.generatedCount}`);
console.log(`   Reused today: ${initialStats.reusedCount}`);

console.log("\n" + "=".repeat(60));

// Show limit info
const limitInfo = getLimitInfo();
console.log("📋 Limit Information:");
console.log(`   Max daily generations: ${limitInfo.maxDaily}`);
console.log(`   Used: ${limitInfo.used}`);
console.log(`   Remaining: ${limitInfo.remaining}`);
console.log(`   Can generate: ${limitInfo.canGenerate ? "✅ YES" : "❌ NO"}`);
console.log(`   Reused today: ${limitInfo.reused}`);

console.log("\n" + "=".repeat(60));

// Simulate some operations
console.log("🎬 Simulating Operations:\n");

console.log("1. Reusing an image...");
incrementReused();
const afterReuse = getLimitInfo();
console.log(`   Can still generate: ${afterReuse.canGenerate ? "✅ YES" : "❌ NO"}`);
console.log(`   Remaining: ${afterReuse.remaining}`);

console.log("\n2. Generating a new image...");
if (canGenerateImage()) {
  incrementGenerated();
  const afterGen = getLimitInfo();
  console.log(`   ✅ Generated (${afterGen.used}/${afterGen.maxDaily})`);
  console.log(`   Remaining: ${afterGen.remaining}`);
} else {
  console.log(`   ❌ Cannot generate - limit reached!`);
}

console.log("\n" + "=".repeat(60));

// Final stats
const finalStats = getStats();
console.log("📊 Final Stats:");
console.log(`   Generated: ${finalStats.generatedCount}`);
console.log(`   Reused: ${finalStats.reusedCount}`);
console.log(`   Total operations: ${finalStats.generatedCount + finalStats.reusedCount}`);

const finalLimit = getLimitInfo();
console.log(`\n✅ Can still generate: ${finalLimit.canGenerate ? "YES" : "NO"}`);
console.log(`   (${finalLimit.remaining} generations remaining)`);

console.log("\n" + "=".repeat(60));
console.log("💡 Tips:");
console.log("   - Reusing images does NOT count towards the limit");
console.log("   - Only NEW generations count (max 20 per day)");
console.log("   - Limit resets automatically at midnight");
console.log("   - Stats file: data/generation-stats.json");
