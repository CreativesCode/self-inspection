# Testing Instructions - Backend-Frontend Connection

This document provides step-by-step instructions to test that the frontend can successfully connect to the backend API.

## Prerequisites

- Docker and Docker Compose installed
- Ports 80 and 8000 available on your machine
- All services configured and ready

## Step 1: Start All Services

```bash
# From the project root directory
docker-compose up -d

# Verify all services are running
docker-compose ps
```

Expected output should show all services as "Up":

- backend (port 8000)
- frontend (port 80)
- redis
- celery
- celery-beat

## Step 2: Test Backend API Access

### Test from Host Machine

```bash
# Test GraphQL endpoint
curl http://localhost:8000/graphql/

# Expected response: "Must provide query string." or similar
# This confirms the backend is accessible from the host
```

### Test from Frontend Container

```bash
# Enter the frontend container
docker-compose exec frontend sh

# Test internal network access
wget -qO- http://backend:8000/graphql/

# Exit container
exit
```

## Step 3: Configure Frontend Environment

```bash
# Navigate to frontend directory
cd frontend

# Run the environment setup script
npm run setup:env

# This creates a .env file with the correct API URLs
```

## Step 4: Test Frontend Build

```bash
# Test the build process
npm run test:build

# Expected output: Build successful with output in /out directory
```

## Step 5: Test Docker Build

```bash
# Build the frontend Docker image
docker build -t next-spa .

# Expected output: Successfully built image
```

## Step 6: Test Complete Setup

### Stop and Restart Services

```bash
# Stop all services
docker-compose down

# Start fresh
docker-compose up -d
```

### Test Frontend Access

1. Open browser and go to `http://localhost`
2. Check browser console for any errors
3. Try to navigate to different routes
4. Check if GraphQL requests work

### Test API from Browser

1. Open browser developer tools
2. Go to Network tab
3. Navigate to a page that makes API calls
4. Verify GraphQL requests are successful

## Step 7: Verify CORS Configuration

### Test CORS Headers

```bash
# Test CORS preflight request
curl -X OPTIONS -H "Origin: http://localhost" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  http://localhost:8000/graphql/

# Expected: 204 response with CORS headers
```

## Troubleshooting

### Backend Not Accessible

```bash
# Check backend logs
docker-compose logs backend

# Check if port 8000 is bound
netstat -tlnp | grep 8000

# Restart backend service
docker-compose restart backend
```

### Frontend Build Fails

```bash
# Clear build cache
rm -rf frontend/.next frontend/out

# Reinstall dependencies
cd frontend && npm ci

# Try build again
npm run build
```

### CORS Issues

```bash
# Check Django CORS settings
docker-compose exec backend python manage.py shell

# In Django shell:
from django.conf import settings
print(settings.CORS_ALLOWED_ORIGINS)
print(settings.CORS_ALLOW_ALL_ORIGINS)

# Exit shell
exit()
```

### Network Issues

```bash
# Check Docker network
docker network ls
docker network inspect self-inspection_default

# Verify containers can communicate
docker-compose exec frontend ping backend
```

## Success Criteria

✅ Backend accessible on `http://51.48.247.218:8000`  
✅ Frontend accessible on `http://51.48.247.218`  
✅ GraphQL requests work from browser  
✅ CORS headers are properly set  
✅ SPA routing works correctly  
✅ No console errors in browser

## Next Steps

Once testing is successful:

1. Update production environment variables
2. Deploy to your target environment
3. Configure SSL/HTTPS
4. Set up monitoring and logging
