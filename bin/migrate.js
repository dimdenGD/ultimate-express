#!/usr/bin/env node

const { execSync } = require('child_process');
const glob = require('glob');
const fs = require('fs');

console.log('🚀 Starting migration to ultimate-express...');

// Step 1: Install ultimate-express
console.log('📦 Installing ultimate-express...');
execSync('npm install ultimate-express', { stdio: 'inherit' });

// Step 2: Find all .js and .ts files
const files = glob.sync('**/*.{js,cjs,.mjs,ts,.mts,.cts}', { ignore: 'node_modules/**' });

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
console.log('📦 Uninstall express...');
execSync('npm uninstall express', { stdio: 'inherit' });
console.log('🎉 Migration complete!');
