import express from "express";

const router = express.Router();

interface OpenWeatherResponse {
  weather: Array<{
    main: string;
    description: string;
  }>;
  main: {
    temp: number;
  };
}

router.post("/", async (req, res) => {
  const { city } = req.body;

  if (!city) {
    return res.status(400).json({ error: "City is required" });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === "your_openweather_api_key_here") {
    return res.status(500).json({ error: "OpenWeather API key not configured" });
  }

  try {
    console.log(`🌤️  Fetching weather data for ${city}...`);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}&units=metric&appid=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      console.warn(`⚠️ Weather API error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: "Failed to fetch weather data" });
    }

    const data: OpenWeatherResponse = await response.json();

    // Map OpenWeather conditions to our conditions
    const weatherMain = data.weather[0].main.toLowerCase();
    let condition = "sunny";
    if (weatherMain.includes("rain")) condition = "rain";
    else if (weatherMain.includes("cloud")) condition = "cloudy";
    else if (weatherMain.includes("thunder") || weatherMain.includes("storm"))
      condition = "storm";
    else if (weatherMain.includes("clear")) condition = "sunny";

    const weatherData = {
      city,
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
    return res.json(weatherData);
  } catch (error) {
    console.error(`❌ Failed to fetch weather data:`, error);

    // Return mock data if API fails (for development/testing)
    const mockWeatherData = {
      city,
      temperature: 25,
      condition: "sunny",
      description: "clear sky (mock data - API unavailable)",
      date: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };

    console.log(`⚠️ Using mock weather data due to API error`);
    return res.json(mockWeatherData);
  }
});

export default router;
