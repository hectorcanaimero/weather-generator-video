# Sistema de Cola para Generación de Videos

Sistema de cola robusto implementado con **BullMQ + Redis + Socket.io** para manejar 500 videos/día sin saturar el servidor.

## 🎯 Cambios Realizados

### Nuevos Archivos Creados

1. **server/config/redis.ts** - Configuración de Redis con singleton connection
2. **server/config/queue.ts** - Configuración de BullMQ con interfaces TypeScript
3. **server/lib/render-engine.ts** - Lógica de renderizado extraída (reutilizable)
4. **server/lib/job-events.ts** - Sistema de eventos Socket.io
5. **server/workers/video-worker.ts** - Worker de renderizado (3 concurrentes)
6. **server/workers/cleanup-worker.ts** - Worker de limpieza (30 días)
7. **server/routes/job-status.ts** - Endpoint para consultar status de jobs
8. **server/worker-process.ts** - Entry point del proceso worker

### Archivos Modificados

1. **server/index.ts** - Integrado Socket.io para updates en tiempo real
2. **server/routes/render-video.ts** - Convertido a dispatcher de queue (respuesta inmediata)
3. **docker-compose.yml** - Agregados Redis y worker containers
4. **package.json** - Nuevas dependencias y scripts

## 📦 Nuevas Dependencias

```bash
bullmq@5.24.0       # Sistema de colas
ioredis@5.4.1       # Cliente Redis
socket.io@4.8.1     # WebSocket para updates
concurrently@9.2.1  # Ejecutar múltiples procesos (dev)
```

## 🚀 Cómo Usar

### Desarrollo Local

```bash
# Terminal 1: Iniciar Redis
docker run -p 6379:6379 redis:7-alpine

# Terminal 2 & 3: Servidor + Worker
npm run dev:full

# O manualmente:
npm run server  # Terminal 2
npm run worker  # Terminal 3
```

### Producción con Docker

```bash
# Iniciar todo (Redis + Server + Worker)
npm run docker:compose:up

# Ver logs
npm run docker:compose:logs              # Todos los servicios
npm run docker:compose:logs:worker       # Solo worker

# Detener
npm run docker:compose:down
```

### Escalar Workers

```bash
# Ejecutar 5 workers simultáneos
docker-compose up -d --scale weather-video-worker=5
```

## 🔌 API Endpoints

### Nuevo: Encolar Video (Respuesta Inmediata)

```bash
POST /api/render-video
Content-Type: application/json

{
  "city": "Puerto Ordaz",
  "weatherData": {
    "city": "Puerto Ordaz",
    "temperature": 28,
    "condition": "sunny",
    "description": "Cielo despejado",
    "date": "2025-12-27"
  },
  "imageFilename": "weather-bg-1.jpg",
  "language": "es"
}

# Respuesta (202 Accepted):
{
  "jobId": "video-puerto-ordaz-1735311234567",
  "status": "pending",
  "message": "Video render job has been queued",
  "estimatedTime": "2-5 minutes"
}
```

### Nuevo: Consultar Status de Job

```bash
GET /api/jobs/{jobId}

# Respuesta:
{
  "jobId": "video-puerto-ordaz-1735311234567",
  "status": "active",           # pending | active | completed | failed
  "progress": { "stage": "rendering", "progress": 65 },
  "data": { ... },              # Job data original
  "result": null,               # Video URL cuando completed
  "error": null,                # Error message si failed
  "createdAt": "2025-12-27T...",
  "processedOn": "2025-12-27T...",
  "finishedOn": null
}
```

### Nuevo: Listar Jobs

```bash
GET /api/jobs?status=active&limit=10

# Respuesta:
{
  "jobs": [
    {
      "jobId": "...",
      "status": "active",
      "progress": 45,
      "city": "Curitiba",
      "language": "en",
      "createdAt": "..."
    }
  ],
  "count": 3
}
```

## 🔌 WebSocket Integration (Cliente)

```javascript
// Conectar a Socket.io
const socket = io('http://localhost:3001');

// Suscribirse a un job específico
socket.emit('subscribe:job', jobId);

// Escuchar actualizaciones de progreso
socket.on('job:progress', (data) => {
  console.log(`Status: ${data.status}, Progress: ${data.progress}%`);
  console.log(`Message: ${data.message}`);
  // Actualizar UI con progreso
});

// Video completado
socket.on('job:completed', (data) => {
  console.log('Video listo:', data.result.videoUrl);
  // Mostrar video al usuario
});

// Error en renderizado
socket.on('job:failed', (data) => {
  console.error('Error:', data.error);
  // Mostrar error al usuario
});

// Desuscribirse (opcional)
socket.emit('unsubscribe:job', jobId);
```

## 📊 Especificaciones del Sistema

- **Carga:** 500 videos/día (~21 videos/hora)
- **Concurrencia:** 3 videos simultáneos máximo
- **Capacidad:** 60 videos/hora (utilización ~35%)
- **Reintentos:** 2 intentos automáticos con backoff exponencial (30s)
- **Retención Jobs:** 30 días en Redis
- **Retención Videos:** 30 días en MinIO (limpieza automática)
- **Cleanup:** Cron diario a las 2 AM (videos) y 3 AM (jobs)

## 🏗️ Arquitectura

```
Cliente Web
  ↓ POST /api/render-video → Retorna jobId inmediatamente
  ↓ Socket.io subscribe → job:${jobId}

Express Server (puerto 3001)
  ↓ Encola job en Redis
  ↓ Emite eventos Socket.io

Redis (BullMQ)
  ↓ Queue: video-render-queue

Worker Process (3 concurrent)
  ↓ 1. Bundle (0-30%)
  ↓ 2. Composition (30-40%)
  ↓ 3. Render (40-85%)
  ↓ 4. Upload MinIO (85-95%)
  ↓ 5. Cleanup (95-100%)
  ↓ Emite job:completed con videoUrl

Cleanup Worker
  └─ Daily 2 AM: Elimina videos >30 días
  └─ Daily 3 AM: Limpia jobs >30 días
```

## 🔧 Configuración

### Desarrollo Local

Agregar a tu `.env`:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Existing vars (MinIO, API keys, etc.)
MINIO_ENDPOINT=...
MINIO_ACCESS_KEY=...
# ...
```

### Deployment en Coolify (Producción)

Si despliegas en **Coolify** con Redis externo:

```bash
# Redis externo (ajusta según tu configuración)
REDIS_URL=redis://tu-redis-service:6379
# O con contraseña:
REDIS_URL=redis://:password@tu-redis-service:6379
```

📖 **Ver guía completa:** [COOLIFY_DEPLOYMENT.md](COOLIFY_DEPLOYMENT.md)

**Archivos para Coolify:**
- `docker-compose.coolify.yml` - Sin Redis incluido (usa Redis externo)
- `docker-compose.yml` - Con Redis local (desarrollo/testing)

## 🧪 Testing

### Test Rápido

```bash
# 1. Iniciar servicios
npm run dev:full

# 2. Encolar video
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
  }'

# 3. Copiar jobId y consultar status
curl http://localhost:3001/api/jobs/{jobId}
```

### Verificar Health

```bash
curl http://localhost:3001/api/health

# Respuesta:
{
  "status": "ok",
  "services": {
    "minio": true,
    "redis": true
  }
}
```

## 🐛 Troubleshooting

### Redis no disponible

```bash
# Verificar si Redis está corriendo
docker ps | grep redis

# Iniciar Redis
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Verificar conexión
redis-cli ping  # Debe retornar PONG
```

### Worker no procesa jobs

```bash
# Ver logs del worker
npm run docker:compose:logs:worker

# Verificar jobs en Redis
docker exec -it weather-video-redis redis-cli
> KEYS bull:video-render-queue:*
> HGETALL bull:video-render-queue:1
```

### Jobs stuck en "active"

BullMQ detecta jobs estancados automáticamente (>30s) y los reintenta.

## 📈 Monitoreo

### Logs Importantes

```bash
# Server logs
✅ Redis connection verified
🔌 Client connected: socket-id
📋 Job added to queue: job-id
📡 Emitted job:progress for job-id: 45%

# Worker logs
🎬 Processing job job-id for City...
📦 Bundling Remotion project...
🎥 Rendering video...
📤 Uploading video to MinIO...
✅ Job job-id completed successfully

# Cleanup logs
🧹 Starting cleanup: videos
🗑️  Deleted old video: weather-city-123.mp4
✅ Cleanup complete: 15 videos deleted
```

## 🎉 Beneficios

### Antes (Sincrónico)
- ❌ Cliente espera 2-5 minutos bloqueado
- ❌ Sin control de concurrencia
- ❌ Múltiples requests saturan el servidor
- ❌ Sin feedback de progreso

### Ahora (Sistema de Cola)
- ✅ Respuesta inmediata (<100ms)
- ✅ Máximo 3 videos simultáneos
- ✅ Escalable (500 videos/día con 35% utilización)
- ✅ Actualizaciones en tiempo real vía WebSocket
- ✅ Auto-retry en caso de error
- ✅ Cleanup automático de jobs/videos antiguos
- ✅ Fácil escalar workers horizontalmente

## 🔜 Próximos Pasos (Opcional)

1. **Autenticación:** Asociar jobs con usuarios específicos
2. **Priorización:** Jobs premium con mayor prioridad
3. **Métricas:** Dashboard con Grafana + Prometheus
4. **Notificaciones:** Email/SMS cuando video esté listo
5. **Bull Board:** UI web para monitorear queues

## 📚 Recursos

- [BullMQ Docs](https://docs.bullmq.io/)
- [Socket.io Docs](https://socket.io/docs/)
- [Redis Docs](https://redis.io/docs/)
