#!/bin/bash

echo "🔍 Verificando configuración de Docker para Remotion..."
echo ""

# Verificar que el contenedor esté corriendo
echo "1️⃣ Verificando contenedor..."
CONTAINER_ID=$(docker ps -q -f name=weather-video)
if [ -z "$CONTAINER_ID" ]; then
    echo "❌ No hay contenedor corriendo con nombre 'weather-video'"
    echo "   Intenta: docker ps -a | grep weather"
    exit 1
else
    echo "✅ Contenedor encontrado: $CONTAINER_ID"
fi
echo ""

# Verificar Chromium instalado
echo "2️⃣ Verificando Chromium..."
docker exec $CONTAINER_ID chromium-browser --version 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Chromium instalado correctamente"
else
    echo "❌ Chromium NO está instalado"
    echo "   Necesitas rebuilder la imagen con el Dockerfile actualizado"
fi
echo ""

# Verificar variables de entorno
echo "3️⃣ Verificando variables de entorno..."
PUPPETEER_PATH=$(docker exec $CONTAINER_ID printenv PUPPETEER_EXECUTABLE_PATH 2>/dev/null)
if [ "$PUPPETEER_PATH" = "/usr/bin/chromium-browser" ]; then
    echo "✅ PUPPETEER_EXECUTABLE_PATH: $PUPPETEER_PATH"
else
    echo "❌ PUPPETEER_EXECUTABLE_PATH no está configurado correctamente"
    echo "   Valor actual: $PUPPETEER_PATH"
    echo "   Esperado: /usr/bin/chromium-browser"
fi
echo ""

# Verificar archivos críticos
echo "4️⃣ Verificando archivos críticos..."
FILES=("postcss.config.mjs" "remotion.config.ts" "src/index.ts" "server/routes/render-video.ts")
for FILE in "${FILES[@]}"; do
    docker exec $CONTAINER_ID test -f /app/$FILE 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ $FILE existe"
    else
        echo "❌ $FILE NO existe"
    fi
done
echo ""

# Verificar el código de render-video.ts
echo "5️⃣ Verificando configuración de Chromium en render-video.ts..."
docker exec $CONTAINER_ID grep -q "headless=new" /app/server/routes/render-video.ts 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Flag --headless=new encontrado en render-video.ts"
else
    echo "❌ Flag --headless=new NO encontrado en render-video.ts"
    echo "   El código no está actualizado en el contenedor"
    echo "   Necesitas hacer rebuild de la imagen"
fi
echo ""

# Verificar dependencias instaladas
echo "6️⃣ Verificando dependencias del sistema..."
DEPS=("ffmpeg" "chromium-browser" "nss" "freetype")
for DEP in "${DEPS[@]}"; do
    docker exec $CONTAINER_ID which $DEP >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ $DEP instalado"
    else
        echo "❌ $DEP NO instalado"
    fi
done
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 RESUMEN:"
echo ""
if docker exec $CONTAINER_ID grep -q "headless=new" /app/server/routes/render-video.ts 2>/dev/null && \
   docker exec $CONTAINER_ID chromium-browser --version >/dev/null 2>&1; then
    echo "✅ Todo parece estar configurado correctamente"
    echo ""
    echo "Si aún tienes problemas, revisa los logs:"
    echo "   docker logs -f $CONTAINER_ID"
else
    echo "❌ Hay problemas de configuración"
    echo ""
    echo "SOLUCIÓN:"
    echo "1. Asegúrate de que los cambios estén en Git:"
    echo "   git log --oneline -1"
    echo ""
    echo "2. Rebuilder la imagen Docker:"
    echo "   docker build -t weather-video:latest ."
    echo ""
    echo "3. Reiniciar el contenedor:"
    echo "   docker stop $CONTAINER_ID"
    echo "   docker run -p 3001:3001 --env-file .env weather-video:latest"
    echo ""
    echo "4. En Coolify, fuerza un rebuild:"
    echo "   - Ve a tu aplicación"
    echo "   - Click en 'Force Rebuild Without Cache'"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
