#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");

console.log("🚀 Iniciando build con versionado automático...\n");

try {
  // Verificar si existe la configuración de versiones
  if (!fs.existsSync("version.config.json")) {
    console.log("⚠️  No se encontró configuración de versiones. Creando configuración inicial...");
    execSync("npm run version:set -- 1.5.0", { stdio: "inherit" });
  }

  // Mostrar estado actual
  console.log("📊 Estado actual de versiones:");
  execSync("npm run version:status", { stdio: "inherit" });

  // Preguntar si se desea incrementar la versión
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise((resolve) => {
    rl.question("\n¿Desea incrementar la versión automáticamente? (y/n): ", resolve);
  });

  rl.close();

  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log("\n🔄 Incrementando versión...");
    execSync("npm run version:auto", { stdio: "inherit" });
  } else {
    console.log("\n⏭️  Saltando incremento de versión...");
  }

  // Realizar build
  console.log("\n🔨 Iniciando build de Next.js...");
  execSync("npm run build", { stdio: "inherit" });

  // Sincronizar con Capacitor
  console.log("\n📱 Sincronizando con Capacitor...");
  execSync("npx cap sync", { stdio: "inherit" });

  // Mostrar estado final
  console.log("\n✅ Build completado exitosamente!");
  console.log("📊 Estado final de versiones:");
  execSync("npm run version:status", { stdio: "inherit" });

  console.log("\n📋 Próximos pasos:");
  console.log("1. npx cap open android  (para Android)");
  console.log("2. npx cap open ios      (para iOS)");
  console.log("3. Compilar y distribuir desde las IDEs");

} catch (error) {
  console.error("❌ Error durante el build:", error.message);
  process.exit(1);
}
