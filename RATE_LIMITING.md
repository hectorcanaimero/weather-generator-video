# Sistema de Límite Diario de Videos

Sistema de rate limiting implementado con Redis para controlar la cantidad de videos generados por día.

## 🎯 Objetivo

Limitar la generación de videos a **500 por día** (configurable) para:
- Controlar costos de APIs (Gemini, OpenWeather)
- Prevenir abuso del sistema
- Gestionar recursos del servidor (CPU, storage)
- Mantener calidad del servicio

---

## ⚙️ Configuración

### Variable de Entorno

Agrega a tu `.env`:

```bash
# Límite diario de videos (default: 500)
MAX_VIDEOS_PER_DAY=500
```

Si no se especifica, el valor por defecto es **500 videos/día**.

### Cambiar el Límite

Puedes ajustar el límite según tus necesidades:

```bash
# 100 videos/día (más conservador)
MAX_VIDEOS_PER_DAY=100

# 1000 videos/día (más generoso)
MAX_VIDEOS_PER_DAY=1000

# Sin límite (usar con precaución)
MAX_VIDEOS_PER_DAY=999999
```

---

## 🔧 Cómo Funciona

### 1. Contador en Redis

El sistema usa Redis para mantener un contador global:
- **Key:** `rate-limit:videos:daily`
- **Valor:** Número de videos generados hoy
- **TTL:** Expira a medianoche UTC

### 2. Flujo de Generación

```
1. Usuario solicita video
   ↓
2. Check: ¿currentCount < limit?
   ├─ SÍ → Permite generar
   │        ↓
   │     Encola job
   │        ↓
   │     Incrementa contador
   │        ↓
   │     Retorna jobId + usage info
   │
   └─ NO → Rechaza con HTTP 429
            ↓
         Retorna tiempo hasta reset
```

### 3. Reset Automático

El contador se resetea automáticamente a **medianoche UTC** cada día.

---

## 📡 API Endpoints

### 1. Consultar Estado del Límite

```bash
GET /api/rate-limit
```

**Respuesta:**
```json
{
  "limit": 500,
  "current": 42,
  "remaining": 458,
  "isAllowed": true,
  "resetsAt": "2025-12-28T00:00:00.000Z",
  "resetsIn": {
    "hours": 6,
    "minutes": 30,
    "seconds": 15
  }
}
```

### 2. Contador Actual

```bash
GET /api/rate-limit/current
```

**Respuesta:**
```json
{
  "count": 42
}
```

### 3. Reset Manual (Admin)

```bash
POST /api/rate-limit/reset
```

**⚠️ IMPORTANTE:** Este endpoint NO está protegido actualmente. En producción debes agregar autenticación.

**Respuesta:**
```json
{
  "success": true,
  "message": "Daily counter has been reset"
}
```

---

## 🎬 Endpoint de Generación Actualizado

Ahora `/api/render-video` retorna información de uso:

### Request

```bash
POST /api/render-video
Content-Type: application/json

{
  "city": "Buenos Aires",
  "weatherData": { ... },
  "imageFilename": "buenos-aires-123.png",
  "language": "es"
}
```

### Response (Éxito - 202 Accepted)

```json
{
  "jobId": "video-buenos-aires-1234567890",
  "status": "pending",
  "message": "Video render job has been queued",
  "estimatedTime": "2-5 minutes",
  "dailyUsage": {
    "current": 43,
    "limit": 500,
    "remaining": 457
  }
}
```

### Response (Límite Alcanzado - 429 Too Many Requests)

```json
{
  "error": "Daily video generation limit reached",
  "message": "You have reached the daily limit of 500 videos. Please try again later.",
  "limit": 500,
  "currentCount": 500,
  "resetsAt": "2025-12-28T00:00:00.000Z",
  "resetsIn": {
    "hours": 6,
    "minutes": 30
  }
}
```

---

## 📊 Logs del Servidor

El sistema genera logs informativos:

```bash
# Cuando se genera un video
📋 Adding video render job to queue for Buenos Aires (es)...
📊 Daily usage: 43/500 videos
✅ Job added to queue: video-buenos-aires-1234567890
📈 Daily counter incremented: 43/500

# Cuando se alcanza el límite
⚠️  Daily limit reached: 500/500

# Cuando se inicializa el contador (primer video del día)
📊 Daily counter initialized. Resets in 23h 59m
```

---

## 🧪 Testing

### 1. Verificar Estado Inicial

```bash
curl http://localhost:3001/api/rate-limit | jq
```

### 2. Generar un Video

```bash
curl -X POST http://localhost:3001/api/render-video \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Test City",
    "weatherData": {
      "city": "Test City",
      "temperature": 25,
      "condition": "sunny",
      "description": "Clear sky",
      "date": "2025-12-27"
    },
    "imageFilename": "test.jpg",
    "language": "en"
  }' | jq
```

### 3. Verificar Contador Incrementado

```bash
curl http://localhost:3001/api/rate-limit | jq '.current'
# Debe retornar: 1
```

### 4. Simular Límite Alcanzado

Para probar el comportamiento cuando se alcanza el límite:

```bash
# Opción 1: Cambiar temporalmente MAX_VIDEOS_PER_DAY=1 en .env
# Opción 2: Usar Redis CLI para setear el contador manualmente

# Conectar a Redis
redis-cli

# Setear contador al límite
SET rate-limit:videos:daily 500

# Intentar generar otro video (debería fallar con 429)
```

### 5. Reset Manual

```bash
curl -X POST http://localhost:3001/api/rate-limit/reset | jq
```

---

## 🔐 Seguridad en Producción

### Proteger Endpoint de Reset

El endpoint `/api/rate-limit/reset` NO está protegido. Debes agregar autenticación:

**Opción 1: API Key Simple**

```typescript
// server/routes/rate-limit.ts
router.post("/reset", async (req, res) => {
  const apiKey = req.headers["x-admin-api-key"];

  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await resetDailyCounter();
  return res.json({ success: true });
});
```

**.env:**
```bash
ADMIN_API_KEY=tu_clave_secreta_muy_larga
```

**Opción 2: JWT Authentication**

Implementar sistema de usuarios con JWT tokens.

**Opción 3: Desactivar el Endpoint**

Simplemente elimina o comenta la ruta si no la necesitas.

---

## 📈 Monitoreo

### Grafana Dashboard (Opcional)

Puedes exportar métricas de rate limiting:

```typescript
// Agregar a server/routes/rate-limit.ts
router.get("/metrics", async (_req, res) => {
  const current = await getCurrentDailyCount();
  const limit = parseInt(process.env.MAX_VIDEOS_PER_DAY || "500", 10);
  const percentage = (current / limit) * 100;

  res.set("Content-Type", "text/plain");
  res.send(`
# HELP videos_daily_count Daily video generation count
# TYPE videos_daily_count gauge
videos_daily_count ${current}

# HELP videos_daily_limit Daily video generation limit
# TYPE videos_daily_limit gauge
videos_daily_limit ${limit}

# HELP videos_daily_percentage Percentage of daily limit used
# TYPE videos_daily_percentage gauge
videos_daily_percentage ${percentage}
  `);
});
```

### Alertas

Configura alertas cuando se alcance el 80% del límite:

```typescript
// server/routes/render-video.ts
if (limitCheck.currentCount >= limitCheck.limit * 0.8) {
  console.warn(`⚠️  WARNING: 80% of daily limit reached (${limitCheck.currentCount}/${limitCheck.limit})`);
  // Enviar alerta por email/Slack/Discord
}
```

---

## 🌍 Rate Limiting por IP (Opcional)

Si quieres limitar por IP en vez de globalmente:

```typescript
// server/lib/rate-limiter.ts
export async function checkIPLimit(ip: string): Promise<RateLimitResult> {
  const redis = getRedisConnection();
  const key = `rate-limit:ip:${ip}:daily`;
  const limit = 10; // 10 videos por IP por día

  const count = await redis.get(key);
  const currentCount = count ? parseInt(count, 10) : 0;

  return {
    isAllowed: currentCount < limit,
    currentCount,
    limit,
  };
}

export async function incrementIPCounter(ip: string): Promise<number> {
  const redis = getRedisConnection();
  const key = `rate-limit:ip:${ip}:daily`;

  const newCount = await redis.incr(key);

  if (newCount === 1) {
    const secondsUntilMidnight = getSecondsUntilMidnight();
    await redis.expire(key, secondsUntilMidnight);
  }

  return newCount;
}
```

**Uso:**
```typescript
// server/routes/render-video.ts
const clientIP = req.ip || req.socket.remoteAddress;
const ipLimit = await checkIPLimit(clientIP);

if (!ipLimit.isAllowed) {
  return res.status(429).json({
    error: "Too many videos from this IP",
    message: "You can generate up to 10 videos per day",
  });
}
```

---

## 🐛 Troubleshooting

### Contador no se resetea

**Problema:** El contador no vuelve a 0 a medianoche.

**Solución:**
```bash
# Verificar TTL en Redis
redis-cli TTL rate-limit:videos:daily

# Si retorna -1 (sin expiración), resetear manualmente
curl -X POST http://localhost:3001/api/rate-limit/reset
```

### Redis no disponible

**Problema:** Rate limiting falla si Redis no está conectado.

**Solución:** Agregar fallback en caso de error:

```typescript
// server/routes/render-video.ts
try {
  const limitCheck = await checkDailyLimit();
  // ... resto del código
} catch (error) {
  console.error("⚠️  Rate limit check failed, allowing request:", error);
  // Continuar sin rate limiting si Redis falla
}
```

---

## 📝 Archivos Modificados/Creados

1. **server/lib/rate-limiter.ts** (NUEVO)
   - Funciones de rate limiting con Redis
   - `checkDailyLimit()`, `incrementDailyCounter()`, `resetDailyCounter()`

2. **server/routes/rate-limit.ts** (NUEVO)
   - Endpoints para consultar/resetear límites

3. **server/routes/render-video.ts** (MODIFICADO)
   - Integrado rate limiting antes de encolar jobs
   - Retorna información de uso diario

4. **server/index.ts** (MODIFICADO)
   - Registrada ruta `/api/rate-limit`

---

## 🎉 Resumen

✅ **Límite diario configurable** (default: 500 videos/día)
✅ **Reset automático** a medianoche UTC
✅ **API endpoints** para monitoreo
✅ **Logs informativos** de uso
✅ **Respuestas claras** cuando se alcanza el límite
✅ **Almacenado en Redis** (eficiente y rápido)

El sistema está listo para controlar la generación de videos y prevenir abuso! 🚀
