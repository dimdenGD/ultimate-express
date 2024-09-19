// must support optimized req.url

const express = require("express");

const app = express();

app.use("/:test", (req, res, next) => {
    console.log(req.url);
    next();
});

app.get("/test", (req, res) => {
    res.send(req.url);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res;
    res = await fetch('http://localhost:13333/test');
    console.log(await res.text());
    process.exit(0);
})
