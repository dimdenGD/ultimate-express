// v5 must support named wildcard /*splat path matching
// SKIP_V4: Express 5 path syntax

const express = require("express");

const app = express({ version: 5 });

app.get('/files/*path', (req, res) => {
    res.send('path:' + req.params.path);
});

app.get('/*catchall', (req, res) => {
    res.send('catchall:' + req.params.catchall);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const responses = await Promise.all([
        fetch('http://localhost:13333/files/docs/readme.md').then(res => res.text()),
        fetch('http://localhost:13333/files/image.png').then(res => res.text()),
        fetch('http://localhost:13333/other/page').then(res => res.text()),
    ]);

    console.log(responses);
    process.exit(0);
});
