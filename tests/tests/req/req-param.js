// must support req.param()

const express = require("express");

const app = express();

app.set('body methods', ['POST', 'PUT', 'PATCH', 'DELETE']);
app.use(express.json());

app.delete('/delete', (req, res) => {
    console.log(req.param('test'));
    console.log(req.param('test', 'default'));
    res.send('post');
});

app.all('/test', (req, res) => {
    console.log(req.param('test'));
    console.log(req.param('test', 'default'));
    res.send('test');
});

app.get('/test/:test', (req, res) => {
    console.log(req.param('test'));
    console.log(req.param('test', 'default'));
    res.send('test');
});

app.post('/falsy', (req, res) => {
    const results = [
        req.param('zero'),
        req.param('empty'),
        req.param('missing', 'fallback'),
    ];
    res.json(results);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    await fetch('http://localhost:13333/delete', {
        method: 'DELETE',
        body: JSON.stringify({test: 'aaa'}),
        headers: {
            "Content-Type": "application/json",
        }
    }).then(res => res.text());
    await fetch('http://localhost:13333/delete', {
        method: 'DELETE',
        body: JSON.stringify({}),
        headers: {
            "Content-Type": "application/json",
        }
    }).then(res => res.text());

    await fetch('http://localhost:13333/test?test=test').then(res => res.text());
    await fetch('http://localhost:13333/test?test=test&test2=test2').then(res => res.text());
    await fetch('http://localhost:13333/test?asdf').then(res => res.text());
    await fetch('http://localhost:13333/test/test').then(res => res.text());
    await fetch('http://localhost:13333/test/test/test').then(res => res.text());

    const falsy = await fetch('http://localhost:13333/falsy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zero: 0, empty: '' }),
    }).then(res => res.text());
    console.log('falsy:', falsy);

    process.exit(0);
});