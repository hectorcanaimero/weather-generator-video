import express from "express";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { uploadVideo } from "../config/minio.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  description: string;
  date: string;
}

interface RenderRequest {
  city: string;
  weatherData: WeatherData;
  imageFilename: string;
  language?: string;
}

router.post("/", async (req, res) => {
  const {
    city,
    weatherData,
    imageFilename,
    language = "en",
  } = req.body as RenderRequest;

  if (!city || !weatherData || !imageFilename) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    console.log(`🎬 Starting video render for ${city} (${language})...`);

    // Paths
    const projectRoot = path.join(__dirname, "../..");
    const entryPoint = path.join(projectRoot, "src/index.ts");
    const outputDir = path.join(projectRoot, "out");
    const outputFilename = `weather-${city.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`📦 Bundling Remotion project...`);
    const bundled = await bundle({
      entryPoint,
      webpackOverride: (config) => config,
    });

    console.log(`🔍 Selecting composition...`);
    const composition = await selectComposition({
      serveUrl: bundled,
      id: "Weather",
      inputProps: {
        city: weatherData.city,
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        date: weatherData.date,
        useAI: true,
        language,
      },
      chromiumOptions: {
        // @ts-ignore - Remotion types don't include all Puppeteer options
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--single-process",
        ],
      },
    });

    console.log(`🎥 Rendering video...`);
    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: "h264",
      outputLocation: outputPath,
      inputProps: {
        city: weatherData.city,
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        date: weatherData.date,
        useAI: true,
        language,
      },
      chromiumOptions: {
        // @ts-ignore - Remotion types don't include all Puppeteer options
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      },
    });

    console.log(`✅ Video rendered successfully: ${outputFilename}`);

    // Upload to MinIO
    console.log(`📤 Uploading video to MinIO...`);
    const uploadResult = await uploadVideo(outputPath, outputFilename, {
      city: weatherData.city,
      temperature: weatherData.temperature,
      condition: weatherData.condition,
      date: weatherData.date,
    });

    console.log(`✅ Video uploaded to MinIO: ${uploadResult.url}`);

    // Optionally delete local file after upload to save space
    try {
      fs.unlinkSync(outputPath);
      console.log(`🗑️ Local file deleted: ${outputFilename}`);
    } catch (err) {
      console.warn(`⚠️ Could not delete local file: ${err}`);
    }

    return res.json({
      videoUrl: uploadResult.url,
      filename: outputFilename,
      etag: uploadResult.etag,
    });
  } catch (error) {
    console.error(`❌ Failed to render video:`, error);
    return res.status(500).json({
      error: "Failed to render video",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
