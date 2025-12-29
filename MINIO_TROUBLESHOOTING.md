# MinIO SignatureDoesNotMatch Troubleshooting

## Problem
Getting `SignatureDoesNotMatch` error when uploading videos to MinIO from Docker container.

## Root Cause
This error occurs when the MinIO client credentials (Access Key or Secret Key) don't match the server's expected values. Common causes:
1. Wrong credentials
2. Whitespace in credentials (leading/trailing spaces)
3. Environment variables not passed correctly to Docker
4. Credentials changed between local test and Docker deployment

## Solution Steps

### 1. Verify Local Connection Works
```bash
npm run test:minio
```
This should pass if your `.env` file has correct credentials.

### 2. Check .env File for Issues
```bash
npm run check:env
```
This checks for:
- Missing variables
- Trailing/leading spaces
- Invalid characters in credentials

### 3. Rebuild Docker Image
After fixing credentials, rebuild the Docker image:
```bash
npm run docker:build
```

### 4. Test Docker Container Locally
Run the container with environment variables:
```bash
npm run docker:run
```

Or with docker-compose:
```bash
docker-compose up -d
```

### 5. Debug Inside Docker Container
If the error persists, check what the container is receiving:

```bash
# For docker run
docker exec -it <container_id> tsx /app/scripts/debug-docker-env.ts

# For docker-compose
docker-compose exec weather-video-worker tsx /app/scripts/debug-docker-env.ts
```

This will show:
- All MinIO environment variables
- Credential lengths
- Whether whitespace is present
- Attempt a live connection

### 6. Compare Logs
Compare the output from:
- Local test: `npm run test:minio`
- Docker test: `docker-compose logs weather-video-worker`

Look for differences in:
- Access Key length (should be 20)
- Secret Key length (should be 40)
- Endpoint format

## Common Issues and Fixes

### Issue: Environment variables not set in Docker
**Symptom**: Docker logs show "NOT SET" for MinIO variables

**Fix**: Ensure docker-compose.yaml or docker run command passes all variables:
```yaml
environment:
  - MINIO_ENDPOINT=${MINIO_ENDPOINT}
  - MINIO_PORT=${MINIO_PORT}
  - MINIO_USE_SSL=${MINIO_USE_SSL}
  - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
  - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
  - MINIO_BUCKET=${MINIO_BUCKET}
```

### Issue: Credentials have spaces
**Symptom**: Length mismatch or "SignatureDoesNotMatch"

**Fix**: Edit `.env` and remove any spaces:
```bash
# BAD (has space after key)
MINIO_ACCESS_KEY=TssBYIOcUcA1Tze6U2Z4

# GOOD (no space)
MINIO_ACCESS_KEY=TssBYIOcUcA1Tze6U2Z4
```

The code now automatically trims whitespace with `sanitizeCredential()`, but it's better to fix the source.

### Issue: Credentials work locally but not in Docker
**Symptom**: `npm run test:minio` passes, Docker fails

**Fix**: This usually means Docker isn't receiving the variables. Check:
1. `.env` file exists in project root
2. `docker-compose.yaml` references `${VARIABLE}` syntax
3. For `docker run`, use `--env-file .env` flag

### Issue: Wrong credentials in production
**Symptom**: Works in staging, fails in production

**Fix**: Production (Coolify) uses its own environment variables, not `.env`:
1. Go to Coolify dashboard
2. Check Environment Variables section
3. Verify each MinIO variable matches your MinIO server
4. Redeploy after updating

## Expected Values

Your MinIO configuration should look like this:

```
Endpoint: s3.guria.lat
Port: 443
SSL: true
Access Key: TssB**************** (length: 20)
Secret Key: ZC2T************************************ (length: 40)
Bucket: weather
```

## Testing Checklist

- [ ] `npm run test:minio` passes locally
- [ ] `npm run check:env` shows no issues
- [ ] Docker image rebuilt after credential changes
- [ ] Environment variables visible in Docker logs at startup
- [ ] Credential lengths match (Access: 20, Secret: 40)
- [ ] Endpoint doesn't include `http://` or `https://`
- [ ] Port is correct (443 for SSL, 9000 for non-SSL)
- [ ] `MINIO_USE_SSL` is "true" (string, not boolean)

## Still Having Issues?

1. Check MinIO server logs for more details
2. Verify MinIO server credentials haven't changed
3. Test direct connection with `aws s3` CLI or `mc` (MinIO client)
4. Ensure network connectivity from Docker to MinIO server
5. Check if MinIO server requires specific region
