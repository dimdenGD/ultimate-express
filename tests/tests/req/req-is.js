// must support req.is()

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.all('/test', (req, res) => {
    console.log(req.is('html'));
    console.log(req.is('json'));
    console.log(req.is('text'));
    console.log(req.is('*/*'));
    console.log(req.is('application/json'));
    console.log(req.is('application/*'));
    console.log(req.is('text/html'));
    res.send('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    await fetch('http://localhost:13333/test').then(res => res.text());
    await fetch('http://localhost:13333/test', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'test' })
    }).then(res => res.text());
    await fetch('http://localhost:13333/test', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/html'
        },
        body: '<html><body><h1>Hello, World!</h1></body></html>'
    }).then(res => res.text());
    await fetch('http://localhost:13333/test', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: 'Hello, World!'
    }).then(res => res.text());
    process.exit(0);
});