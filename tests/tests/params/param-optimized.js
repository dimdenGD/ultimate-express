// must support optimized app.param

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.param('test', async function (req, res, next, id) {
    console.log('param:', id);
    if(id === 'test') {
        next('route');
    } else {
        next();
    }
});

app.use("/:test", (req, res, next) => {
    console.log('match', req.url);
    next();
});

app.get("/test", (req, res) => {
    res.send(req.url);
});

app.get("/toast", (req, res) => {
    res.send(req.url);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res;
    res = await fetchTest('http://localhost:13333/test');
    console.log(await res.text());
    res = await fetchTest('http://localhost:13333/toast');
    console.log(await res.text());
    process.exit(0);
})
