// must support res.status()

import express from "express";

const app = express();

app.get('/test', (req, res) => {
    res.status(201);
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.status);
    process.exit(0);
});