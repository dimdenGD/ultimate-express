// v5 must validate res.status() accepts only integers 100-999
// SKIP_V4: Express 5 validates status code range

const express = require("express");

const app = express({ version: 5 });

app.get('/valid', (req, res) => {
    res.status(201).send('ok');
});

app.get('/invalid-low', (req, res) => {
    try {
        res.status(99);
        res.send('should not reach');
    } catch (e) {
        res.status(500).send('error: ' + e.constructor.name);
    }
});

app.get('/invalid-high', (req, res) => {
    try {
        res.status(1000);
        res.send('should not reach');
    } catch (e) {
        res.status(500).send('error: ' + e.constructor.name);
    }
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const r1 = await fetch('http://localhost:13333/valid');
    console.log(r1.status, await r1.text());

    const r2 = await fetch('http://localhost:13333/invalid-low');
    console.log(await r2.text());

    const r3 = await fetch('http://localhost:13333/invalid-high');
    console.log(await r3.text());

    process.exit(0);
});
