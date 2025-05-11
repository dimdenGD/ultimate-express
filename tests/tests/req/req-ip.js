// must support req.ip

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get("/test2", (req, res) => {
    res.send(req.ip);
});

app.use(async (req, res, next) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    next();
});

app.get("/test", (req, res) => {
    res.send(req.ip.replace('0000:0000:0000:0000:0000:0000:0000:000', "::"));
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res;
    res = await fetchTest('http://localhost:13333/test');
    console.log(await res.text());

    res = await fetchTest('http://localhost:13333/test');
    console.log(await res.text());

    res = await fetchTest('http://localhost:13333/test');
    console.log(await res.text());

    process.exit(0);
})
