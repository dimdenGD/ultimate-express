// must support req.param()

const express = require("express");

const app = express();

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

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    await fetch('http://localhost:13333/test').then(res => res.text());
    await fetch('http://localhost:13333/test?test=test').then(res => res.text());
    await fetch('http://localhost:13333/test?test=test&test2=test2').then(res => res.text());
    await fetch('http://localhost:13333/test?asdf').then(res => res.text());
    await fetch('http://localhost:13333/test/test').then(res => res.text());
    await fetch('http://localhost:13333/test/test/test').then(res => res.text());
    process.exit(0);
});