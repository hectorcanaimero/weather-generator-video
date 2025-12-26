import express from "express";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

router.post("/", async (req, res) => {
  const { city, weatherData } = req.body as { city: string; weatherData: WeatherData };

  if (!city || !weatherData) {
    return res.status(400).json({ error: "City and weather data are required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  try {
    console.log(`🎨 Generating AI image for ${city}...`);

    // Create weather description for the image prompt
    const weatherDesc = {
      sunny: "bright sunny day with clear blue sky",
      cloudy: "overcast sky with soft diffused light",
      rain: "gentle rainfall with wet reflective surfaces",
      storm: "dramatic storm with dark clouds and lightning",
    }[weatherData.condition] || "current weather conditions";

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
    const imagePart = candidate.content.parts.find((part: any) => part.inlineData);

    if (!imagePart || !imagePart.inlineData) {
      throw new Error("No image data in response");
    }

    const filename = `${city.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.png`;
    const outputDir = path.join(__dirname, "../../public/weather-bg");

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filepath = path.join(outputDir, filename);
    const imageData = imagePart.inlineData.data;
    const buffer = Buffer.from(imageData, "base64");
    fs.writeFileSync(filepath, buffer);

    console.log(`✅ Image generated: ${filename}`);

    // Update manifest
    const manifestPath = path.join(outputDir, "manifest.json");
    let manifest: Record<string, any> = {};

    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    }

    const key = city.toLowerCase().replace(/\s+/g, "-");
    manifest[key] = {
      ...weatherData,
      filename,
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`📝 Manifest updated`);

    return res.json({
      filename,
      imageUrl: `/weather-bg/${filename}`,
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
