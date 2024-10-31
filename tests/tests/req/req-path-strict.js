// must support req.path in strict routing

const express = require("express");

const app = express();
app.set('strict routing', true);

app.use("/test/", (req, res, next) => {
    console.log(req.path);
    next();
});

app.get("/test/", (req, res) => {
    console.log(req.path);
    res.send('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    console.log(await fetch('http://localhost:13333/test/').then(res => res.text()));
    process.exit(0);
});