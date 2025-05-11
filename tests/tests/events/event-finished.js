// must emit finished event

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

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

    const response = await fetchTest('http://localhost:13333/test', {
        method: 'GET',
    });
});