interface WeatherImageOptions {
  city: string;
  condition: "rain" | "sunny" | "cloudy" | "storm";
}

const WEATHER_PROMPTS = {
  storm: "dark stormy clouds with lightning bolts, heavy rain atmosphere, dramatic weather",
  rain: "rainy weather with gentle rain drops falling, overcast sky, wet surfaces",
  sunny: "bright sunny day with clear blue sky, warm golden lighting, pleasant weather",
  cloudy: "cloudy overcast weather, soft diffused lighting, calm atmosphere",
};

export async function generateWeatherImage({
  city,
  condition,
}: WeatherImageOptions): Promise<string> {
  const weatherDescription = WEATHER_PROMPTS[condition];

  const prompt = `Present a clear, 45° top-down isometric miniature 3D cartoon scene of ${city}, featuring its most iconic landmarks and architectural elements. Use soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadows. Integrate ${weatherDescription} directly into the city environment to create an immersive atmospheric mood.

Use a clean, minimalistic composition with a soft, solid-colored background gradient.

Square 1080x1920 dimension, vertical composition. Photorealistic 3D isometric render style, highly detailed miniature city diorama scene, studio lighting, octane render quality.`;

  try {
    // Check cache first
    const cacheKey = `weather-${city.toLowerCase().replace(/\s+/g, "-")}-${condition}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      console.log("Using cached image for", city, condition);
      return cached;
    }

    console.log("Generating new image for", city, condition);

    // Use fal.ai API directly
    const response = await fetch("https://fal.run/fal-ai/flux/dev", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.FAL_KEY || ""}`,
      },
      body: JSON.stringify({
        prompt,
        image_size: {
          width: 1080,
          height: 1920,
        },
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.images && result.images[0] && result.images[0].url) {
      const imageUrl = result.images[0].url;
      // Cache the result
      localStorage.setItem(cacheKey, imageUrl);
      return imageUrl;
    }

    throw new Error("No image in response");
  } catch (error) {
    console.error("Error generating weather image:", error);
    throw error;
  }
}

// Helper to preload image as blob URL for Remotion
export async function loadImageAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
