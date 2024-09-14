// must support res.sendFile()

import express from "express";

const app = express();

app.get('/test', (req, res) => {
    res.sendFile('src/index.js', { root: "." });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(await response.text());
    process.exit(0);
});