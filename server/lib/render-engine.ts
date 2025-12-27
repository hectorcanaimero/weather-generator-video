import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { uploadVideo } from "../config/minio.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface RenderOptions {
  city: string;
  weatherData: {
    city: string;
    temperature: number;
    condition: string;
    description: string;
    date: string;
  };
  imageFilename: string;
  language: string;
}

export interface RenderResult {
  videoUrl: string;
  filename: string;
  etag: string;
}

/**
 * Main rendering function extracted from render-video.ts
 * This is the core logic that will be called by the worker
 */
export async function renderVideoFile(
  options: RenderOptions,
  onProgress?: (stage: string, progress: number) => void
): Promise<RenderResult> {
  const { city, weatherData, imageFilename, language } = options;

  try {
    console.log(`🎬 Starting video render for ${city} (${language})...`);
    onProgress?.("bundling", 0);

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

    // Step 1: Bundle
    console.log(`📦 Bundling Remotion project...`);
    onProgress?.("bundling", 10);
    const bundled = await bundle({
      entryPoint,
      webpackOverride: (config) => config,
    });
    onProgress?.("bundling", 30);

    // Step 2: Select composition
    console.log(`🔍 Selecting composition...`);
    onProgress?.("composition", 35);
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
    onProgress?.("composition", 40);

    // Step 3: Render video
    console.log(`🎥 Rendering video...`);
    onProgress?.("rendering", 45);
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
        // @ts-ignore
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      },
      onProgress: ({ progress }) => {
        // Map rendering progress from 45% to 85%
        const mappedProgress = 45 + progress * 40;
        onProgress?.("rendering", mappedProgress);
      },
    });
    console.log(`✅ Video rendered successfully: ${outputFilename}`);
    onProgress?.("uploading", 85);

    // Step 4: Upload to MinIO
    console.log(`📤 Uploading video to MinIO...`);
    const uploadResult = await uploadVideo(outputPath, outputFilename, {
      city: weatherData.city,
      temperature: weatherData.temperature,
      condition: weatherData.condition,
      date: weatherData.date,
    });
    console.log(`✅ Video uploaded to MinIO: ${uploadResult.url}`);
    onProgress?.("uploading", 95);

    // Step 5: Cleanup local file
    try {
      fs.unlinkSync(outputPath);
      console.log(`🗑️ Local file deleted: ${outputFilename}`);
    } catch (err) {
      console.warn(`⚠️ Could not delete local file: ${err}`);
    }
    onProgress?.("completed", 100);

    return {
      videoUrl: uploadResult.url,
      filename: outputFilename,
      etag: uploadResult.etag,
    };
  } catch (error) {
    console.error(`❌ Failed to render video:`, error);
    throw error;
  }
}
