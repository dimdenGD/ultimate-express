// must support immutable option

const express = require("express");
const path = require("path");

const app = express();

// app.use(require("../../middleware"));

app.get('/test', (req, res) => {
    res.sendFile('src/index.js', {
        root: '.',
        maxAge: '1d',
        immutable: true
    });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(await response.text(), response.headers.get('Cache-Control'));
    process.exit(0);
});