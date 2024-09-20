// must support If-Range header

const express = require("express");
const path = require("path");

const app = express();

app.get('/test', (req, res) => {
    res.sendFile('src/index.js', { root: '.' });
});

app.use((err, req, res, next) => {
    res.status(500).send(err.message);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test', {
        headers: {
            'Range': 'bytes=0-10',
            'If-Range': new Date(0).toISOString()
        }
    });
    console.log(response.headers.get('Content-Range'), response.headers.get('Content-Length'), response.status);

    const response2 = await fetch('http://localhost:13333/test', {

        headers: {
            'Range': 'bytes=0-10',
            'If-Range': new Date().toISOString()
        }
    });
    console.log(response2.headers.get('Content-Range'), response2.headers.get('Content-Length'), response2.status);

    process.exit(0);
});