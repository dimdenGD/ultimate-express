// must support declarative .set, .header, and .setHeader differences

const express = require("express");

const app = express();
app.set('declarative responses', true);

app.get('/set', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.end('set');
});

app.get('/set2', (req, res) => {
    res.set({
        'x-test': 'test',
        'x-test2': 'test2'
    });
    res.end('set2');
});

app.get('/set3', (req, res) => {
    res.set('x-test3', ['test3', 'test4']);
    res.end('set3');
});

app.get('/setheader', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.end('setheader');
});

app.get('/setheader2', (req, res) => {
    res.setHeader({
        'x-test': 'test',
        'x-test2': 'test2'
    });
    res.end('setheader2');
});

app.get('/setheader3', (req, res) => {
    res.setHeader('x-test3', ['test3', 'test4']);
    res.end('setheader3');
});

app.get('/header', (req, res) => {
    res.header('Content-Type', 'text/plain');
    res.end('header');
});

app.get('/header2', (req, res) => {
    res.header({
        'x-test': 'test',
        'x-test2': 'test2'
    });
    res.end('header2');
});

app.get('/header3', (req, res) => {
    res.header('x-test3', ['test3', 'test4']);
    res.end('header3');
});

app.use((err, req, res, next) => {
    res.end('error');
});

app.listen(13333, async () => {
    const responses = await Promise.all([
        fetch('http://localhost:13333/set'),
        fetch('http://localhost:13333/set2'),
        fetch('http://localhost:13333/set3'),
        fetch('http://localhost:13333/setheader'),
        fetch('http://localhost:13333/setheader2'),
        fetch('http://localhost:13333/setheader3'),
        fetch('http://localhost:13333/header'),
        fetch('http://localhost:13333/header2'),
        fetch('http://localhost:13333/header3'),
    ]);

    for(const response of responses) {
        console.log(await response.text());
        console.log(response.headers.get('content-type'), response.headers.get('x-test'), response.headers.get('x-test2'));
    }

    process.exit(0);
});