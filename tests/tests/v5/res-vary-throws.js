// v5 res.vary() must throw when called without argument
// SKIP_V4: Express 5 throws on res.vary() without argument

const express = require("express");

const app = express({ version: 5 });

app.get('/test', (req, res) => {
    let threw = false;
    try {
        res.vary();
    } catch (e) {
        threw = true;
    }
    res.send('threw: ' + threw);
});

app.get('/valid', (req, res) => {
    res.vary('Accept');
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const r1 = await fetch('http://localhost:13333/test').then(res => res.text());
    console.log(r1);

    const r2 = await fetch('http://localhost:13333/valid').then(res => res.text());
    console.log(r2);

    process.exit(0);
});
