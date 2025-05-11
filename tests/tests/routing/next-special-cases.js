// special cases for next()

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
app.set('env', 'production');

app.get('/test', (req, res, next) => {
    console.log('first');
    next();
});

app.get('/test', (req, res, next) => {
    console.log('second');
    next('route');
});

app.get('/test', (req, res, next) => {
    console.log('third');
    next('route');
});

app.get('/test', (req, res, next) => {
    console.log('fourth');
    next('route');
}, (req, res, next) => {
    console.log('fifth');
    next();
});

app.get('/test', (req, res, next) => {
    console.log('sixth');
    res.send('done');
});

app.get('/error', (req, res, next) => {
    next(new Error('test error'));
});

app.use((err, req, res, next) => {
    console.log(err.message);
    res.send('error');
});


app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/test').then(res => res.text());
    console.log(response);
    const response2 = await fetchTest('http://localhost:13333/error').then(res => res.text());
    console.log(response2);
    process.exit(0);
});