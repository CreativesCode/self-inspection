# AWS Application Load Balancer Configuration

Este documento explica cómo configurar el ALB para funcionar correctamente con el frontend y backend del proyecto Self Inspection.

## Arquitectura de URLs

### Frontend (SPA)
- **Path Pattern**: `/frontend*` o `/` (default)
- **Target Group**: `self-inspection-tg` (Puerto 80)
- **Health Check**: `GET /`

### Backend (Django API)
- **Path Pattern**: `/backend*`
- **Target Group**: `self-inspection-8000` (Puerto 8000)  
- **Health Check**: `GET /backend/health/`

## Configuración de Listener Rules

### Rule 1: Backend API (Prioridad 1)
```
Conditions:
  - Path: /backend*

Actions:
  - Forward to: self-inspection-8000 (100%)
  - Target group stickiness: Off
```

### Rule 2: Frontend SPA (Prioridad 2)
```
Conditions:
  - Path: /frontend*

Actions:
  - Forward to: self-inspection-tg (100%)
  - Target group stickiness: Off
```

### Rule 3: Default (Last)
```
Conditions:
  - If no other rule applies

Actions:
  - Forward to: self-inspection-tg (100%)
  - Target group stickiness: Off
```

## URLs Resultantes

### Producción (ALB)
- **Frontend**: `https://www.safe.360ingeco.com/`
- **Backend API**: `https://www.safe.360ingeco.com/backend/`
- **GraphQL**: `https://www.safe.360ingeco.com/backend/graphql/`
- **Admin**: `https://www.safe.360ingeco.com/backend/admin/`

### Desarrollo Local
- **Frontend**: `http://localhost/`
- **Backend API**: `http://localhost:8000/`
- **GraphQL**: `http://localhost:8000/graphql/`
- **Admin**: `http://localhost:8000/admin/`

## Health Checks

### Frontend Health Check
```
Protocol: HTTP
Port: 80
Path: /
Success codes: 200
Healthy threshold: 2
Unhealthy threshold: 3
Timeout: 5 seconds
Interval: 30 seconds
```

### Backend Health Check  
```
Protocol: HTTP
Port: 8000
Path: /backend/health/
Success codes: 200
Healthy threshold: 2
Unhealthy threshold: 3
Timeout: 5 seconds
Interval: 30 seconds
```

## Target Groups

### Frontend Target Group: `self-inspection-tg`
- **Port**: 80
- **Protocol**: HTTP
- **Target Type**: IP
- **VPC**: Your VPC
- **Health Check**: `GET /`

### Backend Target Group: `self-inspection-8000`
- **Port**: 8000
- **Protocol**: HTTP
- **Target Type**: IP  
- **VPC**: Your VPC
- **Health Check**: `GET /backend/health/`

## CORS Configuration

El backend está configurado para aceptar requests desde:
- `https://www.safe.360ingeco.com`
- `https://safe.360ingeco.com`
- Cualquier origen en modo desarrollo (`DEBUG=True`)

## SSL/TLS

- **Certificate**: AWS Certificate Manager (ACM)
- **Listener**: HTTPS (443) → HTTP (80/8000)
- **Security Policy**: ELBSecurityPolicy-TLS-1-2-2019-07
- **Redirect**: HTTP (80) → HTTPS (443)

## Testing

### Backend Testing
```bash
# Health check
curl https://www.safe.360ingeco.com/backend/health/

# GraphQL
curl -X POST https://www.safe.360ingeco.com/backend/graphql/ \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}'

# Admin (should redirect to login)
curl https://www.safe.360ingeco.com/backend/admin/
```

### Frontend Testing
```bash
# Main page
curl https://www.safe.360ingeco.com/

# SPA route (should return index.html)
curl https://www.safe.360ingeco.com/login/
```

## Troubleshooting

### 404 Not Found en /backend/
1. Verificar que las rutas estén configuradas en `urls.py`
2. Comprobar que el target group esté healthy
3. Revisar los logs del contenedor backend

### CORS Errors
1. Verificar `CORS_ALLOWED_ORIGINS` en settings.py
2. Comprobar que el dominio ALB esté incluido
3. Revisar headers en browser dev tools

### Health Check Failures
1. Verificar que los endpoints `/` y `/backend/health/` respondan 200
2. Comprobar timeout y interval settings
3. Revisar security groups y NACLs
