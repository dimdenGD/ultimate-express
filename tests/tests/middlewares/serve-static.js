// must support serve static

const express = require("express");
const serveStatic = require("serve-static");

const app = express();

app.post('/abc', (req, res) => {
    res.send('ok');
});
app.use('/static', (req, res, next) => {
    serveStatic('src')(req, res, next);
});

app.use((req, res, next) => {
    res.status(404).send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const responses = await Promise.all([
        fetch('http://localhost:13333/abc'),
        fetch('http://localhost:13333/static/workers'),
        fetch('http://localhost:13333/static/index.js'),
        fetch('http://localhost:13333/static/../package.json'),
    ]);

    const texts = await Promise.all(responses.map(r => r.text()));

    console.log(texts);

    process.exit(0);

});