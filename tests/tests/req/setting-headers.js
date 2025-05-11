// must support setting req.headers

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get("/test2", (req, res) => {
    res.send(req.ip);
});

app.use(async (req, res, next) => {
    req.headers['X-Test'] = 'test';
    next();
});

app.get("/test", (req, res) => {
    res.send(req.headers['X-Test']);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res;
    res = await fetchTest('http://localhost:13333/test');
    console.log(await res.text());

    process.exit(0);
})
