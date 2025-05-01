#!/usr/bin/env node

const { execSync } = require('child_process');
const glob = require('glob');
const fs = require('fs');

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
    const pm = detectPackageManager();
    console.log(`📦 Detected package manager: ${pm}`);

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
    const pm = detectPackageManager();

    let uninstallCommand = '';
    if (pm === 'yarn') {
        uninstallCommand = 'yarn remove express';
    } else if (pm === 'pnpm') {
        uninstallCommand = 'pnpm remove express';
    } else {
        uninstallCommand = 'npm uninstall express';
    }

    console.log(`🔧 Running: ${uninstallCommand}`);
    execSync(uninstallCommand, { stdio: 'inherit' });
}

console.log('🚀 Starting migration to ultimate-express...');

// Step 1: Install ultimate-express
console.log('📦 Installing ultimate-express...');
installUltimateExpress()

// Step 2: Find all .js and .ts files
const files = glob.sync('**/*.{js,cjs,.mjs,.ts,.mts,.cts}', { ignore: 'node_modules/**' });

console.log(`🔎 ${files.length} files found`);
let replacedCount = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Replace require/import statements
    content = content.replace(/require\(['"]express['"]\)/g, `require('ultimate-express')`);
    content = content.replace(/from ['"]express['"]/g, `from 'ultimate-express'`);

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
