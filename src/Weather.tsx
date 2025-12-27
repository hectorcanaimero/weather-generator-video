import { useState } from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceMono";
import WeatherBackground from "./components/weather/WeatherBackground";
import WeatherBackgroundWithAI from "./components/weather/WeatherBackgroundWithAI";

const { fontFamily } = loadFont();

interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  description: string;
  date: string;
  filename: string;
}

interface WeatherProps {
  city?: string;
  temperature?: number;
  condition?: "rain" | "sunny" | "cloudy" | "storm";
  date?: string;
  useAI?: boolean;
  language?: string;
}

const weatherIcons: Record<string, string> = {
  rain: "🌧️",
  sunny: "☀️",
  cloudy: "☁️",
  storm: "⛈️",
};

// Condition translations
const conditionTranslations = {
  en: {
    rain: "Rainy",
    sunny: "Sunny",
    cloudy: "Cloudy",
    storm: "Stormy",
  },
  es: {
    rain: "Lluvioso",
    sunny: "Soleado",
    cloudy: "Nublado",
    storm: "Tormentoso",
  },
  pt: {
    rain: "Chuvoso",
    sunny: "Ensolarado",
    cloudy: "Nublado",
    storm: "Tempestuoso",
  },
};

export default function Weather({
  city = "CURITIBA",
  temperature: defaultTemperature = 31,
  condition: defaultCondition = "storm",
  date: defaultDate = "Friday, December 26, 2025",
  useAI = true,
  language = "en",
}: WeatherProps) {
  const frame = useCurrentFrame();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  // Use AI-loaded data if available, otherwise fall back to props
  const temperature = weatherData?.temperature ?? defaultTemperature;
  const condition = (weatherData?.condition ?? defaultCondition) as keyof typeof weatherIcons;
  const date = weatherData?.date ?? defaultDate;
  const rawCity = weatherData?.city ?? city;

  // Format city name: First letter uppercase, rest lowercase
  const displayCity = rawCity.charAt(0).toUpperCase() + rawCity.slice(1).toLowerCase();

  const cityOpacity = interpolate(frame, [0, 30], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cityTranslateY = interpolate(frame, [0, 40], [-50, 0], {
    easing: Easing.out(Easing.back(1.5)),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const iconScale = interpolate(frame, [20, 60], [0, 1], {
    easing: Easing.out(Easing.back(2)),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const iconOpacity = interpolate(frame, [20, 50], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dateOpacity = interpolate(frame, [40, 70], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dateTranslateY = interpolate(frame, [40, 80], [30, 0], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tempProgress = interpolate(frame, [60, 120], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const displayTemp = Math.round(temperature * tempProgress);

  const tempScale = interpolate(frame, [60, 100], [0.8, 1], {
    easing: Easing.out(Easing.back(1.5)),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tempOpacity = interpolate(frame, [60, 90], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {useAI ? (
        <WeatherBackgroundWithAI
          city={city}
          onWeatherDataLoaded={(data) => setWeatherData(data)}
        />
      ) : (
        <WeatherBackground />
      )}
      {/* TODO: Add music support later */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "start",
          padding: "60px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: "120px",
            fontWeight: "900",
            letterSpacing: "0.05em",
            color: "#2D3748",
            textShadow: "0 4px 20px rgba(0,0,0,0.2)",
            opacity: cityOpacity,
            transform: `translateY(${cityTranslateY}px)`,
          }}
        >
          {displayCity}
        </div>
        <div
          style={{
            fontSize: "42px",
            fontWeight: "500",
            color: "#2D3748",
            opacity: dateOpacity,
            transform: `translateY(${dateTranslateY}px)`,
            marginBottom: "40px",
            textShadow: "0 2px 10px rgba(0,0,0,0.15)",
          }}
        >
          {date}
        </div>

        {/* Weather icon + Temperature in same row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "30px",
            opacity: Math.min(iconOpacity, tempOpacity),
            transform: `scale(${Math.min(iconScale, tempScale)})`,
          }}
        >
          <div
            style={{
              fontSize: "140px",
              filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.3))",
            }}
          >
            {weatherIcons[condition] || "🌤️"}
          </div>
          <div
            style={{
              fontSize: "180px",
              fontWeight: "900",
              color: "#1A202C",
              textShadow: "0 6px 24px rgba(0,0,0,0.2)",
              letterSpacing: "-0.02em",
            }}
          >
            {displayTemp}°C
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
