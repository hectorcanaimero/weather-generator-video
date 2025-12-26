# Weather Video con Generación de Imágenes por IA ⚡

Este proyecto incluye generación de fondos de video del clima usando **Google Gemini Imagen 3** ("nano banana").

## 🎨 Características

- **Fondo 3D Generado por IA**: Escenas isométricas únicas generadas con Gemini Imagen 3
- **Condiciones Climáticas**: Tormenta, lluvia, soleado, nublado
- **Pre-generación de Imágenes**: Genera las imágenes ANTES de renderizar el video
- **Sistema de Manifest**: Mapeo automático de ciudad/condición a imagen
- **Gemini Imagen 3**: Modelo de última generación de Google

## 🚀 Configuración Rápida

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar API Key de Google Gemini

1. Visita [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Crea una API key
3. Crea un archivo `.env` en la raíz:

```bash
GEMINI_API_KEY=tu_api_key_de_gemini
```

### 3. Configurar Ciudades y Condiciones

Edita `weather-config.json`:

```json
[
  {
    "city": "CURITIBA",
    "condition": "storm"
  },
  {
    "city": "Tokyo",
    "condition": "sunny"
  }
]
```

### 4. Pre-generar Imágenes del Clima

**⚠️ PASO CRUCIAL**: Genera las imágenes ANTES de renderizar:

```bash
npm run generate:weather
```

Este comando:
- ✅ Lee `weather-config.json`
- ✅ Genera imágenes con Gemini Imagen 3
- ✅ Guarda en `public/weather-bg/`
- ✅ Crea `manifest.json`

**Ejemplo de salida:**
```
📋 Loaded 2 configurations from weather-config.json
🚀 Starting image generation...

🎨 Generating image for CURITIBA (storm)...
⏳ Generating with Gemini Imagen 3...
✅ Image generated successfully!
📥 Saving to public/weather-bg/curitiba-storm.jpg...
✅ Saved successfully!

📦 Saved manifest to public/weather-bg/manifest.json
✨ All done!
📊 Generated 2 images:
  - curitiba-storm: curitiba-storm.jpg
  - tokyo-sunny: tokyo-sunny.jpg
```

## 📝 Uso en el Video

### Activar Generación por IA

En `src/Root.tsx`:

```tsx
<Composition
  id="Weather"
  component={Weather}
  durationInFrames={60 * 10}
  fps={60}
  width={1080}
  height={1920}
  defaultProps={{
    city: "CURITIBA",
    temperature: 31,
    condition: "storm" as const,
    date: "Friday, December 26, 2025",
    useAI: true, // 👈 Usa imágenes generadas con Gemini
  }}
/>
```

### Usar Fondo CSS (sin IA)

```tsx
defaultProps={{
  useAI: false, // 👈 Usa fondo CSS animado
}}
```

## 🎬 Renderizar el Video

### Preview

```bash
npm run dev
```

### Render Final

```bash
npx remotion render Weather output.mp4
```

## 💰 Costos

**Gemini Imagen 3** es **GRATIS** para uso personal/desarrollo:
- ✅ Tier gratuito generoso
- ✅ Sin tarjeta de crédito requerida
- ✅ Límite: 15 imágenes por minuto

Más info: https://ai.google.dev/pricing

## 🔧 Personalización Avanzada

### Ajustar Prompts

Edita `scripts/generate-weather-images.ts`:

```typescript
const WEATHER_PROMPTS = {
  storm: "dark stormy clouds with lightning, dramatic atmosphere",
  rain: "gentle rain with overcast sky",
  sunny: "bright sunny day with clear blue sky",
  cloudy: "soft cloudy weather with diffused light",
};
```

### Parámetros de Generación

```typescript
generationConfig: {
  temperature: 1,      // Creatividad (0-2)
  topK: 40,
  topP: 0.95,
  responseMimeType: "image/jpeg",
}
```

## 📂 Estructura de Archivos

```
├── .env                             # Tu API key (git-ignored)
├── .env.example                     # Ejemplo de configuración
├── weather-config.json              # Ciudades a generar
├── scripts/
│   └── generate-weather-images.ts   # Script de generación
├── public/
│   └── weather-bg/                  # Imágenes generadas
│       ├── curitiba-storm.jpg
│       └── manifest.json
└── src/
    └── components/weather/
        └── WeatherBackgroundWithAI.tsx
```

## 🐛 Troubleshooting

### "GEMINI_API_KEY not set"

**Solución**: Crea el archivo `.env`:
```bash
echo "GEMINI_API_KEY=tu_key" > .env
```

### "Image Not Found" en el player

**Solución**: Ejecuta primero:
```bash
npm run generate:weather
```

### Rate limit exceeded

Gemini Imagen tiene un límite de 15 imágenes/minuto. El script espera 2 segundos entre cada generación para evitar esto.

### Error al generar imagen

Verifica que tu API key sea válida:
```bash
curl -H "x-goog-api-key: $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1/models/imagen-3.0-generate-001
```

## 🎯 Ejemplos de Configuraciones

### Múltiples ciudades

```json
[
  { "city": "CURITIBA", "condition": "storm" },
  { "city": "CURITIBA", "condition": "sunny" },
  { "city": "Tokyo", "condition": "sunny" },
  { "city": "Paris", "condition": "rain" },
  { "city": "New York", "condition": "cloudy" }
]
```

### Solo una imagen

```json
[
  { "city": "CURITIBA", "condition": "storm" }
]
```

## 🚀 Workflow Recomendado

1. **Configurar** `weather-config.json`
2. **Generar**: `npm run generate:weather`
3. **Verificar** `public/weather-bg/`
4. **Activar** `useAI: true` en Root.tsx
5. **Renderizar**: `npm run dev`

## ✨ Ventajas de Gemini Imagen 3

✅ **Gratis** para desarrollo
✅ **Alta calidad** de imágenes
✅ **Rápido** (~5-10 segundos por imagen)
✅ **No requiere tarjeta** de crédito
✅ **API simple** de Google

## 📚 Referencias

- [Gemini API Docs](https://ai.google.dev/docs)
- [Imagen 3 Model](https://ai.google.dev/models/imagen)
- [Pricing](https://ai.google.dev/pricing)
- [API Key](https://aistudio.google.com/app/apikey)
