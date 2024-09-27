// must prevent path traversal attacks

const express = require("express");
const path = require("path");

const app = express();

app.get('/test', (req, res) => {
    res.sendFile('src/../../index.js', { root: '.' });
});

app.get('/test2', (req, res) => {
    res.sendFile(process.cwd() + '/src/../src/index.js');
});

app.get('/test3', (req, res) => {
    res.sendFile(process.cwd() + '/src/index.js\0');
});


app.use((err, req, res, next) => {
    res.status(500).send(err.message);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(await response.text(), response.headers.get('Content-Type'));
    const response2 = await fetch('http://localhost:13333/test2');
    console.log(await response2.text(), response2.headers.get('Content-Type'));
    const response3 = await fetch('http://localhost:13333/test3');
    console.log(await response3.text(), response3.headers.get('Content-Type'));
    process.exit(0);
});