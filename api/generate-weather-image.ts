import * as fal from "@fal-ai/serverless-client";

interface WeatherImageRequest {
  city: string;
  condition: "rain" | "sunny" | "cloudy" | "storm";
}

const WEATHER_PROMPTS = {
  storm: "dark stormy clouds with lightning, heavy rain atmosphere",
  rain: "rainy weather with gentle rain drops, overcast sky",
  sunny: "bright sunny day with clear blue sky, warm lighting",
  cloudy: "cloudy overcast weather, soft diffused lighting",
};

export async function generateWeatherImage(
  city: string,
  condition: "rain" | "sunny" | "cloudy" | "storm"
): Promise<string> {
  const weatherDescription = WEATHER_PROMPTS[condition];

  const prompt = `Present a clear, 45° top-down isometric miniature 3D cartoon scene of ${city}, featuring its most iconic landmarks and architectural elements. Use soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadows. Integrate ${weatherDescription} directly into the city environment to create an immersive atmospheric mood.

Use a clean, minimalistic composition with a soft, solid-colored background.

Square 1080x1920 dimension, vertical composition. Photorealistic 3D render style, highly detailed miniature city scene.`;

  try {
    fal.config({
      credentials: process.env.FAL_KEY,
    });

    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt,
        image_size: {
          width: 1080,
          height: 1920,
        },
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Generating image:", update.logs);
        }
      },
    });

    if (result.data && result.data.images && result.data.images[0]) {
      return result.data.images[0].url;
    }

    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { city, condition }: WeatherImageRequest = req.body;

  if (!city || !condition) {
    return res.status(400).json({ error: "Missing city or condition" });
  }

  try {
    const imageUrl = await generateWeatherImage(city, condition);
    return res.status(200).json({ imageUrl });
  } catch (error) {
    console.error("Failed to generate image:", error);
    return res.status(500).json({ error: "Failed to generate image" });
  }
}
