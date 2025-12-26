import { useState, useEffect } from "react";
import { AbsoluteFill, continueRender, delayRender, Img, staticFile } from "remotion";

interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  description: string;
  date: string;
  filename: string;
}

interface WeatherBackgroundWithAIProps {
  city: string;
  onWeatherDataLoaded?: (data: WeatherData) => void;
}

export default function WeatherBackgroundWithAI({
  city,
  onWeatherDataLoaded,
}: WeatherBackgroundWithAIProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [handle] = useState(() => delayRender());

  useEffect(() => {
    let cancelled = false;

    async function loadImage() {
      try {
        // Try to load pre-generated image from manifest
        const manifestUrl = staticFile("weather-bg/manifest.json");
        const response = await fetch(manifestUrl);

        if (response.ok) {
          const manifest: Record<string, WeatherData> = await response.json();
          const key = city.toLowerCase().replace(/\s+/g, "-");
          const weatherData = manifest[key];

          if (weatherData) {
            const imageUrl = staticFile(`weather-bg/${weatherData.filename}`);
            console.log(`✅ Using pre-generated image: ${weatherData.filename}`);
            console.log(`🌤️ Weather data:`, weatherData);

            if (!cancelled) {
              setImageUrl(imageUrl);
              if (onWeatherDataLoaded) {
                onWeatherDataLoaded(weatherData);
              }
              continueRender(handle);
            }
            return;
          }
        }

        // Fallback: image not found
        console.warn(`⚠️ Pre-generated image not found for ${city}`);
        console.warn("Run 'npm run generate:weather' to generate images");

        if (!cancelled) {
          continueRender(handle);
        }
      } catch (error) {
        console.error("Failed to load pre-generated image:", error);
        if (!cancelled) {
          continueRender(handle);
        }
      }
    }

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [city, handle, onWeatherDataLoaded]);

  return (
    <AbsoluteFill>
      {imageUrl ? (
        <Img
          src={imageUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(180deg, hsl(210, 30%, 65%) 0%, hsl(210, 25%, 55%) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            color: "white",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}>
            Image Not Found
          </div>
          <div style={{ fontSize: "16px", opacity: 0.8 }}>
            Run: npm run generate:weather
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
