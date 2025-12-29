#!/usr/bin/env tsx
/**
 * Debug script to check environment variables inside Docker
 * This helps diagnose if variables are being passed correctly to containers
 */

console.log("🐳 Docker Environment Debug\n");
console.log("=" .repeat(60));

const minioVars = [
  "MINIO_ENDPOINT",
  "MINIO_PORT",
  "MINIO_USE_SSL",
  "MINIO_ACCESS_KEY",
  "MINIO_SECRET_KEY",
  "MINIO_BUCKET",
];

console.log("\n📋 MinIO Environment Variables:");
console.log("-".repeat(60));

minioVars.forEach((key) => {
  const value = process.env[key];

  if (!value) {
    console.error(`❌ ${key}: NOT SET`);
    return;
  }

  if (key.includes("KEY")) {
    const length = value.length;
    const preview = value.substring(0, 4) + "*".repeat(Math.max(0, length - 4));
    console.log(`✓ ${key}:`);
    console.log(`   Value: ${preview}`);
    console.log(`   Length: ${length}`);
    console.log(`   Has whitespace: ${/\s/.test(value) ? "YES ❌" : "NO ✓"}`);
    console.log(`   First char code: ${value.charCodeAt(0)}`);
    console.log(`   Last char code: ${value.charCodeAt(length - 1)}`);
  } else {
    console.log(`✓ ${key}: ${value}`);
  }
  console.log("");
});

console.log("=" .repeat(60));

// Check if all required vars are present
const missing = minioVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error("\n❌ MISSING VARIABLES:", missing.join(", "));
  console.error("\nThis means Docker is NOT receiving these environment variables!");
  console.error("Check your docker-compose.yaml or docker run command.");
  process.exit(1);
} else {
  console.log("\n✅ All MinIO variables are present");
}

// Try to connect
console.log("\n🔌 Attempting MinIO connection...\n");

import * as Minio from "minio";

function sanitizeEndpoint(endpoint: string): string {
  return endpoint.replace(/^https?:\/\//, "");
}

const config = {
  endPoint: sanitizeEndpoint(process.env.MINIO_ENDPOINT || "localhost"),
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
};

const client = new Minio.Client(config);

try {
  console.log("Listing buckets...");
  const buckets = await client.listBuckets();
  console.log(`✅ Connection successful! Found ${buckets.length} buckets:`);
  buckets.forEach((b) => console.log(`   - ${b.name}`));
} catch (error: any) {
  console.error("❌ Connection failed!");
  console.error(`   Error: ${error.message}`);
  console.error(`   Code: ${error.code}`);

  if (error.code === "SignatureDoesNotMatch") {
    console.error("\n💡 SignatureDoesNotMatch means:");
    console.error("   The ACCESS_KEY or SECRET_KEY is incorrect");
    console.error("   Check the values printed above match your MinIO server");
  }

  process.exit(1);
}
