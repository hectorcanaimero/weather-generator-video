# Configuración de Coolify para Weather Generator Video

## Configuración del Servicio en Coolify

### 1. Tipo de Despliegue
- **Tipo**: Docker Compose
- **Archivo**: `docker-compose.yaml`
- **Branch**: `main`

### 2. Configuración de Red y Puertos

#### Opción A: Con Traefik (Proxy Reverso) - RECOMENDADO
Si quieres acceder sin puerto en la URL (ej: `https://weather-ia.guayoyoltda.com`):

1. En Coolify, ve a la configuración del servicio `weather-video`
2. En la sección de **Network**:
   - ✅ Habilita "Traefik" o "Proxy"
   - Puerto expuesto: `3001`
   - NO marcar "Expose Port" o "Public Port"
3. En **Domains**:
   - FQDN: `weather-ia.guayoyoltda.com`
   - NO incluir el puerto (Traefik se encarga)
4. Los labels de Traefik se agregan automáticamente:
   ```yaml
   traefik.http.services.<service>.loadbalancer.server.port=3001
   traefik.http.routers.<service>.rule=Host(`weather-ia.guayoyoltda.com`)
   ```

#### Opción B: Puerto Directo (Sin Traefik)
Si quieres acceder con puerto (ej: `https://weather-ia.guayoyoltda.com:3001`):

1. En Coolify, marca "Expose Port" o "Public Port"
2. Puerto: `3001`
3. FQDN: `weather-ia.guayoyoltda.com:3001`

**Nota**: La opción A es preferida para producción.

### 3. Variables de Entorno Requeridas

Configura estas variables en Coolify:

```bash
# APIs
GEMINI_API_KEY=tu_api_key_aqui
OPENWEATHER_API_KEY=tu_api_key_aqui

# MinIO / S3 (sin http:// o https://)
MINIO_ENDPOINT=s3.guria.lat
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=tu_access_key
MINIO_SECRET_KEY=tu_secret_key
MINIO_BUCKET=weather

# Redis (URL completa)
REDIS_URL=redis://tu-redis-host:6379

# Rate Limiting (opcional)
MAX_VIDEOS_PER_DAY=500

# NO configurar NODE_ENV=production como "Build Time"
# Debe ser solo "Runtime"
NODE_ENV=production
PORT=3001
```

### 4. Configuración de Build

**IMPORTANTE**: En las variables de entorno:
- `NODE_ENV`: **NO** marcar como "Available at Buildtime"
- Solo marcar como "Runtime"

Si `NODE_ENV=production` está disponible en build time, npm saltará las devDependencies que son necesarias para compilar.

### 5. Verificación del Despliegue

Después del deploy, verifica:

1. **Salud del servicio**:
   ```bash
   curl https://weather-ia.guayoyoltda.com/api/health
   ```

   Deberías ver:
   ```json
   {
     "status": "ok",
     "services": {
       "minio": true,
       "redis": true
     }
   }
   ```

2. **Logs del contenedor**:
   - Busca: ✅ MinIO initialized successfully
   - Busca: ✅ Redis connection verified
   - Busca: 🚀 Server running on http://localhost:3001

3. **Dashboard de colas** (admin):
   ```
   https://weather-ia.guayoyoltda.com/admin/queues
   ```

### 6. Troubleshooting

#### Error: "no available server"
- Verifica que Traefik esté corriendo en el mismo servidor
- Verifica los logs de Traefik: `docker logs traefik`
- Confirma que el contenedor esté en la red de Traefik:
  ```bash
  docker network inspect <coolify-network-id>
  ```

#### Error: "InvalidEndpointError" (MinIO)
- Asegúrate de que `MINIO_ENDPOINT` NO tenga `http://` o `https://`
- Usa solo el hostname: `s3.guria.lat`

#### Error: DNS no resuelve
- Ya está configurado en docker-compose.yaml con DNS públicos (1.1.1.1, 8.8.8.8)
- Verifica dentro del contenedor:
  ```bash
  docker exec <container-name> nslookup s3.guria.lat
  ```

#### Servicios no conectan
- Redis: Verifica que `REDIS_URL` sea accesible desde el contenedor
- MinIO: Verifica que `MINIO_ENDPOINT` sea accesible en el puerto configurado

### 7. Escalado de Workers

Para escalar el número de workers:

```bash
docker-compose up --scale weather-video-worker=5 -d
```

O edita `docker-compose.yaml` y agrega:
```yaml
weather-video-worker:
  deploy:
    replicas: 5
```

### 8. Estructura de Servicios

- **weather-video**: Servidor Express + Socket.io + BullMQ workers internos
- **weather-video-worker**: Workers dedicados adicionales (opcional, para escalar)

El servidor principal (`weather-video`) ya incluye 3 workers concurrentes. Solo necesitas `weather-video-worker` si necesitas procesamiento adicional.

### 9. Endpoints Disponibles

Una vez desplegado correctamente:

- `GET  /` - Frontend
- `GET  /api/health` - Health check
- `GET  /api/weather?city=Lima` - Obtener clima
- `POST /api/generate-image` - Generar imagen del clima
- `POST /api/render-video` - Renderizar video
- `GET  /api/jobs/:id` - Estado del job
- `GET  /api/videos` - Listar videos recientes
- `GET  /api/geocode?address=Lima` - Geocodificar
- `GET  /api/rate-limit/status` - Estado de rate limiting
- `GET  /admin/queues` - Dashboard de BullMQ

### 10. Monitoreo

Logs en tiempo real:
```bash
docker logs -f weather-video-<coolify-id>
docker logs -f weather-video-worker-<coolify-id>
```

Métricas de Redis/BullMQ:
- Accede al Bull Board: `/admin/queues`
