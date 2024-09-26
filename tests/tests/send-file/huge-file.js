// must support huge files

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    res.sendFile('tests/parts/huge.jpg', {
        root: '.'
    });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let start = Date.now();
    const response = await fetch('http://localhost:13333/test');
    console.log(response.status, response.headers.get('Content-Length'), Date.now() - start);
    process.exit(0);
});