#!/usr/bin/env node
const fs = require("fs");

// Leer la versión del package.json
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = packageJson.version;
const [major, minor, patch] = version.split(".").map(Number);

// Calcular versionCode (formato: MAJOR * 10000 + MINOR * 100 + PATCH)
const versionCode = major * 10000 + minor * 100 + patch;

console.log(`🔄 Actualizando versión a: ${version}`);
console.log(`📱 Version Code: ${versionCode}`);

// Actualizar Android build.gradle
const buildGradlePath = "android/app/build.gradle";
if (fs.existsSync(buildGradlePath)) {
  let buildGradle = fs.readFileSync(buildGradlePath, "utf8");
  buildGradle = buildGradle.replace(
    /versionCode \d+/,
    `versionCode ${versionCode}`
  );
  buildGradle = buildGradle.replace(
    /versionName "[^"]*"/,
    `versionName "${version}"`
  );
  fs.writeFileSync(buildGradlePath, buildGradle);
  console.log("✅ Android build.gradle actualizado");
}

// Actualizar iOS project.pbxproj (buscar MARKETING_VERSION y CURRENT_PROJECT_VERSION)
const projectPath = "ios/App/App.xcodeproj/project.pbxproj";
if (fs.existsSync(projectPath)) {
  let projectContent = fs.readFileSync(projectPath, "utf8");
  projectContent = projectContent.replace(
    /MARKETING_VERSION = [^;]+;/g,
    `MARKETING_VERSION = ${version};`
  );
  projectContent = projectContent.replace(
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${versionCode};`
  );
  fs.writeFileSync(projectPath, projectContent);
  console.log("✅ iOS project.pbxproj actualizado");
}

console.log("🎉 ¡Versiones actualizadas correctamente!");
console.log("");
console.log("📋 Próximos pasos:");
console.log("1. npm run build");
console.log("2. npx cap sync");
console.log("3. Compilar y distribuir");
