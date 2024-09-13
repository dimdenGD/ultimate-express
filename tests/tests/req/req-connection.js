// must support req.connection and req.socket

import express from "express";

const app = express();

app.get('/test', (req, res) => {
    console.log(req.connection.remoteAddress.replace("0000:0000:0000:0000:0000:0000:0000:000", "::"));
    console.log(req.connection.localPort);
    res.send('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    await fetch('http://localhost:13333/test').then(res => res.text());

    process.exit(0);
});