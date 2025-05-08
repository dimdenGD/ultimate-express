// must support express.static() trailing slash

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.use((req, res, next) => {
    express.static('tests/parts')(req, res, next);
});

app.use((req, res, next) => {
    res.status(404).send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const responses = await Promise.all([
        fetch('http://localhost:13333/trailing', {
            redirect: 'manual'
        }),
        fetch('http://localhost:13333/trailing/', {
            redirect: 'manual'
        }),
        fetch('http://localhost:13333/trailing/')
    ]);

    const texts = await Promise.all(responses.map(r => r.text()));

    console.log(responses.map(r => r.status), responses.map(r => r.headers.get('location')));

    process.exit(0);

});