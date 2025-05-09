// must support serve index

const express = require("express");
const serveStatic = require("serve-static");
const serveIndex = require("serve-index");

const app = express();

// app.use(require("../../middleware"));

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
        fetch('http://localhost:13333/abc'),
        fetch('http://localhost:13333/static'),
        fetch('http://localhost:13333/static/workers'),
        fetch('http://localhost:13333/static/index.js'),
        fetch('http://localhost:13333/static/../package.json'),
    ]);

    const texts = await Promise.all(responses.map(r => r.text()));

    console.log(texts.map(i => i.slice(0, 100)));

    process.exit(0);

});