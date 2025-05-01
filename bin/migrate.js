#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

if (process.argv.includes('--help')) {
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
    process.exit(0);
}

function detectPackageManager() {
  if (fs.existsSync('yarn.lock')) {
    return 'yarn';
  } else if (fs.existsSync('pnpm-lock.yaml')) {
    return 'pnpm';
  } else {
    return 'npm'; // fallback
  }
}

function installUltimateExpress() {

  let installCommand = '';
  if (pm === 'yarn') {
    installCommand = 'yarn add ultimate-express';
  } else if (pm === 'pnpm') {
    installCommand = 'pnpm add ultimate-express';
  } else {
    installCommand = 'npm install ultimate-express';
  }

  console.log(`🔧 Running: ${installCommand}`);
  execSync(installCommand, { stdio: 'inherit' });
}

function uninstallExpress() {
  
  let uninstallCommand = '';
  if (pm === 'yarn') {
    uninstallCommand = 'yarn remove express @types/express';
  } else if (pm === 'pnpm') {
    uninstallCommand = 'pnpm remove express @types/express';
  } else {
    uninstallCommand = 'npm uninstall express @types/express';
  }

  console.log(`🔧 Running: ${uninstallCommand}`);
  execSync(uninstallCommand, { stdio: 'inherit' });
}

console.log('🚀 Starting migration to ultimate-express...');

const pm = detectPackageManager();
console.log(`📦 Detected package manager: ${pm}`);

// Step 1: Install ultimate-express
console.log('📦 Installing ultimate-express...');
installUltimateExpress();

// Step 2: Find all js and ts files
const targetDir = process.argv[2] || '.';
const searchPattern = path.join(targetDir, '**/*.{js,cjs,mjs,ts,mts,cts}');
const files = glob.sync(searchPattern, { ignore: 'node_modules/**' });

console.log(`🔎 ${files.length} files under "${targetDir}"`);
let replacedCount = 0;
files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace require/import statements
  content = content.replace(/require\((['"])express\1\)/g, (match, quote) => `require(${quote}ultimate-express${quote})`);
  content = content.replace(/from (['"])express\1/g, (match, quote) => `from ${quote}ultimate-express${quote}`);

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    replacedCount++;
    console.log(`✅ Updated: ${file}`);
  }
});
console.log(`🔎 ${replacedCount} files migrated`);
console.log('📦 Uninstalling express...');
uninstallExpress();
console.log('🎉 Migration complete!');
