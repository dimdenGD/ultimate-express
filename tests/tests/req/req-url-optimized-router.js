// must support optimized req.url with router

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
const router = express.Router();

router.use((req, res, next) => {
    console.log('router', req.url);
    next();
});

app.use("/:test", router);

app.get("/test", (req, res) => {
    res.send(req.url);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res;
    res = await fetchTest('http://localhost:13333/test');
    console.log(await res.text());
    process.exit(0);
})
