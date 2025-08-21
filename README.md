# 🏗️ Self Inspection System

Sistema completo de inspecciones de seguridad con backend Django, frontend Next.js y aplicación móvil híbrida.

## 🚀 Características

- **Backend**: Django 5.1.6 con GraphQL (Graphene)
- **Frontend**: Next.js 14 con Capacitor para móvil
- **Base de datos**: PostgreSQL en Supabase
- **Procesamiento asíncrono**: Celery + Redis
- **Proxy reverso**: Nginx con SSL
- **Despliegue**: Docker Compose

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx (SSL)   │    │   Frontend      │    │   Backend       │
│   Puerto 80/443 │◄──►│   Next.js       │◄──►│   Django        │
│   Público       │    │   Puerto 3000   │    │   Puerto 8000   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis         │    │   Supabase      │
                       │   Puerto 6379   │    │   PostgreSQL    │
                       └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Celery        │
                       │   Workers       │
                       └─────────────────┘
```

## 📋 Requisitos

- Docker
- Docker Compose
- Certificados SSL para `www.safe.360ingeco.com`
- Base de datos Supabase configurada

## 🚀 Inicio Rápido

### 1. **Clonar el repositorio**

```bash
git clone <tu-repositorio>
cd self-inspection
```

### 2. **Configurar variables de entorno**

```bash
# Copiar el archivo de ejemplo
cp backend/env.example .env

# Editar con tus credenciales de Supabase
nano .env
```

### 3. **Configurar certificados SSL**

```bash
# Crear directorios SSL
mkdir -p ssl/certs ssl/private

# Copiar certificados
cp tu-certificado.crt ssl/certs/www.safe.360ingeco.com.crt
cp tu-clave-privada.key ssl/private/www.safe.360ingeco.com.key
```

### 4. **Desplegar**

```bash
docker-compose up -d --build
```

### 5. **Verificar**

- **Frontend**: https://www.safe.360ingeco.com/
- **GraphQL**: https://www.safe.360ingeco.com/graphql/
- **Admin**: https://www.safe.360ingeco.com/admin/

## 🔧 Configuración

### **Variables de Entorno (.env)**

```bash
# Base de datos Supabase
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_password
DB_HOST=tu-project.supabase.co
DB_PORT=5432

# Django
DEBUG=False
SECRET_KEY=tu_secret_key

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

### **Servicios Docker**

- **nginx**: Proxy reverso con SSL (puertos 80/443)
- **frontend**: Aplicación Next.js (puerto 3000 interno)
- **backend**: API Django (puerto 8000 interno)
- **redis**: Cache y broker para Celery (puerto 6379 interno)
- **celery**: Worker para tareas asíncronas
- **celery-beat**: Programador de tareas

## 📱 Aplicación Móvil

### **Desarrollo**

```bash
cd frontend
npm run build:mobile
npx cap sync
npx cap open android  # o ios
```

### **Build de Producción**

```bash
cd frontend
npm run build:mobile
npx cap build android  # o ios
```

## 🗄️ Base de Datos

### **Supabase**

- PostgreSQL hosted
- Migraciones automáticas con Django
- Backup automático
- SSL incluido

### **Migraciones**

```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

## 🔍 Monitoreo y Logs

### **Ver logs de servicios**

```bash
# Todos los servicios
docker-compose logs

# Servicio específico
docker-compose logs nginx
docker-compose logs backend
docker-compose logs celery
```

### **Estado de servicios**

```bash
docker-compose ps
docker-compose top
```

## 🚀 Despliegue en Producción

### **1. Configurar producción**

```bash
# En .env
DEBUG=False
SECRET_KEY=clave_super_secreta_produccion
```

### **2. Desplegar**

```bash
docker-compose -f docker-compose.yml up -d --build
```

### **3. Verificar SSL**

```bash
curl -I https://www.safe.360ingeco.com/
```

## 🛠️ Comandos Útiles

### **Desarrollo**

```bash
# Reiniciar servicios
docker-compose restart

# Rebuild específico
docker-compose up -d --build backend

# Ver logs en tiempo real
docker-compose logs -f nginx
```

### **Mantenimiento**

```bash
# Parar todo
docker-compose down

# Limpiar volúmenes
docker-compose down -v

# Actualizar imágenes
docker-compose pull
```

## 📁 Estructura del Proyecto

```
self-inspection/
├── backend/                 # Django API
│   ├── backend_self_inspection/
│   ├── core/               # App principal
│   ├── user/               # Gestión de usuarios
│   ├── inspection/         # Inspecciones
│   ├── poll/               # Encuestas
│   └── requirements.txt
├── frontend/               # Next.js + Capacitor
│   ├── src/
│   ├── android/            # Android native
│   ├── ios/                # iOS native
│   └── package.json
├── nginx/                  # Configuración Nginx
├── ssl/                    # Certificados SSL
├── docker-compose.yml      # Orquestación Docker
└── README.md
```

## 🔐 Seguridad

- **SSL/TLS**: Certificados válidos para producción
- **Variables de entorno**: Credenciales separadas del código
- **Contenedores**: Servicios aislados
- **Base de datos**: Conexión externa segura (Supabase)

## 🆘 Solución de Problemas

### **Error de conexión a Supabase**

- Verificar credenciales en `.env`
- Comprobar conectividad de red
- Verificar que Supabase esté activo

### **Error de certificados SSL**

- Verificar que los archivos estén en `ssl/certs/` y `ssl/private/`
- Comprobar permisos de archivos
- Verificar nombres de archivos coincidan con `nginx/default.conf`

### **Servicios no inician**

- Verificar logs: `docker-compose logs`
- Comprobar variables de entorno
- Verificar puertos disponibles

## 📞 Soporte

Para soporte técnico o preguntas sobre el despliegue, consulta la documentación específica en:

- `backend/README_DOCKER.md` - Configuración Docker detallada
- `ssl/README.md` - Configuración SSL

## 📄 Licencia

Este proyecto está bajo la licencia especificada en el archivo LICENSE.
