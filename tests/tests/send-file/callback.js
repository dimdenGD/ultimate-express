// must support callback

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.get('/test', (req, res) => {
    res.sendFile('src/asdf.js', { root: '.' }, (err) => {
        res.status(500).send(err?.message ? `caught error: ${err.message}` : 'no error');
    });
});

app.use((err, req, res, next) => {
    res.status(500).send(`uncaught error: ${err.message}`);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(await response.text());
    process.exit(0);
});