# 📱 Sistema de Gestión de Versiones - Self Inspection App

Este sistema permite gestionar las versiones de la aplicación móvil de manera automática y controlada.

## 🚀 Configuración Inicial

### Establecer versión base (1.5.0)
```bash
npm run version:set -- 1.5.0
```

## 📋 Comandos Disponibles

### Gestión de Versiones
```bash
# Establecer versión específica
npm run version:set -- 1.5.0

# Incrementar patch (1.5.0 → 1.5.1)
npm run version:patch

# Incrementar minor (1.5.0 → 1.6.0)  
npm run version:minor

# Incrementar major (1.5.0 → 2.0.0)
npm run version:major

# Auto-incrementar patch
npm run version:auto

# Mostrar estado actual
npm run version:status

# Activar/desactivar auto-incremento
npm run version:toggle-auto
```

### Build con Versionado
```bash
# Build normal (sin cambio de versión)
npm run build:mobile

# Build con auto-incremento de versión
npm run build:mobile:auto

# Build interactivo (pregunta si incrementar)
node scripts/build-with-version.js
```

## 🔧 Flujo de Trabajo Recomendado

### Para Desarrollo Diario
1. **Cambios menores (bugs, mejoras)**: Usar `npm run version:patch`
2. **Nuevas características**: Usar `npm run version:minor`
3. **Cambios importantes**: Usar `npm run version:major`

### Para Builds Automáticos
```bash
# Opción 1: Build con auto-incremento
npm run build:mobile:auto

# Opción 2: Build interactivo
node scripts/build-with-version.js
```

## 📊 Estructura de Versionado

### Formato de Versión
- **MAJOR.MINOR.PATCH** (ej: 1.5.0)
- **MAJOR**: Cambios importantes que rompen compatibilidad
- **MINOR**: Nuevas características compatibles hacia atrás
- **PATCH**: Correcciones de bugs

### Version Code (Android)
- **Fórmula**: `MAJOR * 10000 + MINOR * 100 + PATCH`
- **Ejemplo**: 1.5.0 = 15000, 1.5.1 = 15001

## 📁 Archivos Modificados Automáticamente

El sistema actualiza automáticamente:

1. **`package.json`** - Versión del proyecto
2. **`android/app/build.gradle`** - versionName y versionCode
3. **`ios/App/App.xcodeproj/project.pbxproj`** - MARKETING_VERSION y CURRENT_PROJECT_VERSION
4. **`version.config.json`** - Configuración del sistema

## ⚙️ Configuración Avanzada

### Archivo `version.config.json`
```json
{
  "version": "1.5.0",
  "autoIncrement": true,
  "lastBuild": "2024-01-15T10:30:00.000Z",
  "buildCount": 5,
  "versionCode": 15000
}
```

### Variables de Configuración
- **`version`**: Versión actual de la app
- **`autoIncrement`**: Si se incrementa automáticamente en cada build
- **`lastBuild`**: Timestamp del último build
- **`buildCount`**: Contador de builds realizados
- **`versionCode`**: Código de versión para Android

## 🔄 Flujo de Versionado Automático

1. **Desarrollo**: Haces cambios en el código
2. **Versionado**: Ejecutas `npm run version:patch` (o minor/major)
3. **Build**: Ejecutas `npm run build:mobile:auto`
4. **Sincronización**: El sistema actualiza todos los archivos necesarios
5. **Compilación**: Abres Android Studio / Xcode para compilar

## 🛠️ Solución de Problemas

### Error: "Formato de versión inválido"
- Asegúrate de usar el formato correcto: `MAJOR.MINOR.PATCH`
- Ejemplo válido: `1.5.0`
- Ejemplo inválido: `1.5` o `v1.5.0`

### Error: "No se encontró configuración"
- Ejecuta: `npm run version:set -- 1.5.0`
- Esto creará el archivo de configuración inicial

### Versiones desincronizadas
- Ejecuta: `npm run version:status` para verificar
- Si hay problemas, ejecuta: `npm run version:set -- [VERSION]`

## 📈 Ejemplos de Uso

### Escenario 1: Nueva versión 1.5.0
```bash
npm run version:set -- 1.5.0
npm run build:mobile
```

### Escenario 2: Corrección de bug
```bash
npm run version:patch  # 1.5.0 → 1.5.1
npm run build:mobile:auto
```

### Escenario 3: Nueva característica
```bash
npm run version:minor  # 1.5.0 → 1.6.0
npm run build:mobile:auto
```

### Escenario 4: Cambio importante
```bash
npm run version:major  # 1.5.0 → 2.0.0
npm run build:mobile:auto
```

## 🎯 Mejores Prácticas

1. **Siempre verificar** la versión antes de hacer build: `npm run version:status`
2. **Usar versionado semántico** correctamente
3. **Documentar cambios** importantes en cada versión
4. **Probar** la app después de cada cambio de versión
5. **Mantener sincronizados** todos los archivos de configuración

---

💡 **Tip**: Usa `npm run version:status` frecuentemente para mantenerte al tanto del estado actual de las versiones.
