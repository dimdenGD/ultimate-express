// must emit finished event

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`finish`);
        process.exit(0);
    });
    next()
});

app.get('/test', (req, res) => {
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test', {
        method: 'GET',
    });
});