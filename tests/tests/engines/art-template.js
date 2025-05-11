// must support art template engine

const express = require("express");
const { fetchTest } = require("../../utils");
const artTemplate = require("express-art-template");

const app = express();

app.engine('art', artTemplate);
app.set('env', 'production');
app.set('views', 'tests/parts');
app.set('view engine', 'art');
app.set('view options', {
    ignore: ['Math', 'Date', 'JSON', 'encodeURIComponent'],
    minimize: false
});

app.get('/test', (req, res) => {
    res.locals.asdf = 'locals test';
    res.render('index', { title: 'Hey', message: 'Hello there!' });
});

app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).send(`whoops!`);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/test').then(res => res.text());
    console.log(response);
    process.exit(0);
});