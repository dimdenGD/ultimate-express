// Express tests
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const fsAsync = require('fs').promises;
// const spawnAsync = require('util').promisify(spawn);

async function getAllJsFiles(dir) {
    const entries = await fsAsync.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map((entry) => {
        const fullPath = path.join(dir, entry.name);
        return entry.isDirectory() ? getAllJsFiles(fullPath) : fullPath;
    }));
    return Array.prototype.concat(...files).filter((file) => file.endsWith('.js'));
}

const expressTestPath = path.join(__dirname, '/express-tests/');

// patch tests
async function runAllTests() {
    const expressTestFiles = await getAllJsFiles(expressTestPath);
    for (const testFile of expressTestFiles) {
        let testCode = fs.readFileSync(testFile, 'utf8')
            .replace(/express = require\(.*\)/, 'express = require("u-express-local")') // change to u-express-local later
            .replace(/request = require\(.*\)/, 'request = require("uWSSupertest")')

        testCode = testCode
            .replaceAll(`'test/fixtures`, '\'tests/express-tests/test/fixtures')
        
        // if files include /lib/utils, empty file
        if (testCode.includes('lib/utils')) {
            testCode = '';
        }

        fs.writeFileSync(testFile, testCode);
    }

    // spawnAsync('node', ['--test', path.join(__dirname, 'express-tests/')], { stdio: 'inherit' });

}

runAllTests().catch(console.error);