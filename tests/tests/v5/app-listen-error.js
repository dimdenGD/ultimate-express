// v5 app.listen must pass errors to callback instead of throwing
// SKIP_V4: Express 5 changed app.listen error handling

const express = require("express");
const net = require("net");

// Occupy a port first
const blocker = net.createServer();
blocker.listen(13334, () => {
    const app = express({ version: 5 });

    app.get('/test', (req, res) => {
        res.send('ok');
    });

    app.listen(13334, (err) => {
        if (err) {
            console.log('error code: ' + err.code);
        } else {
            console.log('no error');
        }
        blocker.close(() => {
            process.exit(0);
        });
    });
});
