// must support acceptRanges option

const express = require("express");
const path = require("path");

const app = express();

// app.use(require("../../middleware"));

app.get('/test', (req, res) => {
    res.sendFile('src/index.js', { root: '.', acceptRanges: false });
});

app.get('/test2', (req, res) => {
    res.sendFile('src/index.js', { root: '.', acceptRanges: true });
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
    console.log(await response.text(), response.headers.get('Content-Range'), response.headers.get('Content-Length'), response.status, response.headers.get('accept-ranges'));

    const response2 = await fetch('http://localhost:13333/test2', {
        headers: {
            Range: 'bytes=0-10'
        }
    });
    console.log(await response2.text(), response2.headers.get('Content-Range'), response2.headers.get('Content-Length'), response2.status, response2.headers.get('accept-ranges'));
    process.exit(0);
});