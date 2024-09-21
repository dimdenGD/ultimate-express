// must support express.static()

const express = require("express");

const app = express();

app.post('/abc', (req, res) => {
    res.send('ok');
});
app.use('/static', (req, res, next) => {
    express.static('src')(req, res, e => {
        console.log('caught', e);
        next();
    });
});

app.use('/static', express.static('tests/parts'));

app.use((req, res, next) => {
    res.status(404).send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const responses = await Promise.all([
        fetch('http://localhost:13333/abc'),
        fetch('http://localhost:13333/static/workers'),
        fetch('http://localhost:13333/static/'),
        fetch('http://localhost:13333/static/index.js?1'),
        fetch('http://localhost:13333/static/../package.json'),
    ]);

    const texts = await Promise.all(responses.map(r => r.text()));

    console.log(texts.map(t => t.slice(0, 30)));

    process.exit(0);

});