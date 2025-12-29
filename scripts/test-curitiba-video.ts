#!/usr/bin/env tsx
/**
 * Test video generation for Curitiba with specific image
 */

async function testCuritibaVideo() {
  console.log("🧪 Testing Curitiba Video Generation\n");

  const city = "Curitiba";
  const weatherData = {
    city: "Curitiba",
    temperature: 18,
    condition: "cloudy",
    description: "scattered clouds",
    date: "domingo, 29 de dezembro de 2025",
  };
  const imageFilename = "curitiba-cloudy.png";
  const language = "pt";

  console.log("📋 Request Data:");
  console.log(JSON.stringify({ city, weatherData, imageFilename, language }, null, 2));
  console.log();

  try {
    // Send request to render API
    const response = await fetch("http://localhost:3001/api/render-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        city,
        weatherData,
        imageFilename,
        language,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Request failed:");
      console.error(JSON.stringify(error, null, 2));
      process.exit(1);
    }

    const result = await response.json();
    console.log("✅ Job Queued:");
    console.log(JSON.stringify(result, null, 2));
    console.log();
    console.log("💡 Check the server logs to see if the image is being used correctly");
    console.log("💡 The video should use: public/weather-bg/curitiba-cloudy.png");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testCuritibaVideo();
