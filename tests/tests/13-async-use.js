// must support async "use"

import express from "express";

const app = express();

app.use(async (req, res, next) => {
    let start = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100));
    res.took = Math.round((Date.now() - start) / 100) * 100;
    next();
});

app.get('/test', (req, res, next) => {
    res.send(`took ${res.took}ms`);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let output1 = await fetch('http://localhost:13333/test').then(res => res.text());

    console.log(output1);
    process.exit(0);
});