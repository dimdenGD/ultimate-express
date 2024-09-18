const childProcess = require("child_process");
const fs = require("fs");
const exitHook = require("exit-hook");
const { exit } = require("process");

let args = process.argv.slice(2);

let u = args.some(arg => arg === '-u');
args = args.filter(arg => arg !== '-u');

let path = args[0];

if (!path) {
    console.error('Usage: node singular.js [-u] <path>');
    process.exit(1);
}

if (u) {
    console.log('Running as µExpress');
    let code = fs.readFileSync(path, 'utf8');
    fs.writeFileSync(path, code.replace('const express = require("express");', 'const express = require("../../../src/index.js");'));
} else {
    let code = fs.readFileSync(path, 'utf8');
    fs.writeFileSync(path, code.replace(`const express = require("../../../src/index.js");`, `const express = require("express");`));
    console.log('Running as normal Express');
}

let node = childProcess.spawn('node', ['-r', './tests/preload.cjs', path]);

node.stdout.on('data', data => {
    console.log(data.toString());
});

node.stderr.on('data', data => {
    console.error(data.toString());
});

exitHook(() => {
    let code = fs.readFileSync(path, 'utf8');
    fs.writeFileSync(path, code.replaceAll(`const express = require("../../../src/index.js");`, `const express = require("express");`));
});
