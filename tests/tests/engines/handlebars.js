// must support handlebars engine

const express = require("express");
const { engine } = require("express-handlebars");

const app = express();

app.use(require("../../middleware"));

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', 'tests/parts');
app.set('env', 'production');
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