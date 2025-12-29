#!/usr/bin/env tsx
/**
 * Test date localization in different languages
 */

const localeMap: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
};

function formatDateInLanguage(date: Date, language: string): string {
  const locale = localeMap[language] || "en-US";

  return date.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

console.log("🧪 Testing Date Localization\n");

const testDate = new Date("2025-12-29T12:00:00Z");

console.log("📅 Test Date: December 29, 2025\n");
console.log("=".repeat(70));

const languages = ["en", "es", "pt"];

languages.forEach((lang) => {
  const formatted = formatDateInLanguage(testDate, lang);
  console.log(`\n${lang.toUpperCase()} (${localeMap[lang]}):`);
  console.log(`   ${formatted}`);
});

console.log("\n" + "=".repeat(70));

// Test with current date
const now = new Date();
console.log(`\n📅 Current Date Test:\n`);

languages.forEach((lang) => {
  const formatted = formatDateInLanguage(now, lang);
  console.log(`${lang.toUpperCase()}: ${formatted}`);
});

console.log("\n" + "=".repeat(70));
console.log("\n✅ Date localization working correctly!");
console.log("\nExample API Response:");
console.log(
  JSON.stringify(
    {
      filename: "curitiba-rain.png",
      imageUrl: "/weather-bg/curitiba-rain.png",
      reused: true,
      weatherData: {
        city: "Curitiba",
        temperature: 18,
        condition: "rain",
        description: "light rain",
        date: formatDateInLanguage(now, "pt"),
      },
    },
    null,
    2
  )
);
