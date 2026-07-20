// v5 app.del() must be removed
// SKIP_V4: app.del() removed in Express 5

const express = require("express");

const app = express({ version: 5 });

let threw = false;
try {
    app.del('/test', (req, res) => {
        res.send('ok');
    });
} catch (e) {
    threw = true;
}

console.log('threw: ' + threw);
process.exit(0);
