// must prevent path traversal attacks

const express = require("express");
const path = require("path");

const app = express();

app.get('/test', (req, res) => {
    res.sendFile('src/../../index.js', { root: '.' });
});

app.use((err, req, res, next) => {
    res.status(500).send(err.message);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(await response.text(), response.headers.get('Content-Type').split(';')[0]);
    process.exit(0);
});