// must support acceptRanges option

const express = require("express");
const path = require("path");

const app = express();

app.get('/test', (req, res) => {
    res.sendFile('src/index.js', { root: '.', acceptRanges: false });
});

app.use((err, req, res, next) => {
    res.status(500).send(err.message);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test', {
        headers: {
            Range: 'bytes=0-10'
        }
    });
    console.log(await response.text(), response.headers.get('Content-Range'), response.headers.get('Content-Length'), response.status);
    process.exit(0);
});