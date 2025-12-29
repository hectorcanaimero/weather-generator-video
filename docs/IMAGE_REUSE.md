# Sistema de Reutilización de Imágenes

## Descripción General

El sistema de generación de imágenes ahora reutiliza imágenes basándose en la **combinación de ciudad + condición climática** en lugar de generar una nueva imagen cada vez.

## Formato de Nombres

### Antes (con timestamp):
```
curitiba-1766795259863.png
paris-1767024898494.png
```

### Ahora (ciudad + condición):
```
curitiba-rain.png
curitiba-sunny.png
paris-sunny.png
rondonópolis-cloudy.png
```

## Condiciones Climáticas Soportadas

El sistema mapea las condiciones de OpenWeather API a 4 categorías principales:

- `sunny` - Cielo despejado, soleado
- `cloudy` - Nublado, nubes dispersas
- `rain` - Lluvia
- `storm` - Tormenta, rayos

## ¿Cómo Funciona?

### 1. Solicitud de Generación de Imagen

Cuando se solicita una imagen para una ciudad:

```bash
POST /api/generate-image
{
  "city": "Curitiba",
  "weatherData": {
    "temperature": 25,
    "condition": "rain",
    "description": "light rain"
  }
}
```

### 2. Verificación de Imagen Existente

El sistema:
1. Obtiene la condición climática actual de OpenWeather API
2. Genera el nombre del archivo: `{ciudad}-{condición}.png`
3. Verifica si ya existe una imagen con ese nombre
4. **Si existe**: Reutiliza la imagen existente (respuesta con `reused: true`)
5. **Si NO existe**: Genera nueva imagen con Gemini AI

### 3. Respuesta

```json
{
  "filename": "curitiba-rain.png",
  "imageUrl": "/weather-bg/curitiba-rain.png",
  "reused": true  // ← Indica que se reutilizó
}
```

## Beneficios

### 1. **Ahorro de Costos**
- No se llama a Gemini API si la imagen ya existe
- Límite de 20 generaciones por día por IP

### 2. **Velocidad**
- Respuesta instantánea cuando se reutiliza imagen
- Sin espera de generación de IA

### 3. **Consistencia**
- La misma ciudad con la misma condición climática muestra la misma imagen
- Mejor experiencia de usuario

### 4. **Control de Recursos**
- Máximo de `N ciudades × 4 condiciones` imágenes
- Ejemplo: 50 ciudades × 4 condiciones = 200 imágenes máximo

## Scripts Disponibles

### Generar Imágenes en Batch
```bash
npm run generate:weather
```
Lee `weather-config.json` y genera imágenes para todas las ciudades listadas.

### Migrar Imágenes Antiguas
```bash
npm run migrate:images
```
Convierte imágenes con formato antiguo (`city-timestamp.png`) al nuevo formato (`city-condition.png`).

### Test de Generación
```bash
npm run test:upload
```

## Estructura del Manifest

El archivo `public/weather-bg/manifest.json` contiene metadatos de todas las imágenes:

```json
{
  "curitiba": {
    "city": "Curitiba",
    "temperature": 18,
    "condition": "rain",
    "description": "light rain",
    "date": "Sunday, December 29, 2025",
    "filename": "curitiba-rain.png"
  },
  "paris": {
    "city": "Paris",
    "temperature": 0,
    "condition": "sunny",
    "description": "clear sky",
    "date": "Friday, December 26, 2025",
    "filename": "paris-sunny.png"
  }
}
```

## Casos de Uso

### Caso 1: Primera Vez - Ciudad Nueva

**Request**: Video para Curitiba con lluvia
- ✅ Genera nueva imagen: `curitiba-rain.png`
- ⏱️ Tiempo: ~10-15 segundos
- 💰 Costo: 1 llamada a Gemini API

### Caso 2: Reutilización - Misma Condición

**Request**: Video para Curitiba con lluvia (otra vez)
- ♻️ Reutiliza imagen existente: `curitiba-rain.png`
- ⏱️ Tiempo: < 1 segundo
- 💰 Costo: $0

### Caso 3: Nueva Condición - Ciudad Existente

**Request**: Video para Curitiba pero ahora está soleado
- ✅ Genera nueva imagen: `curitiba-sunny.png`
- ⏱️ Tiempo: ~10-15 segundos
- 💰 Costo: 1 llamada a Gemini API
- 📦 Ahora tenemos: `curitiba-rain.png` + `curitiba-sunny.png`

## Configuración

### Variables de Entorno Requeridas

```env
# API Keys
GEMINI_API_KEY=your_gemini_api_key
OPENWEATHER_API_KEY=your_openweather_key
```

### Rate Limiting

Configurado en `server/routes/generate-image.ts`:
- **20 generaciones por día** por IP
- Se resetea cada 24 horas

## Archivos Relacionados

| Archivo | Función |
|---------|---------|
| `server/routes/generate-image.ts` | API endpoint para generar/reutilizar imágenes |
| `scripts/generate-weather-images.ts` | Script batch para generar imágenes |
| `scripts/migrate-image-naming.ts` | Migración de formato antiguo a nuevo |
| `src/components/weather/WeatherBackgroundWithAI.tsx` | Componente React que usa las imágenes |
| `public/weather-bg/manifest.json` | Índice de todas las imágenes generadas |

## Mantenimiento

### Limpiar Imágenes Antiguas

Eliminar imágenes con formato antiguo (timestamp):
```bash
find public/weather-bg -name "*-[0-9]*.png" -type f -delete
```

### Ver Estado Actual

```bash
# Contar imágenes por condición
ls public/weather-bg/*.png | sed 's/.*-\(.*\)\.png/\1/' | sort | uniq -c

# Ejemplo de salida:
#   3 sunny
#   12 cloudy
#   2 rain
#   1 storm
```

### Regenerar Imagen Específica

Si quieres regenerar una imagen (por ejemplo, mejor calidad):
```bash
# 1. Eliminar la imagen existente
rm public/weather-bg/curitiba-rain.png

# 2. Solicitar nuevo video (o usar API directamente)
# El sistema detectará que no existe y generará una nueva
```

## Limitaciones

1. **Solo 4 condiciones climáticas**: No captura todas las variaciones de clima
2. **Condiciones cambiantes**: Una ciudad puede tener diferentes condiciones a lo largo del día
3. **Variaciones estacionales**: No considera estaciones del año (verano/invierno)

## Mejoras Futuras Posibles

- [ ] Agregar más condiciones climáticas (nieve, niebla, etc.)
- [ ] Soporte para variaciones estacionales
- [ ] Caché por hora del día (mañana/tarde/noche)
- [ ] Dashboard para ver todas las imágenes generadas
- [ ] Compresión automática de imágenes PNG
