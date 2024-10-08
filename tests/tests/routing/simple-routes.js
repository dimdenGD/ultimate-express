// must support simple routes

const express = require("express");

const app = express();
app.set('etag', false);

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/test', (req, res) => {
    res.send('test');
});

app.get('/test/testy', (req, res) => {
    res.send('testy');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let r1 = await fetch('http://localhost:13333/').then(res => res.text());
    let r2 = await fetch('http://localhost:13333/test').then(res => res.text());
    let r3 = await fetch('http://localhost:13333/testy').then(res => res.text());
    let r4 = await fetch('http://localhost:13333/test/testy').then(res => res.text());

    console.log(r1, r2, r3, r4, (await fetch('http://localhost:13333/')).headers.get('etag'));
    process.exit(0);
});