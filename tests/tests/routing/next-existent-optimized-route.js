// must support existent next("route") (optimized)

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
app.set('env', 'production');

app.get('/test', (req, res, next) => {
    console.log('1');
    next("route");
});

app.get('/test', (req, res) => {
    console.log('2');
    res.send('Hello World');
});

app.get('/test', (req, res) => {
    console.log('3');
    res.send('Hello World');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/test').then(res => res.text());
    console.log(response);
    process.exit(0);
});