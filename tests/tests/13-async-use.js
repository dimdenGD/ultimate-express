// must support simple "use"

import express from "express";

const app = express();

app.use(async (req, res, next) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    next();
});

app.get('/test', (req, res, next) => {
    res.send('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let output1 = await fetch('http://localhost:13333/test').then(res => res.text());

    console.log(output1);
    process.exit(0);
});