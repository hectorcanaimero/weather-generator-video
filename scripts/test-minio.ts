#!/usr/bin/env tsx
/**
 * Test MinIO Connection and Credentials
 * Usage: npm run test:minio
 */

import "dotenv/config";
import * as Minio from "minio";

// Sanitize endpoint helper
function sanitizeEndpoint(endpoint: string): string {
  return endpoint.replace(/^https?:\/\//, "");
}

async function testMinIO() {
  console.log("🧪 Testing MinIO Connection\n");

  // Display configuration (hide sensitive parts)
  const endpoint = sanitizeEndpoint(process.env.MINIO_ENDPOINT || "localhost");
  const port = parseInt(process.env.MINIO_PORT || "9000");
  const useSSL = process.env.MINIO_USE_SSL === "true";
  const accessKey = process.env.MINIO_ACCESS_KEY || "minioadmin";
  const secretKey = process.env.MINIO_SECRET_KEY || "minioadmin";
  const bucket = process.env.MINIO_BUCKET || "weather";

  console.log("📋 Configuration:");
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   Port: ${port}`);
  console.log(`   SSL: ${useSSL}`);
  console.log(`   Access Key: ${accessKey.substring(0, 4)}${"*".repeat(Math.max(0, accessKey.length - 4))}`);
  console.log(`   Secret Key: ${secretKey.substring(0, 4)}${"*".repeat(Math.max(0, secretKey.length - 4))}`);
  console.log(`   Bucket: ${bucket}\n`);

  // Create client
  console.log("🔧 Creating MinIO client...");
  const client = new Minio.Client({
    endPoint: endpoint,
    port,
    useSSL,
    accessKey,
    secretKey,
  });

  try {
    // Test 1: List buckets
    console.log("\n✅ Test 1: List buckets");
    const buckets = await client.listBuckets();
    console.log(`   Found ${buckets.length} buckets:`);
    buckets.forEach((b) => console.log(`   - ${b.name}`));

    // Test 2: Check if target bucket exists
    console.log(`\n✅ Test 2: Check if bucket "${bucket}" exists`);
    const exists = await client.bucketExists(bucket);
    if (exists) {
      console.log(`   ✓ Bucket "${bucket}" exists`);
    } else {
      console.log(`   ✗ Bucket "${bucket}" does NOT exist`);
      console.log(`   Creating bucket...`);
      await client.makeBucket(bucket, "us-east-1");
      console.log(`   ✓ Bucket created successfully`);
    }

    // Test 3: Upload small test file
    console.log(`\n✅ Test 3: Upload test file`);
    const testContent = Buffer.from("MinIO connection test - " + new Date().toISOString());
    const testFilename = `test-${Date.now()}.txt`;
    await client.putObject(bucket, testFilename, testContent, testContent.length, {
      "Content-Type": "text/plain",
    });
    console.log(`   ✓ Test file uploaded: ${testFilename}`);

    // Test 4: Download test file
    console.log(`\n✅ Test 4: Download test file`);
    const stream = await client.getObject(bucket, testFilename);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const downloadedContent = Buffer.concat(chunks).toString();
    console.log(`   ✓ Test file downloaded: ${downloadedContent}`);

    // Test 5: Delete test file
    console.log(`\n✅ Test 5: Delete test file`);
    await client.removeObject(bucket, testFilename);
    console.log(`   ✓ Test file deleted`);

    // Test 6: Test with special characters (like the error case)
    console.log(`\n✅ Test 6: Upload file with special characters`);
    const specialFilename = `test-rondonópolis-${Date.now()}.txt`;
    await client.putObject(bucket, specialFilename, testContent, testContent.length, {
      "Content-Type": "text/plain",
    });
    console.log(`   ✓ Special char file uploaded: ${specialFilename}`);
    await client.removeObject(bucket, specialFilename);
    console.log(`   ✓ Special char file deleted`);

    console.log("\n🎉 All tests passed! MinIO connection is working correctly.\n");
  } catch (error: any) {
    console.error("\n❌ Test failed:");
    console.error(`   Error: ${error.message}`);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    if (error.code === "SignatureDoesNotMatch") {
      console.error("\n💡 Troubleshooting:");
      console.error("   1. Verify MINIO_ACCESS_KEY and MINIO_SECRET_KEY are correct");
      console.error("   2. Check if credentials match your S3/MinIO server configuration");
      console.error("   3. Ensure the endpoint URL is correct (no http:// or https://)");
      console.error("   4. If using AWS S3, ensure region is set correctly");
    }
    process.exit(1);
  }
}

testMinIO();
