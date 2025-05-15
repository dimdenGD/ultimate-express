// must support .set, .header, and .setHeader differences

const express = require("express");

const app = express();
app.set('declarative responses', false);

app.get('/set', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.set({
        'x-test': 'test',
        'x-test2': 'test2'
    })
    res.end('set');
});

app.get('/setheader', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader({
        'x-test': 'test',
        'x-test2': 'test2'
    })
    res.end('setheader');
});

app.get('/header', (req, res) => {
    res.header('Content-Type', 'text/plain');
    res.header({
        'x-test': 'test',
        'x-test2': 'test2'
    })
    res.end('header');
});

app.use((err, req, res, next) => {
    res.end('error');
});

app.listen(13333, async () => {
    const response1 = await fetch('http://localhost:13333/set');
    console.log(await response1.text());
    console.log(response1.headers.get('content-type'), response1.headers.get('x-test'), response1.headers.get('x-test2'));

    const response2 = await fetch('http://localhost:13333/setheader');
    console.log(await response2.text());
    console.log(response2.headers.get('content-type'), response2.headers.get('x-test'), response2.headers.get('x-test2'));

    const response3 = await fetch('http://localhost:13333/header');
    console.log(await response3.text());
    console.log(response3.headers.get('content-type'), response3.headers.get('x-test'), response3.headers.get('x-test2'));

    process.exit(0);
});