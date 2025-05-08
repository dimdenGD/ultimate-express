// must support headers option

const express = require("express");
const path = require("path");

const app = express();

app.use(require("../../middleware"));

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

    const response = await fetch('http://localhost:13333/test');
    console.log(await response.text(), response.headers.get('X-Custom-Header'));
    process.exit(0);
});