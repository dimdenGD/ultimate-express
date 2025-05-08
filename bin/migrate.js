#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const glob = require("glob");

const args = process.argv.slice(2); // ['migrate', './src', ...]
const command = args?.[0] || "--help";

if (command === "--help" || command === "-h" || command === "help") {
  console.log(`
🚀 ultimate-express migrate

Usage:
  ultimate-express migrate [directory]

Arguments:
  [directory]    Optional. Base folder to start searching.
                 Default: current directory (.)

Examples:
  ultimate-express migrate ./src
  ultimate-express migrate
    `);
} else if (command === "migrate" || command === "m") {
  let pm; // package manager
  const toDiagnostic = []; // for diagnostic messages
  let pk = {}; // package.json

  function detectPackageManager() {
    if (fs.existsSync("yarn.lock")) {
      return "yarn";
    } else if (fs.existsSync("pnpm-lock.yaml")) {
      return "pnpm";
    } else {
      return "npm"; // fallback
    }
  }

  function installUltimateExpress() {
    let installCommand = "";
    if (pm === "yarn") {
      installCommand = "yarn add ultimate-express";
    } else if (pm === "pnpm") {
      installCommand = "pnpm add ultimate-express";
    } else {
      installCommand = "npm install ultimate-express";
    }

    console.log(`🔧 Running: ${installCommand}`);
    execSync(installCommand, { stdio: "inherit" });
  }

  function uninstallExpress() {
    let uninstallCommand = "";
    if (pm === "yarn") {
      uninstallCommand = "yarn remove express @types/express";
    } else if (pm === "pnpm") {
      uninstallCommand = "pnpm remove express @types/express";
    } else {
      uninstallCommand = "npm uninstall express @types/express";
    }

    console.log(`🔧 Running: ${uninstallCommand}`);
    execSync(uninstallCommand, { stdio: "inherit" });
  }

  function checkIfHasModule(file, content, moduleName) {
    if (
      content.includes(`require("${moduleName}")`) ||
      content.includes(`from "${moduleName}"`) ||
      content.includes(`require('${moduleName}')`) ||
      content.includes(`from '${moduleName}'`)
    )
      toDiagnostic.push(
        `⚠️ ${file} uses NodeJS "${moduleName}" module, this could be a problem.`
      );
  }

  console.log("🚀 Starting migration to ultimate-express...");

  if (fs.existsSync(".git")) {
    console.log("🔧 Checking for uncommitted changes...");
    const status = execSync("git status --porcelain", { encoding: "utf8" });
    if (status) {
      console.log(
        "🚨 Uncommitted changes detected. Please commit or stash them before running this script."
      );
      process.exit(1);
    }
  }

  try {
    pk = JSON.parse(fs.readFileSync("package.json", "utf8"));
  } catch (error) {
    console.log(`🚨 package.json not found`);
    process.exit(1);
  }

  pm = detectPackageManager();
  console.log(`📦 Detected package manager: ${pm}`);

  // Step 1: Install ultimate-express
  console.log("📦 Installing ultimate-express...");
  installUltimateExpress();

  // Step 2: Find all js and ts files
  const targetDir = args?.[1] || "."; // current directory
  const searchPattern = path.join(targetDir, "**/*.{js,cjs,mjs,ts,mts,cts}");
  const files = glob.sync(searchPattern, { ignore: "node_modules/**" });

  console.log(`🔎 ${files.length} files under "${targetDir}"`);
  let replacedCount = 0;
  files.forEach((file) => {
    let content = fs.readFileSync(file, "utf8");
    let originalContent = content;

    // Replace require/import statements
    content = content.replace(
      /require\((['"])express\1\)/g,
      (match, quote) => `require(${quote}ultimate-express${quote})`
    );
    content = content.replace(
      /from (['"])express\1/g,
      (match, quote) => `from ${quote}ultimate-express${quote}`
    );

    if (content !== originalContent) {
      fs.writeFileSync(file, content, "utf8");
      replacedCount++;
      console.log(`✅ Updated: ${file}`);
    }

    checkIfHasModule(file, content, "https");
    checkIfHasModule(file, content, "http");
  });

  console.log(`🔎 ${replacedCount} files migrated`);
  console.log("📦 Uninstalling express...");
  uninstallExpress();
  console.log("🎉 Migration complete!");

  let hasIssue = false;
  if (pk.dependencies) {
    if (pk.dependencies["express-async-errors"]) {
      hasIssue = true;
      console.log(
        `🚨 dependency "express-async-errors" doesn't work, use app.set('catch async errors', true) instead.`
      );
    }
    if (pk.dependencies["http-proxy-middleware"]) {
      hasIssue = true;
      console.log(`🚨 dependency "http-proxy-middleware" doesn't work.`);
    }
    if (pk.dependencies["body-parser"]) {
      hasIssue = true;
      console.log(
        `⚠️ Instead of "body-parser" use express.text() for better performance.`
      );
    }
    if (pk.dependencies["serve-static"]) {
      hasIssue = true;
      console.log(
        `⚠️ Instead of "serve-static" use express.static() for better performance.`
      );
    }
  }
  if (toDiagnostic.length > 0) {
    hasIssue = true;
    for (const message of toDiagnostic) {
      console.log(message);
    }
  }
  if (hasIssue) {
    console.log(
      `🚨 Some issues were detected, please check https://github.com/dimdenGD/ultimate-express`
    );
  }
} else {
  console.log(`🚨 Unknown command "${command}"`);
  console.log(`Run "ultimate-express --help" for a list of commands.`);
}
