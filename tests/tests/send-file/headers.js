// must support headers option

const express = require("express");
const { fetchTest } = require("../../utils");
const path = require("path");

const app = express();

app.get('/test', (req, res) => {
    res.sendFile('src/index.js', {
        root: '.',
        headers: {
            'X-Custom-Header': 'custom-value'
        }
    });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/test');
    console.log(await response.text(), response.headers.get('X-Custom-Header'));
    process.exit(0);
});