// must support res.end() declarative

const express = require("express");

const app = express();

app.get('/text', (req, res) => {
    res.end('Hello World');
});

app.get('/buffer', (req, res) => {
    const buffer = Buffer.from('Hello World');
    res.end(buffer);
});

app.get('/arraybuffer', (req, res) => {
    const u8 = new Uint8Array([10, 20, 30, 40, 50]);
    res.end(u8);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const responses = await Promise.all([
        fetch('http://localhost:13333/text'),
        fetch('http://localhost:13333/buffer'),
        fetch('http://localhost:13333/arraybuffer'),
    ]);

    for await(const response of responses) {
        console.log(response.url);
        console.log(response.status +' '+ response.statusText);
        console.log(response.headers.get('content-type'));
        console.log(await response.text());
    }

    process.exit(0);
});