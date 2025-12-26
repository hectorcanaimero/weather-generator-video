#!/usr/bin/env node

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface WeatherConfig {
  city: string;
}

interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  description: string;
  date: string;
  filename: string;
}

interface OpenWeatherResponse {
  weather: Array<{
    main: string;
    description: string;
  }>;
  main: {
    temp: number;
  };
}

async function fetchWeatherData(city: string): Promise<Partial<WeatherData>> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === "your_openweather_api_key_here") {
    console.warn("⚠️ OPENWEATHER_API_KEY not set, using default weather data");
    return {};
  }

  try {
    console.log(`🌤️  Fetching weather data for ${city}...`);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`⚠️ Weather API error: ${response.status} ${response.statusText}`);
      return {};
    }

    const data: OpenWeatherResponse = await response.json();

    // Map OpenWeather conditions to our conditions
    const weatherMain = data.weather[0].main.toLowerCase();
    let condition = "sunny";
    if (weatherMain.includes("rain")) condition = "rain";
    else if (weatherMain.includes("cloud")) condition = "cloudy";
    else if (weatherMain.includes("thunder") || weatherMain.includes("storm")) condition = "storm";
    else if (weatherMain.includes("clear")) condition = "sunny";

    const weatherData = {
      temperature: Math.round(data.main.temp),
      condition,
      description: data.weather[0].description,
      date: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };

    console.log(`✅ Weather data fetched: ${weatherData.temperature}°C, ${weatherData.condition}`);
    return weatherData;
  } catch (error) {
    console.error(`❌ Failed to fetch weather data:`, error);
    return {};
  }
}

async function generateWeatherImage(
  config: WeatherConfig,
  outputDir: string
): Promise<WeatherData> {
  const { city } = config;

  // First, fetch real weather data from OpenWeatherMap
  const weatherData = await fetchWeatherData(city);

  // Create weather description for the image prompt
  const weatherDesc = weatherData.condition
    ? {
        sunny: "bright sunny day with clear blue sky",
        cloudy: "overcast sky with soft diffused light",
        rain: "gentle rainfall with wet reflective surfaces",
        storm: "dramatic storm with dark clouds and lightning",
      }[weatherData.condition]
    : "current weather conditions";

  const prompt = `Create a 45° top-down isometric miniature 3D diorama scene of ${city}, featuring its most iconic landmarks and architectural elements. Use soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadows. Show ${weatherDesc} integrated into the city environment to create an immersive atmospheric mood.

IMPORTANT:
- NO text, NO titles, NO labels, NO numbers on the image
- Just the pure isometric city scene with weather
- Vertical portrait orientation (9:16 aspect ratio)
- Leave top 40% relatively clear for text overlay (buildings can be there but not too tall)
- Focus detail in center and lower portions`;

  console.log(`\n🎨 Generating image for ${city}...`);
  console.log(`📝 Weather: ${weatherData.temperature || "?"}°C, ${weatherData.condition || "unknown"}`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    console.log("⏳ Generating with Gemini 3 Pro Image...");

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

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No image generated");
    }

    const candidate = response.candidates[0];

    if (!candidate.content || !candidate.content.parts) {
      throw new Error("Invalid response structure from Gemini API");
    }

    // Try to find image data in any part
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imagePart = candidate.content.parts.find((part: any) => part.inlineData);

    if (!imagePart || !imagePart.inlineData || !imagePart.inlineData.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw new Error("No image data in response. Response structure: " + JSON.stringify(candidate.content.parts.map((p: any) => Object.keys(p))));
    }

    console.log("✅ Image generated successfully!");

    // Generate filename
    const filename = `${city.toLowerCase().replace(/\s+/g, "-")}.png`;
    const filepath = path.join(outputDir, filename);

    console.log(`📥 Saving to ${filepath}...`);

    const imageData = imagePart.inlineData.data;
    const buffer = Buffer.from(imageData, "base64");
    fs.writeFileSync(filepath, buffer);

    console.log(`✅ Saved successfully!`);

    return {
      city,
      temperature: weatherData.temperature || 20,
      condition: weatherData.condition || "sunny",
      description: weatherData.description || "Pleasant weather",
      date:
        weatherData.date ||
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      filename,
    };
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

async function main() {
  const configPath = path.join(__dirname, "..", "weather-config.json");
  let weatherConfigs: WeatherConfig[] = [];

  if (fs.existsSync(configPath)) {
    const configData = fs.readFileSync(configPath, "utf-8");
    weatherConfigs = JSON.parse(configData);
    console.log(`📋 Loaded ${weatherConfigs.length} configurations from weather-config.json`);
  }

  const outputDir = path.join(__dirname, "..", "public", "weather-bg");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`\n🚀 Starting image generation for ${weatherConfigs.length} configurations...\n`);

  const results: Record<string, WeatherData> = {};

  for (const config of weatherConfigs) {
    try {
      const weatherData = await generateWeatherImage(config, outputDir);

      // Generate manifest key: use city name
      const key = config.city.toLowerCase().replace(/\s+/g, "-");

      results[key] = weatherData;

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`\n❌ Failed to generate image for ${config.city}:`, error);
    }
  }

  const manifestPath = path.join(outputDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));
  console.log(`\n📦 Saved manifest to ${manifestPath}`);

  console.log("\n✨ All done!");
  console.log(`\n📊 Generated ${Object.keys(results).length} images:`);
  Object.entries(results).forEach(([key, data]) => {
    console.log(`  - ${key}: ${data.filename} (${data.temperature}°C, ${data.condition})`);
  });
}

main().catch((error) => {
  console.error("\n❌ Error:", error);
  process.exit(1);
});
