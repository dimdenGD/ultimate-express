// must support req.path

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.use((req, res, next) => {
    console.log(req.path);
    next();
});

app.get('/test', (req, res) => {
    console.log(req.path);
    res.send('test');
});

app.get('/test2', (req, res) => {
    console.log(req.path);
    res.send('test2');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    await fetchTest('http://localhost:13333/test').then(res => res.text());
    await fetchTest('http://localhost:13333/test2/').then(res => res.text());
    process.exit(0);
});