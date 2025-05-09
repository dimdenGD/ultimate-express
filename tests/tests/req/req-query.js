// must support req.query

const express = require("express");

const app = express();

// app.use(require("../../middleware"));

app.get('/test', (req, res) => {
    res.send(req.query);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const responses = await Promise.all([
        fetch('http://localhost:13333/test').then(res => res.text()),
        fetch('http://localhost:13333/test?test=1').then(res => res.text()),
        fetch('http://localhost:13333/test?test=1&test=2').then(res => res.text()),
        fetch('http://localhost:13333/test?test1=1&test2=2').then(res => res.text()),
        fetch('http://localhost:13333/test?test=1&&asdf').then(res => res.text()),
        fetch('http://localhost:13333/test?test').then(res => res.text()),
        fetch('http://localhost:13333/test?a[b]=c').then(res => res.text()),
        fetch('http://localhost:13333/test?a.a=c&a.b=d').then(res => res.text()),
        fetch('http://localhost:13333/test?a%2Ea=c&a%2Eb=d').then(res => res.text()),
        fetch('http://localhost:13333/test?a%5Ba%5D=c&a%5Bb%5D=d').then(res => res.text()),
    ]);

    console.log(responses);

    process.exit(0);
});