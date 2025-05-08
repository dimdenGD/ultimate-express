// must support app chaining

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.use((req, res, next) => {
    res.setHeader('a', '1')
    next();
}).use((req, res, next) => {
    res.setHeader('b', '1')
    next();
}).post('/abc', (req, res) => {
    res.send('abc');
}).get('/def', (req, res) => {
    res.send('def');
});

app.listen(13333, async () => {
    const output = await fetch('http://localhost:13333/abc', { method: 'POST' });
    console.log(output.headers.get('etag'), await output.text());
    const output2 = await fetch('http://localhost:13333/def');
    console.log(output2.headers.get('etag'), await output2.text());
    process.exit(0);
});