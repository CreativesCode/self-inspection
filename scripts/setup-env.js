#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const envExamplePath = path.join(rootDir, "env.example");
const envPath = path.join(rootDir, ".env");

console.log("🔧 Configurando variables de entorno para el frontend...");

try {
  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log(
      "⚠️  El archivo .env ya existe. ¿Quieres sobrescribirlo? (y/N)"
    );
    process.stdin.once("data", (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === "y" || answer === "yes") {
        createEnvFile();
      } else {
        console.log("❌ Configuración cancelada.");
        process.exit(0);
      }
    });
  } else {
    createEnvFile();
  }
} catch (error) {
  console.error("❌ Error durante la configuración:", error.message);
  process.exit(1);
}

function createEnvFile() {
  try {
    // Read the example file
    const envExample = fs.readFileSync(envExamplePath, "utf8");

    // Create .env file
    fs.writeFileSync(envPath, envExample);

    console.log("✅ Archivo .env creado exitosamente!");
    console.log("📁 Ubicación:", envPath);
  } catch (error) {
    console.error("❌ Error creando el archivo .env:", error.message);
    process.exit(1);
  }
}
