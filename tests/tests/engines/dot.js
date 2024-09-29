// must support doT engine

const express = require("express");
const dot = require("express-dot-engine");

const app = express();

app.engine('dot', dot.__express);
app.set('view engine', 'dot');
app.set('views', 'tests/parts');
app.set('env', 'production');

app.get('/test', (req, res) => {
    res.locals.asdf = 'locals test';
    res.render('index.ejs', { title: 'Hey', message: 'Hello there!' });
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