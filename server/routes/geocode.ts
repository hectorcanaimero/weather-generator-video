import express from "express";

const router = express.Router();

interface GeocodingResult {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

router.get("/", async (req, res) => {
  const query = req.query.q as string;

  if (!query || query.length < 2) {
    return res.status(400).json({ error: "Query must be at least 2 characters" });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OpenWeather API key not configured" });
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch geocoding data");
    }

    const data: GeocodingResult[] = await response.json();

    // Format the response to include only what we need
    const formattedCities = data.map((city) => ({
      name: city.name,
      country: city.country,
      state: city.state,
      lat: city.lat,
      lon: city.lon,
    }));

    return res.json(formattedCities);
  } catch (error) {
    console.error("Error fetching geocoding data:", error);
    return res.status(500).json({
      error: "Failed to fetch city suggestions",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
