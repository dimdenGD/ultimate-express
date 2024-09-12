// must support /* in routes

import express from "express";

const app = express();

app.get('/test/*', (req, res) => {
    res.send('test');
});

app.get('/*', (req, res) => {
    res.send('*');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res = await fetch('http://localhost:13333/test/999');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/test/sdfs/1999');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/999');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/sdfs/1999');
    console.log(await res.text());

    process.exit(0);
})
