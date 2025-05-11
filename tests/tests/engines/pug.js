// must support pug engine

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
app.set('view engine', 'pug');
app.set('views', 'tests/parts');
app.set('env', 'production');

app.get('/test', (req, res) => {
    res.locals.asdf = 'locals test';
    res.render('index', { title: 'Hey', message: 'Hello there!' });
});

app.get('/test2', (req, res) => {
    res.locals.asdf = 'locals test';
    res.render('sub-template/', { title: 'Hey', message: 'Hi!' });
});

app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).send(`whoops!`);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/test').then(res => res.text());
    console.log(response);

    const response2 = await fetchTest('http://localhost:13333/test2').then(res => res.text());
    console.log(response2);
    process.exit(0);
});