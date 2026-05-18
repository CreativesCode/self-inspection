# 🌐 Integración con Ionic Appflow

Esta guía explica cómo configurar el sistema de versionado automático para que funcione con [Ionic Appflow Dashboard](https://dashboard.ionicframework.com/).

## 🔧 Configuración en Appflow

### 1. **Configurar el Build Script**

En el dashboard de Ionic Appflow:

1. Ve a tu proyecto
2. Selecciona **"Builds"** → **"Build Settings"**
3. En **"Build Script"**, usa:
   ```bash
   npm run build:appflow
   ```

### 2. **Variables de Entorno**

Agrega estas variables de entorno en Appflow:

- `APPFLOW_BUILD=true`
- `NODE_VERSION=18`
- `NPM_VERSION=latest`

### 3. **Configuración del Repositorio**

Asegúrate de que estos archivos estén en tu repositorio Git:

- ✅ `version.config.json`
- ✅ `scripts/version-manager.js`
- ✅ `appflow-build.sh`
- ✅ `.appflow.yml`

## 🔄 Flujo Automático en Appflow

### **Cada vez que se ejecute un build en Appflow:**

1. **Pre-build**: Se ejecuta `npm ci` y verifica el estado de versiones
2. **Build**: Se ejecuta `npm run build:appflow` que:
   - Auto-incrementa la versión (1.5.0 → 1.5.1)
   - Actualiza todos los archivos (Android, iOS, package.json)
   - Realiza el build de Next.js
   - Sincroniza con Capacitor
3. **Post-build**: Muestra el estado final de versiones

### **Resultado:**
- ✅ La versión se incrementa automáticamente
- ✅ Los archivos se actualizan correctamente
- ✅ La app se compila con la nueva versión

## 📊 Monitoreo de Versiones

### **Ver el estado actual:**
```bash
npm run version:status
```

### **Logs en Appflow:**
Los logs de Appflow mostrarán:
```
🚀 Iniciando build en Ionic Appflow...
📊 Estado actual de versiones:
🔢 Versión actual: 1.5.0
🔄 Incrementando versión automáticamente...
✅ Versión establecida a: 1.5.1
🔨 Realizando build de Next.js...
📱 Sincronizando con Capacitor...
✅ Build completado en Appflow!
```

## 🛠️ Configuración Manual (si es necesario)

### **Si necesitas cambiar la versión base:**
```bash
npm run version:set -- 1.6.0
git add .
git commit -m "chore: update base version to 1.6.0"
git push
```

### **Si necesitas desactivar el auto-incremento:**
```bash
npm run version:toggle-auto
git add .
git commit -m "chore: disable auto-increment"
git push
```

## 🔍 Verificación

### **Para verificar que funciona:**

1. **Haz un build en Appflow**
2. **Verifica en los logs** que aparezca:
   - "🔄 Incrementando versión automáticamente..."
   - "✅ Versión establecida a: X.X.X"
3. **Descarga la app** y verifica la versión en:
   - Android: Settings → Apps → Self Inspection
   - iOS: Settings → General → About → Self Inspection

## 🚨 Solución de Problemas

### **Error: "No se encontró configuración de versiones"**
- Asegúrate de que `version.config.json` esté en el repositorio
- Verifica que el archivo tenga permisos de lectura

### **Error: "Script no encontrado"**
- Verifica que `appflow-build.sh` tenga permisos de ejecución
- Asegúrate de que esté en la raíz del proyecto frontend

### **Versiones no se actualizan**
- Verifica que `autoIncrement: true` en `version.config.json`
- Revisa los logs de Appflow para errores

## 📈 Flujo de Trabajo Recomendado

### **Para desarrollo:**
1. Trabaja localmente
2. Haz commits normales
3. Push a la rama principal

### **Para releases:**
1. **Build automático en Appflow** (incrementa versión automáticamente)
2. **Descarga la app** desde Appflow
3. **Distribuye** a través de Google Play / App Store

### **Para cambios de versión manual:**
1. Cambia la versión localmente: `npm run version:set -- 2.0.0`
2. Commit y push: `git add . && git commit -m "chore: bump to v2.0.0" && git push`
3. Haz un build en Appflow

---

💡 **Tip**: El sistema está diseñado para ser completamente automático. Solo necesitas hacer push de tu código y Appflow se encargará del resto.
