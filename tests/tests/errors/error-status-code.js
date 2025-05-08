// error status code

const express = require("express");

const app = express();

// app.use(require("../../middleware"));

app.set('env', 'production');

app.get('/test', (req, res) => {
    res.status(400);
    throw new Error('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.status, await response.text());
    process.exit(0);
});