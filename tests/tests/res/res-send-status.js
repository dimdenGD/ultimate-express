// must support res.sendStatus()

import express from "express";

const app = express();

app.get('/test', (req, res) => {
    res.sendStatus(201);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.status);
    process.exit(0);
});