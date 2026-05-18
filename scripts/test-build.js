#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

console.log("🧪 Testing Next.js SPA build process...");

try {
  // Clean previous builds
  console.log("🧹 Cleaning previous builds...");
  if (fs.existsSync(path.join(rootDir, ".next"))) {
    fs.rmSync(path.join(rootDir, ".next"), { recursive: true, force: true });
  }
  if (fs.existsSync(path.join(rootDir, "out"))) {
    fs.rmSync(path.join(rootDir, "out"), { recursive: true, force: true });
  }

  // Install dependencies if needed
  console.log("📦 Installing dependencies...");
  execSync("npm ci", { stdio: "inherit", cwd: rootDir });

  // Run build
  console.log("🏗️  Building Next.js SPA...");
  execSync("npm run build", { stdio: "inherit", cwd: rootDir });

  // Verify output
  const outDir = path.join(rootDir, "out");
  if (!fs.existsSync(outDir)) {
    throw new Error("Build output directory 'out' not found");
  }

  const indexHtml = path.join(outDir, "index.html");
  if (!fs.existsSync(indexHtml)) {
    throw new Error("index.html not found in build output");
  }

  console.log("✅ Build successful!");
  console.log(`📁 Output directory: ${outDir}`);
  console.log(`📄 Main file: ${indexHtml}`);
  
  // List some key files
  const files = fs.readdirSync(outDir);
  console.log(`📋 Generated ${files.length} files/directories`);
  
  // Check for common SPA files
  const has404 = fs.existsSync(path.join(outDir, "404.html"));
  const hasStatic = fs.existsSync(path.join(outDir, "_next"));
  
  console.log(`🔍 404.html: ${has404 ? "✅" : "❌"}`);
  console.log(`🔍 Static assets: ${hasStatic ? "✅" : "❌"}`);

} catch (error) {
  console.error("❌ Build test failed:", error.message);
  process.exit(1);
}
