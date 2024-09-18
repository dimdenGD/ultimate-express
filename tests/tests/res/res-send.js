// must support res.send()

const express = require("express");

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

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const responses = await Promise.all([
        fetch('http://localhost:13333/test').then(res => res.text()),
        fetch('http://localhost:13333/json').then(res => res.text()),
        fetch('http://localhost:13333/buffer').then(res => res.text()),
        fetch('http://localhost:13333/null').then(res => res.text()),
        fetch('http://localhost:13333/undefined').then(res => res.text()),
        fetch('http://localhost:13333/number').then(res => res.text()),
        fetch('http://localhost:13333/number2').then(res => res.text()),
        fetch('http://localhost:13333/boolean').then(res => res.text()),
    ]);

    const codes = await Promise.all([
        fetch('http://localhost:13333/test').then(res => res.status),
        fetch('http://localhost:13333/json').then(res => res.status),
        fetch('http://localhost:13333/buffer').then(res => res.status),
        fetch('http://localhost:13333/null').then(res => res.status),
        fetch('http://localhost:13333/undefined').then(res => res.status),
        fetch('http://localhost:13333/number').then(res => res.status),
        fetch('http://localhost:13333/number2').then(res => res.status),
        fetch('http://localhost:13333/boolean').then(res => res.status),
    ]);

    console.log(responses);
    console.log(codes);
    process.exit(0);
});