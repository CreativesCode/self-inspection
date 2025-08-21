# 🔐 Configuración de Certificados SSL

## 📁 Estructura de Directorios

```
ssl/
├── certs/
│   └── www.safe.360ingeco.com.crt    # Certificado público
└── private/
    └── www.safe.360ingeco.com.key    # Clave privada
```

## 🚀 Pasos para Configurar

### 1. **Descargar Certificados desde ACM**

Si usas AWS Certificate Manager:

```bash
# Descargar el certificado (.pem)
aws acm export-certificate \
  --certificate-arn arn:aws:acm:region:account:certificate/certificate-id \
  --passphrase password \
  --output text > www.safe.360ingeco.com.pem

# Extraer certificado y clave
openssl pkcs12 -in www.safe.360ingeco.com.pem -out www.safe.360ingeco.com.p12 -nodes
openssl pkcs12 -in www.safe.360ingeco.com.p12 -out www.safe.360ingeco.com.crt -clcerts -nokeys
openssl pkcs12 -in www.safe.360ingeco.com.p12 -out www.safe.360ingeco.com.key -nocerts -nodes
```

### 2. **Copiar Archivos**

```bash
# Copiar certificado
cp www.safe.360ingeco.com.crt ssl/certs/

# Copiar clave privada
cp www.safe.360ingeco.com.key ssl/private/
```

### 3. **Permisos de Seguridad**

```bash
# Hacer la clave privada solo legible por root
chmod 600 ssl/private/www.safe.360ingeco.com.key

# Certificado público legible por todos
chmod 644 ssl/certs/www.safe.360ingeco.com.crt
```

## ⚠️ **Importante**

- **NO** subir la clave privada (.key) a Git
- **SÍ** subir el certificado (.crt) a Git
- Agregar `ssl/private/*.key` a `.gitignore`

## 🔍 **Verificar Configuración**

```bash
# Verificar que Nginx puede leer los archivos
docker-compose exec nginx ls -la /etc/ssl/certs/
docker-compose exec nginx ls -la /etc/ssl/private/
```
