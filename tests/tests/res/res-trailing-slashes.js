// must support redirect trailing slash

const express = require("express");

const app = express();

app.enable('redirect trailing slash');

app.get('/test', (req, res) => {
    res.send('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await Promise.all([
        fetch('http://localhost:13333/test').then(res => res.text()),
        fetch('http://localhost:13333/test/', { redirect: 'follow'}).then(res => res.text())
    ]);

    console.log(response);
    process.exit(0);
});