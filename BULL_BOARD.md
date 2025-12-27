# 📊 Bull Board - Dashboard de Colas

Bull Board es un dashboard web visual para monitorear y gestionar las colas de BullMQ en tiempo real.

## 🚀 Acceso al Dashboard

### Desarrollo Local

```bash
# 1. Iniciar servidor
npm run dev:full

# 2. Abrir en navegador
http://localhost:3001/admin/queues
```

### Producción (Coolify/Docker)

```bash
https://tu-app.coolify.app/admin/queues
```

## 🎯 Características del Dashboard

### Vista General

El dashboard muestra:

1. **Métricas de la Cola**
   - Total de jobs
   - Jobs waiting (pendientes)
   - Jobs active (en proceso)
   - Jobs completed (completados)
   - Jobs failed (fallidos)

2. **Lista de Jobs**
   - Filtros por estado (pending, active, completed, failed)
   - Búsqueda por jobId
   - Ordenamiento por fecha

3. **Detalles del Job**
   - Click en cualquier job para ver:
     - Data completa del job
     - Progress actual
     - Logs de procesamiento
     - Stacktrace de errores (si falló)
     - Timestamps (creado, procesado, completado)

### Acciones Disponibles

#### Por Job Individual

- **Retry** - Reintentar job fallido
- **Clean** - Eliminar job de la cola
- **Promote** - Mover job al inicio de la cola
- **Get Logs** - Ver logs detallados

#### Por Cola Completa

- **Pause Queue** - Pausar procesamiento de nuevos jobs
- **Resume Queue** - Reanudar cola pausada
- **Empty Queue** - Vaciar todos los jobs pending
- **Clean Completed** - Eliminar jobs completados
- **Clean Failed** - Eliminar jobs fallidos

## 📸 Screenshots de las Vistas

### 1. Vista Principal

```
┌─────────────────────────────────────────────────────┐
│ video-render-queue                                  │
├─────────────────────────────────────────────────────┤
│ Metrics:                                            │
│ ├─ Waiting: 5                                       │
│ ├─ Active: 3                                        │
│ ├─ Completed: 150                                   │
│ └─ Failed: 2                                        │
├─────────────────────────────────────────────────────┤
│ Jobs List:                                          │
│ ┌─────────────────────────────────────────────────┐ │
│ │ video-curitiba-1735... │ active    │ 65%       │ │
│ │ video-saopaulo-1735... │ active    │ 45%       │ │
│ │ video-rio-1735...      │ waiting   │ 0%        │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 2. Detalles del Job

Al hacer click en un job:

```json
{
  "id": "video-curitiba-1735311234567",
  "name": "render-video",
  "data": {
    "city": "Curitiba",
    "weatherData": {
      "temperature": 25,
      "condition": "sunny",
      ...
    },
    "requestedAt": "2025-12-27T15:30:00Z"
  },
  "progress": {
    "stage": "rendering",
    "progress": 65
  },
  "attempts": 1,
  "timestamp": "2025-12-27T15:30:00.123Z",
  "processedOn": "2025-12-27T15:30:05.456Z"
}
```

## 🔐 Seguridad (Producción)

⚠️ **IMPORTANTE:** El dashboard está expuesto sin autenticación por defecto.

### Opción 1: Basic Auth (Recomendado)

Agrega autenticación básica en [server/config/bull-board.ts](server/config/bull-board.ts):

```typescript
import basicAuth from "express-basic-auth";

export function initializeBullBoard() {
  const videoQueue = getVideoRenderQueue();

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [new BullMQAdapter(videoQueue)],
    serverAdapter: serverAdapter,
  });

  // Agregar autenticación básica
  const router = serverAdapter.getRouter();
  router.use(
    basicAuth({
      users: {
        admin: process.env.BULL_BOARD_PASSWORD || "changeMe123"
      },
      challenge: true,
    })
  );

  return serverAdapter;
}
```

Instalar:
```bash
npm install express-basic-auth
npm install --save-dev @types/express-basic-auth
```

Variables de entorno:
```bash
BULL_BOARD_PASSWORD=tu_password_seguro
```

### Opción 2: Restricción por IP (Coolify)

En Coolify, configura firewall rules para permitir solo tu IP:

```yaml
# Solo tu IP puede acceder a /admin/*
allow: 123.456.789.0/24
deny: all
```

### Opción 3: VPN/Tunnel

- Usa Cloudflare Tunnel
- O VPN privada (Tailscale, WireGuard)
- Dashboard solo accesible desde red interna

## 🎨 Personalización

### Cambiar Ruta del Dashboard

En [server/index.ts](server/index.ts):

```typescript
// Cambiar de /admin/queues a otra ruta
app.use("/mi-ruta-secreta/dashboard", bullBoardAdapter.getRouter());
```

### Tema Oscuro/Claro

Bull Board detecta automáticamente el tema del sistema operativo.

## 📊 Casos de Uso

### Monitoreo en Tiempo Real

1. Abrir dashboard en navegador
2. Ver jobs procesándose en vivo
3. Verificar progreso de cada job (0-100%)

### Debugging Jobs Fallidos

1. Filter: "Failed"
2. Click en job fallido
3. Ver stacktrace del error
4. Ver data del job que causó el fallo
5. Click "Retry" para reintentar

### Mantenimiento de Cola

1. Ver jobs "Stalled" (atascados)
2. Clean completed jobs antiguos
3. Retry jobs fallidos en batch
4. Pausar cola para mantenimiento

### Análisis de Performance

1. Ver tiempo promedio de procesamiento
2. Identificar jobs lentos
3. Analizar tasa de éxito/fallo
4. Verificar concurrencia actual

## 🛠️ Comandos Útiles

### Pausar Cola (Emergencia)

```typescript
// En el dashboard: Click "Pause Queue"
// O programáticamente:
const queue = getVideoRenderQueue();
await queue.pause();
```

### Vaciar Cola Completa

```typescript
// Click "Empty Queue" en dashboard
// O:
await queue.drain();
```

### Retry Todos los Fallidos

```typescript
// En dashboard: Filter "Failed" → Select All → Retry
// O:
const failed = await queue.getFailed();
for (const job of failed) {
  await job.retry();
}
```

## 🔍 Filtros y Búsqueda

### Por Estado

- **Waiting** - Jobs en cola esperando
- **Active** - Jobs siendo procesados ahora
- **Completed** - Jobs finalizados exitosamente
- **Failed** - Jobs que fallaron
- **Delayed** - Jobs programados para futuro

### Por Job ID

Buscar job específico:
```
video-curitiba-1735311234567
```

### Por Data

Ver data del job haciendo click en cualquier job de la lista.

## 📈 Métricas Importantes

### Queue Health

- **Waiting < 10** ✅ Cola saludable
- **Waiting 10-50** ⚠️ Carga moderada
- **Waiting > 50** ❌ Sobrecarga, considera escalar workers

### Success Rate

```
Success Rate = Completed / (Completed + Failed) * 100%
```

- **> 95%** ✅ Excelente
- **90-95%** ⚠️ Aceptable
- **< 90%** ❌ Investigar errores

### Processing Time

Ver en detalles del job:
```
Time = finishedOn - processedOn
```

Promedio esperado: 2-5 minutos por video

## 🚨 Troubleshooting

### Dashboard no carga

**Síntoma:** Error 404 o página en blanco

**Solución:**
1. Verificar que servidor está corriendo
2. Verificar ruta correcta: `/admin/queues`
3. Ver logs del servidor:
   ```
   ✅ Bull Board initialized at /admin/queues
   ```

### No aparecen jobs

**Síntoma:** Dashboard vacío

**Solución:**
1. Verificar Redis conectado
2. Enviar un job de prueba
3. Verificar logs del worker

### Jobs stuck en "Active"

**Síntoma:** Jobs activos por >10 minutos

**Solución:**
1. Worker probablemente crasheó
2. Reiniciar worker: `npm run worker`
3. BullMQ auto-detectará y reintentará

## 🎉 Tips Pro

1. **Bookmark el dashboard** para acceso rápido
2. **Monitor en pantalla secundaria** durante deploys
3. **Auto-refresh** - Dashboard actualiza automáticamente cada 5s
4. **Export logs** - Copy/paste stacktrace para debugging
5. **Clean regularmente** - Elimina jobs antiguos para performance

## 📚 Recursos

- [Bull Board Docs](https://github.com/felixmosh/bull-board)
- [BullMQ Docs](https://docs.bullmq.io/)
- [Dashboard Demo](https://bull-board.felixmosh.com/)

---

¡Ahora tienes visibilidad completa de tu sistema de cola! 🚀
