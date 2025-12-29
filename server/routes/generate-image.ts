import express from "express";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRateLimiter } from "../middleware/rate-limit.js";
import {
  canGenerateImage,
  incrementGenerated,
  incrementReused,
  getLimitInfo,
} from "../config/generation-limit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Rate limiter: 20 image generations per day per IP (soft limit, just logging)
const imageGenerationLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 100, // High limit, we use global daily limit instead
  message: "Demasiadas solicitudes. Por favor, intenta más tarde.",
});

interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  description: string;
  date: string;
}

/**
 * Format date in the specified language
 */
function formatDateInLanguage(date: Date, language: string): string {
  const localeMap: Record<string, string> = {
    en: "en-US",
    es: "es-ES",
    pt: "pt-BR",
  };

  const locale = localeMap[language] || "en-US";

  return date.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Endpoint to check generation limit status
router.get("/status", (req, res) => {
  const limitInfo = getLimitInfo();
  return res.json({
    available: limitInfo.canGenerate,
    stats: {
      generated: limitInfo.used,
      reused: limitInfo.reused,
      remaining: limitInfo.remaining,
    },
  });
});

router.post("/", imageGenerationLimiter, async (req, res) => {
  const {
    city,
    weatherData,
    language = "en",
  } = req.body as { city: string; weatherData: WeatherData; language?: string };

  if (!city || !weatherData) {
    return res
      .status(400)
      .json({ error: "City and weather data are required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  try {
    // FIRST: Check if we already have an image for this city + condition
    const outputDir = path.join(__dirname, "../../public/weather-bg");
    const manifestPath = path.join(outputDir, "manifest.json");

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const cityKey = city.toLowerCase().replace(/\s+/g, "-");
    const condition = weatherData.condition.toLowerCase();
    const filename = `${cityKey}-${condition}.png`;
    const filepath = path.join(outputDir, filename);

    // Load existing manifest
    let manifest: Record<string, any> = {};
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    }

    // Check if image already exists
    if (fs.existsSync(filepath)) {
      console.log(`♻️ Reusing existing image: ${filename}`);
      console.log(`   (Same city + weather condition)`);

      // Increment reused counter
      incrementReused();

      // Format date in user's language
      const formattedDate = formatDateInLanguage(new Date(), language);

      // Update manifest with current weather data but keep existing filename
      manifest[cityKey] = {
        ...weatherData,
        date: formattedDate,
        filename,
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      return res.json({
        filename,
        imageUrl: `/weather-bg/${filename}`,
        reused: true,
        weatherData: {
          ...weatherData,
          date: formattedDate,
        },
      });
    }

    // Check global daily generation limit BEFORE calling Gemini
    if (!canGenerateImage()) {
      const limitInfo = getLimitInfo();
      console.warn(`⚠️ Daily generation limit reached: ${limitInfo.used}/${limitInfo.maxDaily}`);

      return res.status(503).json({
        error: "Servicio temporalmente no disponible",
        message: "Nuestro sistema está experimentando alta demanda en este momento. Por favor, intenta de nuevo más tarde o en unas horas.",
        retryAfter: "1-2 horas",
        canRetry: true,
      });
    }

    // Only call Gemini API if we need to generate a new image
    console.log(`🎨 Generating AI image for ${city} (${language})...`);

    // Weather descriptions in different languages
    const weatherDescriptions = {
      en: {
        sunny: "bright sunny day with clear blue sky",
        cloudy: "overcast sky with soft diffused light",
        rain: "gentle rainfall with wet reflective surfaces",
        storm: "dramatic storm with dark clouds and lightning",
      },
      es: {
        sunny: "día soleado brillante con cielo azul despejado",
        cloudy: "cielo nublado con luz difusa suave",
        rain: "lluvia suave con superficies reflectantes mojadas",
        storm: "tormenta dramática con nubes oscuras y relámpagos",
      },
      pt: {
        sunny: "dia ensolarado brilhante com céu azul claro",
        cloudy: "céu nublado com luz difusa suave",
        rain: "chuva suave com superfícies refletoras molhadas",
        storm: "tempestade dramática com nuvens escuras e relâmpagos",
      },
    };

    const langDescriptions =
      weatherDescriptions[language as keyof typeof weatherDescriptions] ||
      weatherDescriptions.en;
    const weatherDesc =
      langDescriptions[
        weatherData.condition as keyof typeof langDescriptions
      ] || "current weather conditions";

    const prompt = `Create a 45° top-down isometric miniature 3D diorama scene of ${city}, featuring its most iconic landmarks and architectural elements. Use soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadows. Show ${weatherDesc} integrated into the city environment to create an immersive atmospheric mood.

IMPORTANT:
- NO text, NO titles, NO labels, NO numbers on the image
- Focus on the most important points of interest in the city
- Just the pure isometric city scene with weather
- Vertical portrait orientation (9:16 aspect ratio)
- Leave top 40% relatively clear for text overlay (buildings can be there but not too tall)
- Focus detail in center and lower portions`;

    console.log(`📡 Calling Google Gemini API...`);
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: prompt,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: "9:16",
        },
      },
    });

    console.log(`✅ Received response from Gemini API`);

    // Extract image and save
    const candidate = response.candidates[0];
    const imagePart = candidate.content.parts.find(
      (part: any) => part.inlineData,
    );

    if (!imagePart || !imagePart.inlineData) {
      throw new Error("No image data in response");
    }

    // Save the new image
    const imageData = imagePart.inlineData.data;
    if (!imageData) {
      throw new Error("No image data in inline data");
    }
    const buffer = Buffer.from(imageData, "base64");
    fs.writeFileSync(filepath, buffer);

    console.log(`✅ Image generated: ${filename}`);

    // Increment generated counter
    incrementGenerated();

    // Format date in user's language
    const formattedDate = formatDateInLanguage(new Date(), language);

    // Update manifest
    manifest[cityKey] = {
      ...weatherData,
      date: formattedDate,
      filename,
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`📝 Manifest updated`);

    return res.json({
      filename,
      imageUrl: `/weather-bg/${filename}`,
      reused: false,
      weatherData: {
        ...weatherData,
        date: formattedDate,
      },
    });
  } catch (error) {
    console.error(`❌ Failed to generate image:`, error);
    return res.status(500).json({
      error: "Failed to generate image",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
