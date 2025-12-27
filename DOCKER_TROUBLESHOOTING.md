# Docker Troubleshooting para Renderizado de Videos

## Problemas Resueltos en el Dockerfile

### 1. **Chromium no estaba instalado**
Remotion necesita un navegador (Chromium) para renderizar los videos. Alpine Linux no lo incluye por defecto.

**Solución aplicada:**
```dockerfile
RUN apk add --no-cache \
    ffmpeg \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji
```

### 2. **Variables de entorno para Chromium**
Puppeteer (usado por Remotion) necesita saber dónde está Chromium.

**Solución aplicada:**
```dockerfile
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### 3. **PostCSS config faltante**
Tailwind CSS necesita el archivo `postcss.config.mjs` para funcionar correctamente.

**Solución aplicada:**
```dockerfile
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
```

## Cómo Verificar que Funciona

### 1. Rebuild del contenedor
```bash
npm run docker:build
```

### 2. Ejecutar el contenedor
```bash
npm run docker:run
```

O con docker-compose:
```bash
npm run docker:compose:up
```

### 3. Ver los logs
```bash
npm run docker:compose:logs
```

O con docker directo:
```bash
docker logs -f weather-video-app
```

### 4. Probar el renderizado
Haz una petición para generar un video y busca estos logs:

```
🎬 Starting video render for Paris (en)...
📦 Bundling Remotion project...
🔍 Selecting composition...
🎥 Rendering video...
✅ Video rendered successfully: weather-paris-1234567890.mp4
📤 Uploading video to MinIO...
✅ Video uploaded to MinIO: https://s3.guria.lat/weather/...
```

## Errores Comunes y Soluciones

### Error: "Could not find Chrome"
**Causa:** Chromium no está instalado o la ruta no está configurada.
**Solución:** Ya está corregido en el Dockerfile actualizado.

### Error: "Cannot find module 'tailwindcss'"
**Causa:** Dependencias no instaladas correctamente.
**Solución:** Asegúrate de que `npm ci` se ejecute en producción (ya incluido).

### Error: "ENOENT: no such file or directory, open 'postcss.config.mjs'"
**Causa:** Archivo de configuración de PostCSS faltante.
**Solución:** Ya está corregido en el Dockerfile actualizado.

### Error: "Failed to launch the browser process"
**Causa:** Remotion intenta usar su propio Chrome descargado en lugar del Chromium del sistema, o el modo headless antiguo no está disponible.
**Solución:** Ya está corregido en `render-video.ts` con:

```typescript
// En selectComposition y renderMedia:
browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
chromiumOptions: {
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
},
```

Esto le dice a Remotion que:
1. Use el Chromium instalado en el sistema (`/usr/bin/chromium-browser`)
2. Use el nuevo modo headless
3. Deshabilite sandbox (necesario en Docker)
4. Deshabilite `/dev/shm` (evita problemas de memoria compartida en contenedores)

### Video se genera pero está en blanco
**Causa:** Fuentes o recursos no se cargan correctamente.
**Solución:** Verifica que:
1. Las fuentes estén instaladas: `ttf-freefont`, `font-noto-emoji`
2. Los archivos públicos estén copiados: `COPY --from=builder /app/public ./public`

## Optimizaciones de Producción

### 1. Reducir tamaño de imagen
El Dockerfile actual usa multi-stage build para reducir tamaño.

### 2. Limpieza de videos después de subir
El código ya elimina los videos locales después de subirlos a MinIO:

```typescript
fs.unlinkSync(outputPath);
console.log(`🗑️ Local file deleted: ${outputFilename}`);
```

### 3. Health check
El contenedor tiene un health check configurado:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

## Debugging en Coolify

### Ver logs en tiempo real
En Coolify, ve a tu aplicación → "Logs" → Filtra por "render" o "video"

### Variables de entorno requeridas
Asegúrate de tener configuradas en Coolify:

```
GEMINI_API_KEY=your_key
OPENWEATHER_API_KEY=your_key
MINIO_ENDPOINT=s3.guria.lat
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your_key
MINIO_SECRET_KEY=your_key
MINIO_BUCKET=weather
NODE_ENV=production
PORT=3001
```

### Recursos recomendados
- **CPU:** Al menos 2 cores
- **RAM:** Al menos 2GB (recomendado 4GB)
- **Disk:** 10GB (los videos se eliminan después de subir)

## Testing Local

Para probar el Dockerfile localmente antes de deployar:

```bash
# Build
docker build -t weather-video:latest .

# Run con .env file
docker run -p 3001:3001 --env-file .env weather-video:latest

# Ver logs
docker logs -f <container_id>

# Entrar al contenedor para debug
docker exec -it <container_id> /bin/sh

# Verificar Chromium
chromium-browser --version

# Verificar FFmpeg
ffmpeg -version
```

## Próximos Pasos si Persiste el Error

Si después de aplicar estos cambios el video aún no se renderiza:

1. **Revisa los logs completos** del contenedor
2. **Verifica que Chromium esté instalado:**
   ```bash
   docker exec <container_id> chromium-browser --version
   ```
3. **Prueba el renderizado manualmente** dentro del contenedor:
   ```bash
   docker exec -it <container_id> /bin/sh
   cd /app
   npx tsx server/index.ts
   ```
4. **Comparte el error exacto** que aparece en los logs

## Cambios Aplicados al Dockerfile

```diff
 # Production stage
 FROM node:20-alpine

-# Install ffmpeg for video rendering
-RUN apk add --no-cache ffmpeg
+# Install system dependencies for Remotion and Chromium
+RUN apk add --no-cache \
+    ffmpeg \
+    chromium \
+    nss \
+    freetype \
+    harfbuzz \
+    ca-certificates \
+    ttf-freefont \
+    font-noto-emoji
+
+# Set Chromium path for Remotion/Puppeteer
+ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
+    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

 # Set working directory
 WORKDIR /app

 # Copy application files from builder
 COPY --from=builder /app/server ./server
 COPY --from=builder /app/src ./src
 COPY --from=builder /app/public ./public
 COPY --from=builder /app/remotion.config.ts ./remotion.config.ts
+COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
 COPY --from=builder /app/tsconfig.json ./tsconfig.json
```
