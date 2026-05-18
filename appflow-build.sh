#!/bin/bash

# Script de build para Ionic Appflow
# Este script se ejecuta automáticamente en Appflow

echo "🚀 Iniciando build en Ionic Appflow..."

# Verificar si existe la configuración de versiones
if [ ! -f "version.config.json" ]; then
    echo "⚠️  No se encontró configuración de versiones. Creando configuración inicial..."
    npm run version:set -- 1.5.0
fi

# Mostrar estado actual
echo "📊 Estado actual de versiones:"
npm run version:status

# Auto-incrementar versión para cada build
echo "🔄 Incrementando versión automáticamente..."
npm run version:auto

# Realizar build de Next.js
echo "🔨 Realizando build de Next.js..."
npm run build

# Sincronizar con Capacitor
echo "📱 Sincronizando con Capacitor..."
npx cap sync

# Mostrar estado final
echo "✅ Build completado en Appflow!"
echo "📊 Estado final de versiones:"
npm run version:status

# Commit de los cambios de versión (opcional)
echo "💾 Guardando cambios de versión..."
git add version.config.json package.json android/app/build.gradle ios/App/App.xcodeproj/project.pbxproj
git commit -m "chore: auto-increment version for Appflow build" || true

echo "🎉 Build listo para compilación!"
