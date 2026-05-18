# 📷 Configuración de Permisos de Cámara

Este documento explica la configuración de permisos necesarios para el funcionamiento de la cámara en las aplicaciones móviles de Self Inspection.

## 📱 Android

### Permisos Agregados en `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Permisos de cámara -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

<!-- Features de cámara -->
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
<uses-feature android:name="android.hardware.camera.front" android:required="false" />
```

### ¿Qué hace cada permiso?

- **`CAMERA`**: Permite acceso a la cámara del dispositivo
- **`WRITE_EXTERNAL_STORAGE`**: Permite guardar fotos en almacenamiento externo
- **`READ_EXTERNAL_STORAGE`**: Permite leer archivos de almacenamiento externo
- **`hardware.camera`**: Declara que la app puede usar cámara (pero no es obligatorio)
- **`hardware.camera.autofocus`**: Soporte para enfoque automático
- **`hardware.camera.front`**: Soporte para cámara frontal

## 🍎 iOS

### Permisos Agregados en `ios/App/App/Info.plist`:

```xml
<!-- Permisos de cámara -->
<key>NSCameraUsageDescription</key>
<string>Esta aplicación necesita acceso a la cámara para tomar fotos durante las inspecciones y documentar observaciones.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Esta aplicación necesita acceso a tu biblioteca de fotos para seleccionar imágenes y adjuntarlas a las inspecciones.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Esta aplicación necesita permiso para guardar fotos tomadas durante las inspecciones en tu biblioteca de fotos.</string>
```

### ¿Qué hace cada permiso?

- **`NSCameraUsageDescription`**: Mensaje que aparece cuando se solicita acceso a la cámara
- **`NSPhotoLibraryUsageDescription`**: Mensaje para acceso de lectura a la biblioteca de fotos
- **`NSPhotoLibraryAddUsageDescription`**: Mensaje para guardar fotos en la biblioteca

## ⚙️ Capacitor

### Configuración en `capacitor.config.ts`:

```typescript
Camera: {
  permissions: {
    camera: "always",
    photos: "always",
  },
},
```

## 🔧 Proceso de Construcción

### Para Android:

```bash
npx cap build android
npx cap copy android
npx cap sync android
```

### Para iOS:

```bash
npx cap build ios
npx cap copy ios
npx cap sync ios
```

## 📋 Checklist de Verificación

Antes de publicar la aplicación, verificar:

- [ ] Los permisos están en AndroidManifest.xml
- [ ] Los permisos están en Info.plist
- [ ] La configuración de Capacitor incluye Camera
- [ ] Los mensajes de permiso son claros y en español
- [ ] La funcionalidad de cámara funciona en dispositivos reales
- [ ] Se pueden tomar fotos y subir archivos
- [ ] Las fotos se guardan correctamente

## 🛠️ Solución de Problemas

### Android:

- Si la cámara no funciona, verificar que todos los permisos estén en AndroidManifest.xml
- En Android 6+, los permisos se solicitan en tiempo de ejecución

### iOS:

- Si la cámara no funciona, verificar que NSCameraUsageDescription esté en Info.plist
- iOS requiere mensajes descriptivos para todos los permisos

### General:

- Ejecutar `npx cap sync` después de cambios en permisos
- Probar en dispositivos reales, no solo simuladores
- Verificar que los mensajes de permiso aparezcan correctamente

## 📚 Referencias

- [Capacitor Camera Plugin](https://capacitorjs.com/docs/apis/camera)
- [Android Camera Permissions](https://developer.android.com/training/camera)
- [iOS Camera Permissions](https://developer.apple.com/documentation/avfoundation/cameras_and_media_capture)
