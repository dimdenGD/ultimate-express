// must support acceptRanges option

const express = require("express");
const { fetchTest } = require("../../utils");
const path = require("path");

const app = express();

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

    const response = await fetchTest('http://localhost:13333/test', {
        headers: {
            Range: 'bytes=0-10'
        }
    });
    console.log(await response.text(), response.headers.get('Content-Range'), response.headers.get('Content-Length'), response.status, response.headers.get('accept-ranges'));

    const response2 = await fetchTest('http://localhost:13333/test2', {
        headers: {
            Range: 'bytes=0-10'
        }
    });
    console.log(await response2.text(), response2.headers.get('Content-Range'), response2.headers.get('Content-Length'), response2.status, response2.headers.get('accept-ranges'));
    process.exit(0);
});