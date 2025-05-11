// must support array and regex routes

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get(['/a', '/b'], (req, res) => {
    res.send('1');
});

app.get(/^\/c|\/d$/, (req, res) => {
    res.send('2');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let outputs = await Promise.all([
        fetchTest('http://localhost:13333/a').then(res => res.text()),
        fetchTest('http://localhost:13333/b').then(res => res.text()),
        fetchTest('http://localhost:13333/c').then(res => res.text()),
        fetchTest('http://localhost:13333/d').then(res => res.text()),
    ]);

    console.log(outputs.join(' '));
    process.exit(0);
});