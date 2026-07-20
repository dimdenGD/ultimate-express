// v5 express.static must default dotfiles to 'ignore'
// SKIP_V4: Express 5 changed dotfiles default to ignore

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express({ version: 5 });

// Create a temp dotfile directory structure for testing
const testDir = path.join(__dirname, '../../parts');

app.use(express.static(testDir));

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    // Try to access a dotfile directory (.test/index.html)
    const r1 = await fetch('http://localhost:13333/.test/index.html');
    console.log('dotdir status: ' + r1.status);

    // Try to access a dotfile (.test.txt)
    const r2 = await fetch('http://localhost:13333/.test.txt');
    console.log('dotfile status: ' + r2.status);

    // Normal file should still work
    const r3 = await fetch('http://localhost:13333/index.html');
    console.log('normal status: ' + r3.status);

    process.exit(0);
});
