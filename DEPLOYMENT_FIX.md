# Solución al Error de Signature en Producción

## El Problema

El error `SignatureDoesNotMatch` ocurre en producción (Coolify) porque:
1. Las credenciales de MinIO tienen espacios o caracteres extra
2. Las variables de entorno no se están pasando correctamente
3. El contenedor está usando credenciales viejas en cache

## La Solución

### 1. Código Actualizado ✅
Ya se agregó sanitización automática de credenciales en `server/config/minio.ts`:
- Función `sanitizeCredential()` que hace `.trim()` automáticamente
- Logging mejorado que muestra longitudes de credenciales

### 2. Hacer Commit y Push

```bash
git add .
git commit -m "Fix MinIO SignatureDoesNotMatch error by sanitizing credentials"
git push
```

### 3. Verificar Variables en Coolify

**IMPORTANTE**: Ve a tu dashboard de Coolify y verifica:

1. **Environment Variables** para el servicio weather-video:
   ```
   MINIO_ENDPOINT=s3.guria.lat
   MINIO_PORT=443
   MINIO_USE_SSL=true
   MINIO_ACCESS_KEY=TssBYIOcUcA1Tze6U2Z4
   MINIO_SECRET_KEY=ZC2T10kS2zTC9G2ZNPMw9Swia6EVZv0URghFnWqG
   MINIO_BUCKET=weather
   ```

2. **Verificar que NO haya**:
   - Espacios al inicio o final de los valores
   - Comillas extras ("" o '')
   - Caracteres de nueva línea

3. **Copiar las credenciales directamente** desde tu `.env` local si es necesario

### 4. Redesplegar

En Coolify:
1. Click en "Redeploy"
2. Espera a que el build termine
3. Verifica los logs del worker

### 5. Verificar Logs

Busca en los logs del worker:
```
🔧 MinIO Client Configuration:
   Endpoint: s3.guria.lat
   Port: 443
   SSL: true
   Access Key: TssB**************** (length: 20)
   Secret Key: ZC2T************************************ (length: 40)
```

**Longitudes correctas:**
- Access Key: 20 caracteres
- Secret Key: 40 caracteres

Si ves longitudes diferentes (ej: 21 o 41), hay un espacio extra.

### 6. Test Final

Después del redespliegue:
1. Genera un video de prueba
2. Verifica que se suba correctamente a MinIO
3. Revisa los logs para confirmar `UPLOAD SUCCESS`

## Si el Error Persiste

Si después del redespliegue el error continúa:

1. **Verifica las credenciales en MinIO**:
   - Accede a tu MinIO console
   - Ve a Access Keys
   - Confirma que las keys en Coolify coinciden exactamente

2. **Regenera las credenciales**:
   - Crea un nuevo Access Key en MinIO
   - Actualiza las variables en Coolify
   - Redeploy

3. **Verifica la conectividad**:
   - Desde Coolify, verifica que el contenedor puede alcanzar `s3.guria.lat:443`
   - Verifica que no hay firewall bloqueando

## Comandos Útiles

Si tienes acceso SSH al servidor de Coolify:

```bash
# Ver logs del worker
docker logs -f <container-name>

# Ejecutar test de MinIO dentro del contenedor
docker exec -it <container-name> npm run debug:docker-env

# Ver variables de entorno dentro del contenedor
docker exec -it <container-name> env | grep MINIO
```

## Checklist de Verificación

- [ ] Código actualizado con `sanitizeCredential()`
- [ ] Commit y push realizados
- [ ] Variables verificadas en Coolify (sin espacios)
- [ ] Redespliegue completado
- [ ] Logs muestran longitudes correctas (20 y 40)
- [ ] Test de upload exitoso
