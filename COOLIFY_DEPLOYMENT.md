# Deployment en Coolify - Sistema de Cola

Guía para desplegar el sistema de cola en Coolify con Redis externo.

## 📋 Pre-requisitos

1. **Redis Stack Separado** en Coolify
   - Debes tener un servicio Redis corriendo en Coolify
   - Anota la URL interna de Redis (ej: `redis://redis-service:6379`)

2. **MinIO/S3** configurado (ya lo tienes)

3. **API Keys** (Gemini, OpenWeather)

---

## 🚀 Opción 1: Deployment con Dockerfile (Recomendado)

Coolify puede desplegar directamente desde el Dockerfile sin docker-compose.

### Paso 1: Crear 2 Servicios en Coolify

#### Servicio 1: Weather Video App (Server)

**Configuración:**
- **Source:** Tu repositorio Git
- **Build Type:** Dockerfile
- **Dockerfile:** `Dockerfile` (default)
- **Port:** 3001
- **Command:** (dejar vacío, usa el CMD del Dockerfile)

**Variables de Entorno:**
```bash
NODE_ENV=production
PORT=3001

# Redis (IMPORTANTE: URL de tu stack Redis en Coolify)
REDIS_URL=redis://tu-redis-service.coolify.internal:6379
# O si usa contraseña:
# REDIS_URL=redis://:password@tu-redis-service:6379

# APIs
GEMINI_API_KEY=tu_api_key
OPENWEATHER_API_KEY=tu_api_key

# MinIO/S3
MINIO_ENDPOINT=tu-endpoint.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=tu_access_key
MINIO_SECRET_KEY=tu_secret_key
MINIO_BUCKET=weather
```

#### Servicio 2: Weather Video Worker

**Configuración:**
- **Source:** Mismo repositorio Git
- **Build Type:** Dockerfile
- **Dockerfile:** `Dockerfile` (mismo)
- **Port:** Ninguno (worker no expone puerto)
- **Command Override:** `npx tsx server/worker-process.ts`

**Variables de Entorno:** (mismas que el servidor)

---

## 🚀 Opción 2: Deployment con Docker Compose

Si prefieres usar docker-compose en Coolify:

### Paso 1: Usa docker-compose.coolify.yml

En Coolify, especifica:
- **Docker Compose File:** `docker-compose.coolify.yml`

### Paso 2: Configurar Variables de Entorno en Coolify

Las mismas variables de arriba, especialmente `REDIS_URL`.

---

## 🔗 Conectar Redis Externo

### Opción A: Redis en el mismo proyecto Coolify

Si tu Redis está en el mismo proyecto:

```bash
REDIS_URL=redis://redis-service:6379
```

Donde `redis-service` es el nombre del servicio Redis en Coolify.

### Opción B: Redis en otro proyecto Coolify

Necesitas usar la URL interna de Coolify:

```bash
REDIS_URL=redis://redis-xyz123.coolify.internal:6379
```

Obtén esta URL desde:
1. Panel de Coolify → Tu servicio Redis
2. Sección "Internal Domains" o "Service Discovery"

### Opción C: Redis Cloud/Externo (Upstash, Redis Cloud, etc.)

```bash
# Redis con TLS
REDIS_URL=rediss://default:password@redis-12345.cloud.redislabs.com:6380

# Upstash
REDIS_URL=rediss://default:password@your-endpoint.upstash.io:6380
```

---

## 🧪 Verificar Deployment

### 1. Health Check

```bash
curl https://tu-app.coolify.app/api/health
```

Debe retornar:
```json
{
  "status": "ok",
  "services": {
    "minio": true,
    "redis": true  // ← Debe ser true
  }
}
```

Si `redis: false`, verifica la `REDIS_URL`.

### 2. Test de Cola

```bash
# Encolar un video
curl -X POST https://tu-app.coolify.app/api/render-video \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Test",
    "weatherData": {
      "city": "Test",
      "temperature": 25,
      "condition": "sunny",
      "description": "Test",
      "date": "2025-12-27"
    },
    "imageFilename": "test.jpg",
    "language": "en"
  }'

# Debe retornar jobId inmediatamente:
# { "jobId": "video-test-...", "status": "pending" }
```

### 3. Verificar Status

```bash
curl https://tu-app.coolify.app/api/jobs/{jobId}
```

---

## 📊 Logs en Coolify

### Ver logs del Server
```bash
# En Coolify UI: weather-video-app → Logs
```

Busca:
```
✅ Redis connection verified
🔌 Socket.io enabled for real-time updates
```

### Ver logs del Worker
```bash
# En Coolify UI: weather-video-worker → Logs
```

Busca:
```
🔧 Video worker started (concurrency: 3)
🧹 Cleanup worker started
```

---

## 🔧 Troubleshooting

### Error: Redis connection failed

**Síntoma:**
```
❌ Redis is not available!
   Video queue will not work until Redis is available.
```

**Soluciones:**

1. **Verifica REDIS_URL:**
   ```bash
   # Debe ser accesible desde el contenedor
   # NO uses localhost
   # Usa el nombre del servicio interno de Coolify
   ```

2. **Test de conectividad:**
   En Coolify, abre una terminal en el contenedor:
   ```bash
   # Instalar redis-cli (si no está)
   apk add redis

   # Test conexión
   redis-cli -u $REDIS_URL ping
   # Debe retornar: PONG
   ```

3. **Network/Firewall:**
   - Asegúrate que ambos servicios estén en la misma red de Coolify
   - Redis debe aceptar conexiones de otros contenedores

### Worker no procesa jobs

**Síntoma:** Jobs quedan en "pending" indefinidamente

**Verifica:**

1. **Worker está corriendo:**
   ```bash
   # En logs del worker debe aparecer:
   🔧 Video worker started (concurrency: 3)
   ```

2. **Redis es el mismo:**
   ```bash
   # Server y Worker deben usar la MISMA REDIS_URL
   ```

3. **Reinicia el worker:**
   ```bash
   # En Coolify: Restart service
   ```

### Jobs fallan con "Unknown error"

**Verifica:**

1. **Variables de entorno completas:**
   - GEMINI_API_KEY
   - MINIO_ENDPOINT
   - Todas las credenciales

2. **Volumen de output:**
   ```bash
   # El directorio /app/out debe existir y ser escribible
   ```

---

## 🔄 Escalar Workers

En Coolify puedes escalar horizontalmente:

**Opción 1: Múltiples réplicas del worker**
1. Duplica el servicio `weather-video-worker`
2. Renombra: `weather-video-worker-2`, `weather-video-worker-3`, etc.
3. Misma configuración, misma REDIS_URL
4. Todos procesarán jobs del mismo queue

**Resultado:** 3 workers = 9 videos simultáneos (3 por worker)

**Opción 2: Docker Swarm/Kubernetes (avanzado)**
Si Coolify soporta réplicas automáticas, configura:
```yaml
deploy:
  replicas: 3
```

---

## 📈 Monitoreo

### Métricas importantes

1. **Queue Length:**
   ```bash
   # Conecta a Redis
   redis-cli -u $REDIS_URL

   # Ver jobs pending
   LLEN bull:video-render-queue:wait

   # Ver jobs activos
   LLEN bull:video-render-queue:active
   ```

2. **Job Success Rate:**
   ```bash
   GET /api/jobs?limit=100
   # Analiza cuántos están "completed" vs "failed"
   ```

---

## 🎉 Checklist Final

- [ ] Redis stack corriendo en Coolify
- [ ] REDIS_URL configurada correctamente
- [ ] Server desplegado y health check pasa
- [ ] Worker desplegado y logs muestran "worker started"
- [ ] Test de video retorna jobId
- [ ] Job se completa exitosamente
- [ ] Video accesible en MinIO
- [ ] Socket.io funciona (opcional: test con test-queue.html)

---

## 💡 Tips Coolify

1. **Secrets:** Usa Coolify Secrets para API keys sensibles

2. **Persistent Volumes:**
   - El directorio `/app/out` puede ser temporal
   - Videos se suben a MinIO y se eliminan localmente

3. **Auto Deploy:**
   - Conecta tu repo Git
   - Coolify auto-deploy en cada push

4. **Logs Centralizados:**
   - Coolify guarda logs automáticamente
   - Útil para debugging

5. **Resource Limits:**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2.0'
         memory: 4G
   ```

---

## 📞 Soporte

Si tienes problemas:

1. Verifica logs en Coolify UI
2. Verifica `/api/health`
3. Test Redis connection manualmente
4. Revisa QUEUE_SYSTEM.md para más detalles

¡Listo! Tu sistema de cola debería estar funcionando en Coolify con Redis externo 🚀
