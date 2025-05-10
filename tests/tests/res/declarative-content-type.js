// must support declarative response content-type

const express = require("express");

const app = express();

app.get('/test1', (req, res) => {
    res.setHeader('Content-Type', 'text/plain').send(`test1`);
});

app.get('/test2', (req, res) => {
    res.send(`test2`);
});

app.listen(13333, async () => {
    const response1 = await fetch('http://localhost:13333/test1');
    console.log(response1.headers.get('content-type'));
    console.log(await response1.text());

    const response2 = await fetch('http://localhost:13333/test2');
    console.log(response2.headers.get('content-type'));
    console.log(await response2.text());
    
    process.exit(0);
});