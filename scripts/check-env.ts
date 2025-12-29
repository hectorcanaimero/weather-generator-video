#!/usr/bin/env tsx
/**
 * Check .env file for common issues
 * Usage: npm run check:env
 */

import "dotenv/config";
import fs from "fs";
import path from "path";

function checkEnvFile() {
  console.log("🔍 Checking .env file for issues...\n");

  const envPath = path.join(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) {
    console.error("❌ .env file not found!");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const lines = envContent.split("\n");

  let hasIssues = false;

  // Check each line
  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith("#")) {
      return;
    }

    // Check for key=value format
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (!match) {
      return;
    }

    const [, key, value] = match;

    // Check for trailing spaces
    if (value !== value.trimEnd()) {
      console.warn(`⚠️  Line ${lineNum}: ${key} has trailing spaces`);
      hasIssues = true;
    }

    // Check for leading spaces in value
    if (value !== value.trimStart()) {
      console.warn(`⚠️  Line ${lineNum}: ${key} has leading spaces in value`);
      hasIssues = true;
    }

    // Check for quotes (usually not needed in .env)
    if (value.startsWith('"') || value.startsWith("'")) {
      console.warn(`⚠️  Line ${lineNum}: ${key} has quotes (may not be necessary)`);
    }
  });

  console.log("\n📋 Current MinIO Configuration:");
  const minioKeys = [
    "MINIO_ENDPOINT",
    "MINIO_PORT",
    "MINIO_USE_SSL",
    "MINIO_ACCESS_KEY",
    "MINIO_SECRET_KEY",
    "MINIO_BUCKET",
  ];

  minioKeys.forEach((key) => {
    const value = process.env[key];
    if (!value) {
      console.error(`❌ ${key} is not set!`);
      hasIssues = true;
      return;
    }

    // Show length and first/last chars for keys
    if (key.includes("KEY")) {
      console.log(
        `✓ ${key}: '${value.substring(0, 4)}***' (length: ${value.length})`
      );

      // Check for invisible characters
      if (/\s/.test(value)) {
        console.error(`   ❌ Contains whitespace characters!`);
        hasIssues = true;
      }
    } else {
      console.log(`✓ ${key}: '${value}'`);
    }
  });

  if (hasIssues) {
    console.log("\n❌ Issues found! Please fix your .env file.");
    console.log("\nRecommended fixes:");
    console.log("1. Remove any trailing/leading spaces from values");
    console.log("2. Remove quotes unless absolutely necessary");
    console.log("3. Ensure no whitespace in access/secret keys");
    process.exit(1);
  } else {
    console.log("\n✅ .env file looks good!");
  }
}

checkEnvFile();
