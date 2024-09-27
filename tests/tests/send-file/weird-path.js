// must support weird paths

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    res.sendFile('tests/parts/space%20test.js', {
        root: '.'
    });
});

app.use((err, req, res, next) => {
    res.send(err.message);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.status, response.headers.get('Content-Length'), await response.text());

    process.exit(0);
});