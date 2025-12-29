# Sistema de Límite de Generación de Imágenes

## Descripción General

El sistema limita la generación de nuevas imágenes a **20 por día** para controlar costos de la API de Gemini AI. Cuando se alcanza el límite, se muestra un mensaje genérico sobre alta demanda del sistema (sin mencionar limitaciones de IA).

## Características

### ✅ Lo que cuenta para el límite
- **Solo generaciones nuevas** con Gemini AI

### ♻️ Lo que NO cuenta para el límite
- Reutilización de imágenes existentes
- Consultas al estado del límite
- Operaciones de lectura del manifest

## Límites Configurados

| Tipo | Límite | Reseteo | Mensaje |
|------|--------|---------|---------|
| Generaciones diarias | 20 | Medianoche | "Sistema con alta demanda" |
| Rate limit por IP | 100 | 24 horas | "Demasiadas solicitudes" |

## Funcionamiento

### Flujo Normal (Dentro del Límite)

```
1. Usuario solicita imagen para "Curitiba + lluvia"
2. Sistema verifica: ¿Ya existe? → NO
3. Sistema verifica: ¿Límite alcanzado? → NO (18/20 usado)
4. ✅ Genera imagen nueva con Gemini
5. Incrementa contador: 19/20
6. Retorna imagen generada
```

### Flujo con Reutilización (No cuenta para límite)

```
1. Usuario solicita imagen para "Paris + soleado"
2. Sistema verifica: ¿Ya existe? → SÍ
3. ♻️ Reutiliza imagen existente
4. Incrementa contador de reutilización
5. Contador de generación NO cambia
6. Retorna imagen existente (reused: true)
```

### Flujo cuando se Alcanza el Límite

```
1. Usuario solicita imagen para ciudad nueva
2. Sistema verifica: ¿Ya existe? → NO
3. Sistema verifica: ¿Límite alcanzado? → SÍ (20/20)
4. ❌ Retorna error 503
5. Mensaje: "Sistema experimentando alta demanda"
6. Usuario puede reintentar en 1-2 horas
```

## Respuestas de la API

### Generación Exitosa

```json
{
  "filename": "curitiba-rain.png",
  "imageUrl": "/weather-bg/curitiba-rain.png",
  "reused": false
}
```

### Reutilización Exitosa

```json
{
  "filename": "paris-sunny.png",
  "imageUrl": "/weather-bg/paris-sunny.png",
  "reused": true
}
```

### Límite Alcanzado (503 Service Unavailable)

```json
{
  "error": "Servicio temporalmente no disponible",
  "message": "Nuestro sistema está experimentando alta demanda en este momento. Por favor, intenta de nuevo más tarde o en unas horas.",
  "retryAfter": "1-2 horas",
  "canRetry": true
}
```

## Endpoints

### POST /api/generate-image

Genera o reutiliza una imagen para una ciudad.

**Request:**
```json
{
  "city": "Curitiba",
  "weatherData": {
    "temperature": 18,
    "condition": "rain",
    "description": "light rain"
  },
  "language": "es"
}
```

**Response 200 (Éxito):**
```json
{
  "filename": "curitiba-rain.png",
  "imageUrl": "/weather-bg/curitiba-rain.png",
  "reused": false
}
```

**Response 503 (Límite alcanzado):**
```json
{
  "error": "Servicio temporalmente no disponible",
  "message": "Nuestro sistema está experimentando alta demanda...",
  "retryAfter": "1-2 horas",
  "canRetry": true
}
```

### GET /api/generate-image/status

Consulta el estado actual del límite de generación.

**Response:**
```json
{
  "available": true,
  "stats": {
    "generated": 15,
    "reused": 42,
    "remaining": 5
  }
}
```

## Archivo de Estadísticas

Las estadísticas se guardan en:
```
data/generation-stats.json
```

**Estructura:**
```json
{
  "date": "2025-12-29",
  "generatedCount": 15,
  "reusedCount": 42
}
```

**Reseteo automático:**
- Cuando la fecha cambia (medianoche)
- Los contadores vuelven a 0
- El archivo se actualiza automáticamente

## Scripts de Testing

### Probar el Sistema de Límites
```bash
npm run test:generation-limit
```

Muestra:
- Estado actual del límite
- Contador de generaciones
- Contador de reutilizaciones
- Simula operaciones

**Ejemplo de salida:**
```
📊 Current Stats:
   Date: 2025-12-29
   Generated today: 15
   Reused today: 42

📋 Limit Information:
   Max daily generations: 20
   Used: 15
   Remaining: 5
   Can generate: ✅ YES
```

### Ver Estado del Límite
```bash
curl http://localhost:3001/api/generate-image/status | jq
```

## Manejo de Errores

### En el Cliente (Frontend)

```javascript
async function requestImage(city, weatherData) {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, weatherData })
    });

    if (response.status === 503) {
      const error = await response.json();

      // Mostrar modal genérico sobre alta demanda
      showHighDemandModal({
        title: "Servicio temporalmente no disponible",
        message: error.message,
        retryAfter: error.retryAfter,
      });

      return null;
    }

    const result = await response.json();

    if (result.reused) {
      console.log('♻️ Using existing image');
    } else {
      console.log('✨ Generated new image');
    }

    return result;
  } catch (error) {
    console.error('Error requesting image:', error);
    return null;
  }
}
```

### Mensaje al Usuario

**✅ CORRECTO (genérico):**
> "Nuestro sistema está experimentando alta demanda en este momento. Por favor, intenta de nuevo más tarde o en unas horas."

**❌ INCORRECTO (menciona IA):**
> ~~"Hemos alcanzado el límite diario de generación de imágenes con IA"~~

## Configuración

### Cambiar el Límite Diario

Editar `server/config/generation-limit.ts`:

```typescript
const MAX_DAILY_GENERATIONS = 20; // ← Cambiar aquí
```

**Opciones recomendadas:**
- Desarrollo: `50-100`
- Producción baja carga: `20-30`
- Producción alta carga: `10-15`

### Cambiar Rate Limit por IP

Editar `server/routes/generate-image.ts`:

```typescript
const imageGenerationLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 100, // ← Cambiar aquí
  message: "Demasiadas solicitudes...",
});
```

## Monitoreo

### Ver Logs en Producción

```bash
# Buscar advertencias de límite alcanzado
grep "Daily generation limit reached" logs.txt

# Contar generaciones del día
grep "Generation stats:" logs.txt | tail -1

# Ver reutilizaciones
grep "Reuse stats:" logs.txt | wc -l
```

### Logs Importantes

**Límite alcanzado:**
```
⚠️ Daily generation limit reached: 20/20
```

**Generación nueva:**
```
📊 Generation stats: 15/20 used today
```

**Reutilización:**
```
♻️ Reuse stats: 42 images reused today
```

**Reseteo diario:**
```
📅 New day detected, resetting generation counter
   Previous: 2025-12-28 (20 generated, 58 reused)
```

## Estrategias para Optimizar el Uso

### 1. Pre-generar Imágenes Populares

```bash
# Generar imágenes para ciudades principales antes del pico de uso
npm run generate:weather
```

### 2. Monitorear Patrones de Uso

- Identificar ciudades más solicitadas
- Pre-generar variaciones climáticas comunes
- Ejemplo: Si "São Paulo" se solicita mucho, generar:
  - `sao-paulo-sunny.png`
  - `sao-paulo-cloudy.png`
  - `sao-paulo-rain.png`

### 3. Informar Estado al Usuario (Opcional)

```javascript
// Mostrar cuántas generaciones quedan
const status = await fetch('/api/generate-image/status');
const { stats } = await status.json();

if (stats.remaining < 5) {
  showWarning(`Solo ${stats.remaining} generaciones disponibles hoy`);
}
```

## Casos de Uso Reales

### Caso 1: Día Normal

```
08:00 - Usuario 1: Paris sunny → Genera nueva (1/20)
09:30 - Usuario 2: Paris sunny → Reutiliza (1/20)
10:15 - Usuario 3: Chicago cloudy → Genera nueva (2/20)
11:00 - Usuario 4: Chicago cloudy → Reutiliza (2/20)
...
23:00 - Total: 18 generadas, 147 reutilizadas
23:59 - Límite no alcanzado ✅
00:00 - Reseteo automático (0/20)
```

### Caso 2: Día de Alto Tráfico

```
08:00 - 15 generaciones en 2 horas (15/20)
10:00 - 5 generaciones más (20/20) ← LÍMITE ALCANZADO
10:01 - Nuevas solicitudes reciben error 503
10:01 - Pero reutilizaciones siguen funcionando ♻️
...
00:00 - Reseteo automático (0/20)
```

## FAQ

**P: ¿Por qué 20 generaciones por día?**
R: Balance entre costos de API de Gemini y necesidades del sistema. Ajustable según presupuesto.

**P: ¿Qué pasa si necesito más de 20?**
R: Las reutilizaciones son ilimitadas. Pre-genera imágenes para ciudades populares.

**P: ¿El límite es por servidor o por usuario?**
R: Por servidor (global). Afecta a todos los usuarios.

**P: ¿Puedo ver cuántas generaciones quedan?**
R: Sí, usando `GET /api/generate-image/status`

**P: ¿El límite se resetea a medianoche de qué zona horaria?**
R: Zona horaria del servidor donde corre la aplicación.

## Archivos Relacionados

| Archivo | Función |
|---------|---------|
| `server/config/generation-limit.ts` | Lógica del límite diario |
| `server/routes/generate-image.ts` | Endpoint de generación (usa el límite) |
| `scripts/test-generation-limit.ts` | Script de testing |
| `data/generation-stats.json` | Estadísticas persistentes |
| `docs/IMAGE_REUSE.md` | Sistema de reutilización de imágenes |
