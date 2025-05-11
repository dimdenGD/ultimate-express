// must support res.send()

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

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

    const responses = await Promise.all([
        fetchTest('http://localhost:13333/test').then(res => res.text()),
        fetchTest('http://localhost:13333/json').then(res => res.text()),
        fetchTest('http://localhost:13333/buffer').then(res => res.text()),
        fetchTest('http://localhost:13333/null').then(res => res.text()),
        fetchTest('http://localhost:13333/undefined').then(res => res.text()),
        fetchTest('http://localhost:13333/number').then(res => res.text()),
        fetchTest('http://localhost:13333/number2').then(res => res.text()),
        fetchTest('http://localhost:13333/boolean').then(res => res.text()),
        fetchTest('http://localhost:13333/arraybuffer').then(res => res.text()),
    ]);

    const codes = await Promise.all([
        fetchTest('http://localhost:13333/test').then(res => res.status),
        fetchTest('http://localhost:13333/json').then(res => res.status),
        fetchTest('http://localhost:13333/buffer').then(res => res.status),
        fetchTest('http://localhost:13333/null').then(res => res.status),
        fetchTest('http://localhost:13333/undefined').then(res => res.status),
        fetchTest('http://localhost:13333/number').then(res => res.status),
        fetchTest('http://localhost:13333/number2').then(res => res.status),
        fetchTest('http://localhost:13333/boolean').then(res => res.status),
        fetchTest('http://localhost:13333/arraybuffer').then(res => res.status),
    ]);

    console.log(await fetchTest('http://localhost:13333/json').then(res => res.headers.get('content-type')));

    console.log(responses);
    console.log(codes);
    process.exit(0);
});