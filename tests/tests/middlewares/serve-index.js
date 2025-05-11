// must support serve index

const express = require("express");
const { fetchTest } = require("../../utils");
const serveStatic = require("serve-static");
const serveIndex = require("serve-index");

const app = express();

app.use('/static', serveStatic('src'), (req, res, next) => {
    serveIndex('src')(req, res, next);
});

app.get('/static/asdf', (req, res, next) => {
    res.send(req.url);
});

app.use((req, res, next) => {
    res.status(404).send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const responses = await Promise.all([
        fetchTest('http://localhost:13333/abc'),
        fetchTest('http://localhost:13333/static'),
        fetchTest('http://localhost:13333/static/workers'),
        fetchTest('http://localhost:13333/static/index.js'),
        fetchTest('http://localhost:13333/static/../package.json'),
    ]);

    const texts = await Promise.all(responses.map(r => r.text()));

    console.log(texts.map(i => i.slice(0, 100)));

    process.exit(0);

});