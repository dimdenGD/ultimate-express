// must support req.url

import express from "express";

const app = express();

app.get("/test", (req, res) => {
    res.send(req.protocol);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res;
    res = await fetch('http://localhost:13333/test#asdf');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/router/test?test');
    console.log(await res.text());

    process.exit(0);
})
