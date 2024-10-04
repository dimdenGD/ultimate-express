// must support res.render full path

const express = require("express");
const path = require("path");

const app = express();
app.set('view engine', 'pug');
app.set('views', 'tests/parts');
app.set('env', 'production');

app.get('/test', (req, res) => {
    res.locals.asdf = 'locals test';
    res.render(path.join(__dirname, '..', '..', 'parts', 'index.pug'), { title: 'Hey', message: 'Hello there!' });
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