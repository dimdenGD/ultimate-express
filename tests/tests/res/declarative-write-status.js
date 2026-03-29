// must support declarative response write status

const express = require("express");

const app = express();

app.get('/test1', (req, res) => {
    res.sendStatus(404);
});

app.listen(13333, async () => {
    const response1 = await fetch('http://localhost:13333/test1');
    console.log(response1.status);
    console.log(response1.statusText);

    console.log(response1.status, await response1.text());

    // sendStatus should set content-type to text/plain
    console.log('content-type:', response1.headers.get('content-type'));
    
    process.exit(0);
});