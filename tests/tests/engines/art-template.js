// must support art template engine

import express from "express";
import artTemplate from "express-art-template";

const app = express();

app.engine('art', artTemplate);
app.set('views', 'tests/parts');
app.set('view engine', 'art');
app.set('view options', {
    debug: process.env.NODE_ENV !== 'production',
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

    const response = await fetch('http://localhost:13333/test').then(res => res.text());
    console.log(response);
    process.exit(0);
});