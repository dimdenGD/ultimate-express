// must support res.send() declarative

const express = require("express");

const app = express();

app.set("declarative responses", true);

app.get('/test', (req, res) => {
    res.send('Hello World');
});

app.get('/json', (req, res) => {
    res.send({
        message: 'Hello World'
    });
});

app.get('/buffer', (req, res) => {
    res.send(Buffer.from("asf"));
});

app.get('/null', (req, res) => {
    res.send(null);
});

app.get('/undefined', (req, res) => {
    res.send(undefined);
});

app.get('/number', (req, res) => {
    res.send(202);
});

app.get('/number2', (req, res) => {
    res.send(203, "test");
});

app.get('/boolean', (req, res) => {
    res.send(true);
});

app.get('/arraybuffer', (req, res) => {
    const ab = new ArrayBuffer(10);
    const view = new Uint8Array(ab);
    view[0] = 10;
    res.send(ab);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const responses = [
        await fetch('http://localhost:13333/test'),
        await fetch('http://localhost:13333/json'),
        await fetch('http://localhost:13333/buffer'),
        await fetch('http://localhost:13333/null'),
        await fetch('http://localhost:13333/undefined'),
        await fetch('http://localhost:13333/number'),
        await fetch('http://localhost:13333/number2'),
        await fetch('http://localhost:13333/boolean'),
        await fetch('http://localhost:13333/arraybuffer'),
    ];

    for await(const response of responses) {
        console.log([
            response.url,
            response.status +' '+ response.statusText,
            response.headers.get('content-type'),
            await response.text()
        ]);
    }

    process.exit(0);
});