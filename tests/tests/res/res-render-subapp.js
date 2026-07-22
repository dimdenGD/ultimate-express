// res.render must use the views and engine of the sub-app handling the request

const express = require("express");

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'tests/parts');
app.set('env', 'production');

const subApp = express();
subApp.set('view engine', 'ejs');
subApp.set('views', 'tests/parts/subapp');
subApp.set('env', 'production');

subApp.get('/page', (req, res) => {
    res.locals.asdf = 'locals test';
    res.render('index.ejs', { message: 'from subapp' });
});

subApp.get('/fallthrough', (req, res, next) => {
    next();
});

app.use('/sub', subApp);

app.use((req, res) => {
    res.locals.asdf = 'locals test';
    res.render('index.ejs', { title: 'Outer', message: 'from outer' });
});

app.use((err, req, res, next) => {
    console.log(err.message.split('\n')[0]);
    res.status(500).send('whoops!');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    // before the router optimization kicks in
    console.log(await fetch('http://localhost:13333/sub/page').then(res => res.text()));
    console.log(await fetch('http://localhost:13333/sub/fallthrough').then(res => res.text()));

    await new Promise(resolve => setTimeout(resolve, 1000));

    // after the router optimization kicks in
    console.log(await fetch('http://localhost:13333/sub/page').then(res => res.text()));
    console.log(await fetch('http://localhost:13333/sub/fallthrough').then(res => res.text()));

    process.exit(0);
});
