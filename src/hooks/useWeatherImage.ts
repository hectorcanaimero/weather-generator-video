import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

interface UseWeatherImageOptions {
  city: string;
  condition: "rain" | "sunny" | "cloudy" | "storm";
  useAI?: boolean;
}

export function useWeatherImage({
  city,
  condition,
  useAI = false,
}: UseWeatherImageOptions) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [handle] = useState(() => delayRender());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadImage() {
      try {
        if (!useAI) {
          // Use a placeholder or pre-generated image
          const fallbackImage = staticFile(`weather/${condition}.jpg`);
          if (!cancelled) {
            setImageUrl(fallbackImage);
            continueRender(handle);
          }
          return;
        }

        // Generate image with AI
        const cacheKey = `weather-${city.toLowerCase()}-${condition}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          if (!cancelled) {
            setImageUrl(cached);
            continueRender(handle);
          }
          return;
        }

        const response = await fetch("/api/generate-weather-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ city, condition }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate image");
        }

        const data = await response.json();

        if (!cancelled) {
          setImageUrl(data.imageUrl);
          localStorage.setItem(cacheKey, data.imageUrl);
          continueRender(handle);
        }
      } catch (err) {
        console.error("Error loading weather image:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          // Use fallback
          const fallbackImage = staticFile(`weather/${condition}.jpg`);
          setImageUrl(fallbackImage);
          continueRender(handle);
        }
      }
    }

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [city, condition, useAI, handle]);

  return { imageUrl, error, loading: imageUrl === null };
}
