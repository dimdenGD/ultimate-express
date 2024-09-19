// must continue routing by default

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    res.sendFile('src/asdf.js', { root: '.' });
});

app.use((err, req, res, next) => {
    res.status(404).send('404: File not found');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(await response.text());
    process.exit(0);
});