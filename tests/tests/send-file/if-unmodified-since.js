// must support If-Unmodified-Since header

const express = require("express");
const { fetchTest } = require("../../utils");
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

    const response = await fetchTest('http://localhost:13333/test', {
        headers: {
            'If-Unmodified-Since': new Date(0).toUTCString()
        }
    });
    console.log(await response.text(), response.status);
    const response2 = await fetchTest('http://localhost:13333/test', {
        headers: {
            'If-Unmodified-Since': new Date().toUTCString()
        }
    });
    console.log((await response2.text()).slice(0, 50), response2.status);
    process.exit(0);
});