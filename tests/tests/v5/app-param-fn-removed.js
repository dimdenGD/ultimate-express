// v5 app.param(fn) must be removed
// SKIP_V4: app.param(fn) removed in Express 5

const express = require("express");

const app = express({ version: 5 });

let threw = false;
try {
    app.param(function (name, fn) {
        return fn;
    });
} catch (e) {
    threw = true;
}

console.log('threw: ' + threw);
process.exit(0);
