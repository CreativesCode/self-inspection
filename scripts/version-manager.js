#!/usr/bin/env node
const fs = require("fs");

class VersionManager {
  constructor() {
    this.configPath = "version.config.json";
    this.packageJsonPath = "package.json";
    this.androidBuildPath = "android/app/build.gradle";
    this.iosProjectPath = "ios/App/App.xcodeproj/project.pbxproj";
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, "utf8"));
      }
    } catch (error) {
      console.error("❌ Error cargando configuración:", error.message);
    }
    
    // Configuración por defecto
    return {
      version: "1.0.0",
      autoIncrement: true,
      lastBuild: null,
      buildCount: 0,
      versionCode: 10000
    };
  }

  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error("❌ Error guardando configuración:", error.message);
    }
  }

  parseVersion(version) {
    const parts = version.split(".").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new Error("Formato de versión inválido. Use: MAJOR.MINOR.PATCH (ej: 1.5.0)");
    }
    return { major: parts[0], minor: parts[1], patch: parts[2] };
  }

  calculateVersionCode(major, minor, patch) {
    return major * 10000 + minor * 100 + patch;
  }

  setVersion(version) {
    try {
      const { major, minor, patch } = this.parseVersion(version);
      const versionCode = this.calculateVersionCode(major, minor, patch);
      
      this.config.version = version;
      this.config.versionCode = versionCode;
      this.config.lastBuild = new Date().toISOString();
      
      this.updateAllFiles(version, versionCode);
      this.saveConfig();
      
      console.log(`✅ Versión establecida a: ${version}`);
      console.log(`📱 Version Code: ${versionCode}`);
      
    } catch (error) {
      console.error("❌ Error estableciendo versión:", error.message);
      process.exit(1);
    }
  }

  incrementVersion(type = "patch") {
    const { major, minor, patch } = this.parseVersion(this.config.version);
    let newVersion;
    
    switch (type) {
      case "major":
        newVersion = `${major + 1}.0.0`;
        break;
      case "minor":
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case "patch":
      default:
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
    }
    
    this.setVersion(newVersion);
  }

  autoIncrement() {
    if (this.config.autoIncrement) {
      this.config.buildCount++;
      this.incrementVersion("patch");
      
      // En Appflow, también actualizar el archivo de configuración
      if (process.env.APPFLOW_BUILD === 'true') {
        console.log("🌐 Detectado build en Appflow - guardando cambios...");
        this.saveConfig();
      }
    }
  }

  updateAllFiles(version, versionCode) {
    // Actualizar package.json
    this.updatePackageJson(version);
    
    // Actualizar Android
    this.updateAndroid(version, versionCode);
    
    // Actualizar iOS
    this.updateiOS(version, versionCode);
  }

  updatePackageJson(version) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, "utf8"));
      packageJson.version = version;
      fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log("✅ package.json actualizado");
    } catch (error) {
      console.error("❌ Error actualizando package.json:", error.message);
    }
  }

  updateAndroid(version, versionCode) {
    try {
      if (fs.existsSync(this.androidBuildPath)) {
        let buildGradle = fs.readFileSync(this.androidBuildPath, "utf8");
        buildGradle = buildGradle.replace(/versionCode \d+/, `versionCode ${versionCode}`);
        buildGradle = buildGradle.replace(/versionName "[^"]*"/, `versionName "${version}"`);
        fs.writeFileSync(this.androidBuildPath, buildGradle);
        console.log("✅ Android build.gradle actualizado");
      }
    } catch (error) {
      console.error("❌ Error actualizando Android:", error.message);
    }
  }

  updateiOS(version, versionCode) {
    try {
      if (fs.existsSync(this.iosProjectPath)) {
        let projectContent = fs.readFileSync(this.iosProjectPath, "utf8");
        projectContent = projectContent.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`);
        projectContent = projectContent.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${versionCode};`);
        fs.writeFileSync(this.iosProjectPath, projectContent);
        console.log("✅ iOS project.pbxproj actualizado");
      }
    } catch (error) {
      console.error("❌ Error actualizando iOS:", error.message);
    }
  }

  showStatus() {
    console.log("\n📊 Estado del Versionado:");
    console.log(`🔢 Versión actual: ${this.config.version}`);
    console.log(`📱 Version Code: ${this.config.versionCode}`);
    console.log(`🔄 Auto-incremento: ${this.config.autoIncrement ? 'Activado' : 'Desactivado'}`);
    console.log(`📈 Builds realizados: ${this.config.buildCount}`);
    if (this.config.lastBuild) {
      console.log(`⏰ Último build: ${new Date(this.config.lastBuild).toLocaleString()}`);
    }
    console.log("");
  }

  toggleAutoIncrement() {
    this.config.autoIncrement = !this.config.autoIncrement;
    this.saveConfig();
    console.log(`🔄 Auto-incremento ${this.config.autoIncrement ? 'activado' : 'desactivado'}`);
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];
const value = args[1];

const versionManager = new VersionManager();

switch (command) {
  case "set":
    if (!value) {
      console.error("❌ Debe especificar una versión. Ejemplo: npm run version:set -- 1.5.0");
      process.exit(1);
    }
    versionManager.setVersion(value);
    break;
    
  case "patch":
    versionManager.incrementVersion("patch");
    break;
    
  case "minor":
    versionManager.incrementVersion("minor");
    break;
    
  case "major":
    versionManager.incrementVersion("major");
    break;
    
  case "auto":
    versionManager.autoIncrement();
    break;
    
  case "status":
    versionManager.showStatus();
    break;
    
  case "toggle-auto":
    versionManager.toggleAutoIncrement();
    break;
    
  default:
    console.log("📋 Comandos disponibles:");
    console.log("  npm run version:set -- 1.5.0    - Establecer versión específica");
    console.log("  npm run version:patch            - Incrementar patch (1.5.0 → 1.5.1)");
    console.log("  npm run version:minor            - Incrementar minor (1.5.0 → 1.6.0)");
    console.log("  npm run version:major            - Incrementar major (1.5.0 → 2.0.0)");
    console.log("  npm run version:auto             - Auto-incrementar patch");
    console.log("  npm run version:status           - Mostrar estado actual");
    console.log("  npm run version:toggle-auto      - Activar/desactivar auto-incremento");
    break;
}
