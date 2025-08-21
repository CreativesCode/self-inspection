# 🔐 Configuración SSL con Application Load Balancer

## 📋 **Configuración Actualizada**

Este proyecto ahora usa un **Application Load Balancer (ALB)** de AWS para manejar SSL/TLS, lo que simplifica la configuración y mejora la seguridad.

## 🏗️ **Arquitectura SSL**

```
Internet → ALB (HTTPS/443) → EC2 Instance (HTTP/80) → Nginx → Aplicaciones
```

### **Ventajas:**

- ✅ **SSL manejado por AWS** (más seguro)
- ✅ **Renovación automática** de certificados
- ✅ **Mejor rendimiento** (SSL termination en ALB)
- ✅ **Configuración más simple**
- ✅ **No necesitas manejar certificados localmente**

## 🚀 **Configuración del ALB**

### **1. Crear Application Load Balancer:**

- **Tipo**: Application Load Balancer
- **Scheme**: Internet-facing
- **VPC**: La misma de tu instancia EC2
- **Subnets**: Al menos 2 zonas de disponibilidad

### **2. Configurar Target Group:**

- **Target Type**: Instances
- **Protocol**: HTTP
- **Port**: 80
- **Health Check Path**: `/health/`
- **Health Check Port**: 80

### **3. Configurar Listener:**

- **Port**: 443
- **Protocol**: HTTPS
- **Default Action**: Forward to Target Group
- **Certificate**: Tu certificado ACM existente

### **4. Configurar Listener HTTP (Opcional):**

- **Port**: 80
- **Protocol**: HTTP
- **Default Action**: Redirect to 443

## 🔧 **Configuración de Security Groups**

### **ALB Security Group:**

```
Inbound Rules:
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0

Outbound Rules:
- All traffic: 0.0.0.0/0
```

### **EC2 Security Group:**

```
Inbound Rules:
- HTTP (80): Solo desde ALB Security Group
- SSH (22): Solo tu IP

Outbound Rules:
- All traffic: 0.0.0.0/0
```

## 📝 **Variables de Entorno**

Ya no necesitas configurar certificados SSL en tu `.env`:

```bash
# Solo necesitas estas variables básicas
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_supabase_db_password
DB_HOST=tu-project-ref.supabase.co
DB_PORT=5432

DEBUG=False
SECRET_KEY=tu_secret_key
```

## 🚀 **Despliegue**

### **1. Crear ALB en AWS Console**

### **2. Configurar Target Group con tu instancia EC2**

### **3. Configurar Listener HTTPS con tu certificado ACM**

### **4. Desplegar tu aplicación:**

```bash
docker-compose up -d --build
```

## 🔍 **Verificación**

### **Desde tu máquina local:**

```bash
# Verificar que el ALB responde
curl -I https://www.safe.360ingeco.com/

# Verificar health check
curl -I http://tu-ip-ec2/health/
```

### **Logs del ALB:**

- **Access Logs**: Habilitar en configuración del ALB
- **CloudWatch**: Monitorear métricas de rendimiento

## ⚠️ **Notas Importantes**

- **No necesitas** archivos de certificados SSL locales
- **No necesitas** configurar puerto 443 en Docker
- **El ALB** maneja automáticamente la redirección HTTP → HTTPS
- **Tu aplicación** solo necesita responder en puerto 80

## 🆘 **Solución de Problemas**

### **ALB no puede conectar a EC2:**

- Verificar Security Groups
- Verificar que EC2 esté en la VPC correcta
- Verificar health check en `/health/`

### **HTTPS no funciona:**

- Verificar que el certificado ACM esté validado
- Verificar configuración del Listener 443
- Verificar que el Target Group esté configurado correctamente
