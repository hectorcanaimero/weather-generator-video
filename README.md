# Creem Year Recap 🎬

Video programático de "Year in Review" creado con [Remotion](https://remotion.dev).

## 🎥 Composiciones

### 1. HelloWorld (Year Recap)
Video animado mostrando estadísticas del año:
- Revenue, Customers, Countries, etc.
- Duración: 43 segundos
- Resolución: 1920x1080

### 2. Weather (Clima con IA)
Video del clima con fondo generado por IA:
- Escenas isométricas 3D de ciudades
- Condiciones climáticas animadas
- Duración: 10 segundos
- Resolución: 1080x1920 (vertical)

## 🚀 Quick Start

### Instalación

```bash
npm install
```

### Development

```bash
npm run dev
```

Abre http://localhost:3000 para ver el preview.

### Renderizar Video

```bash
# Renderizar composición específica
npx remotion render HelloWorld output.mp4
npx remotion render Weather weather.mp4
```

## 🎨 Weather con IA

Para usar la generación de imágenes con IA:

1. **Configurar API Key**:
   ```bash
   cp .env.example .env
   # Edita .env y añade tu FAL_KEY
   ```

2. **Generar imágenes**:
   ```bash
   npm run generate:weather
   ```

3. **Activar en Root.tsx**: `useAI: true`

Más información en WEATHER_AI.md

## 📝 Comandos Disponibles

```bash
npm run dev              # Inicia el preview de Remotion
npm run build            # Empaqueta el proyecto
npm run lint             # Ejecuta ESLint y TypeScript
npm run upgrade          # Actualiza Remotion
npm run generate:weather # Genera imágenes del clima con IA
```

## 🛠️ Tech Stack

- **Remotion** 4.0 - Framework de video programático
- **React** 19 - UI Components
- **TypeScript** 5.8 - Type safety
- **Tailwind CSS** 4.0 - Styling
- **Lottie** - Animaciones
- **fal.ai** - Generación de imágenes con IA (opcional)

## 📂 Estructura del Proyecto

```
├── src/
│   ├── Root.tsx              # Registro de composiciones
│   ├── Creem.tsx             # Composición Year Recap
│   ├── Weather.tsx           # Composición Weather
│   └── components/
│       ├── creem/            # Componentes Year Recap
│       └── weather/          # Componentes Weather
├── public/
│   ├── lottie/               # Animaciones Lottie
│   └── weather-bg/           # Imágenes generadas (gitignored)
├── scripts/
│   └── generate-weather-images.ts  # Script de generación IA
└── weather-config.json       # Configuración de ciudades
```

## 📖 Documentación

- Remotion Docs: https://remotion.dev/docs
- Weather AI Setup: WEATHER_AI.md
- Development Guide: CLAUDE.md

---

Generado con ❤️ usando Remotion
