// must support express.static() no type files

const express = require("express");

const app = express();
app.set("etag", false);

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
        fetch('http://localhost:13333/static/asdf.it'),
    ]);

    const texts = await Promise.all(responses.map(r => r.text()));

    console.log(texts, responses.map(r => r.headers.get('content-type')));

    process.exit(0);

});