// must retain content-length header on empty responses

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    res.set('Content-Length', '100');
    res.end();
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.headers.get('Content-Length'));
    process.exit(0);
});