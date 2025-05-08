// must support express.static() weird paths

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.post('/abc', (req, res) => {
    res.send('ok');
});
app.use('/static', express.static('tests/parts'));

app.use((err, req, res, next) => {
    res.status(500).send(err);
});

app.use((req, res, next) => {
    res.status(404).send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const responses = await Promise.all([
        fetch('http://localhost:13333/static/space%20test.js'),
        fetch('http://localhost:13333/static/parenthesis(1).js'),
        fetch('http://localhost:13333/static/%2E%2E/index.js'),
        fetch('http://localhost:13333/static/percentage%file.txt'),
        fetch('http://localhost:13333/static/percentage%25file.txt'),
    ]);

    console.log(responses.map(r => r.status), await Promise.all(responses.map(r => r.text())));

    process.exit(0);

});