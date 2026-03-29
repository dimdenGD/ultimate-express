// must support res.sendStatus()

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    res.sendStatus(201);
});

app.get('/unknown', (req, res) => {
    // unknown status code should use code as string body
    res.sendStatus(999);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.status, await response.text());

    // sendStatus should set content-type to text/plain
    console.log('content-type:', response.headers.get('content-type'));

    const response2 = await fetch('http://localhost:13333/unknown');
    console.log(response2.status, await response2.text());

    process.exit(0);
});