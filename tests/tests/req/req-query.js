// must support req.query

import express from "express";

const app = express();

app.get('/test', (req, res) => {
    console.log(req.query);
    res.send('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    await fetch('http://localhost:13333/test').then(res => res.text());
    await fetch('http://localhost:13333/test?test=1').then(res => res.text());
    await fetch('http://localhost:13333/test?test=1&test=2').then(res => res.text());
    await fetch('http://localhost:13333/test?test1=1&test2=2').then(res => res.text());
    await fetch('http://localhost:13333/test?test=1&&asdf').then(res => res.text());
    await fetch('http://localhost:13333/test?test').then(res => res.text());

    process.exit(0);
});