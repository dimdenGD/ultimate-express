// must support larger files

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    res.sendFile('tests/parts/big.jpg', {
        root: '.'
    });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.status, response.headers.get('Content-Length'), response.headers.get('Content-Type'));
    process.exit(0);
});